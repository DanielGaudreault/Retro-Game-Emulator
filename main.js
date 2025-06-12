document.addEventListener('DOMContentLoaded', function() {
    // Initialize the emulator
    const nes = new jsnes.NES({
        onFrame: function(frameBuffer) {
            const canvas = document.getElementById("nes-screen");
            const ctx = canvas.getContext("2d");
            const imageData = ctx.createImageData(256, 240);
            
            for (let i = 0; i < 256 * 240; i++) {
                const j = i * 4;
                const pixel = frameBuffer[i];
                
                imageData.data[j] = (pixel >> 16) & 0xff;
                imageData.data[j+1] = (pixel >> 8) & 0xff;
                imageData.data[j+2] = pixel & 0xff;
                imageData.data[j+3] = 0xff;
            }
            
            ctx.putImageData(imageData, 0, 0);
        },
        onAudioSample: function(left, right) {
            // Audio would go here
        }
    });

    // DOM elements
    const loadBtn = document.getElementById("load-btn");
    const resetBtn = document.getElementById("reset-btn");
    const saveBtn = document.getElementById("save-btn");
    const loadStateBtn = document.getElementById("load-state-btn");
    const gameList = document.getElementById("game-list");
    const gamesList = document.getElementById("games");
    const gameStatus = document.getElementById("game-status");

    // Game data - REPLACE WITH YOUR ACTUAL ROM FILES
    const games = [
        { name: "Super Mario Bros.", file: "roms/super_mario_bros.nes" },
        { name: "Donkey Kong", file: "roms/donkey_kong.nes" }
    ];

    // Populate game list
    games.forEach(game => {
        const li = document.createElement("li");
        li.textContent = game.name;
        li.dataset.rom = game.file;
        li.addEventListener("click", function() {
            loadGame(this.dataset.rom);
            gameList.classList.add("hidden");
        });
        gamesList.appendChild(li);
    });

    // Key mappings
    const KEYMAP = {
        88: 'A',      // X
        90: 'B',      // Z
        13: 'START',  // Enter
        16: 'SELECT', // Shift
        38: 'UP',     // Up
        40: 'DOWN',   // Down
        37: 'LEFT',   // Left
        39: 'RIGHT'   // Right
    };

    // Button event listeners
    loadBtn.addEventListener("click", function() {
        gameList.classList.toggle("hidden");
    });

    resetBtn.addEventListener("click", function() {
        nes.reset();
        gameStatus.textContent = "Game reset";
    });

    saveBtn.addEventListener("click", function() {
        const state = nes.toJSON();
        localStorage.setItem("nes_save_state", JSON.stringify(state));
        gameStatus.textContent = "Game state saved";
    });

    loadStateBtn.addEventListener("click", function() {
        const savedState = localStorage.getItem("nes_save_state");
        if (savedState) {
            nes.fromJSON(JSON.parse(savedState));
            gameStatus.textContent = "Game state loaded";
        } else {
            gameStatus.textContent = "No saved state found";
        }
    });

    // Keyboard controls
    document.addEventListener("keydown", function(e) {
        const key = KEYMAP[e.keyCode];
        if (key) {
            nes.buttonDown(1, key);
            highlightKey(key, true);
            e.preventDefault();
        }
    });

    document.addEventListener("keyup", function(e) {
        const key = KEYMAP[e.keyCode];
        if (key) {
            nes.buttonUp(1, key);
            highlightKey(key, false);
            e.preventDefault();
        }
    });

    // On-screen controller buttons
    document.querySelectorAll(".controller button").forEach(button => {
        button.addEventListener("mousedown", function() {
            const key = this.dataset.key;
            nes.buttonDown(1, key);
            this.classList.add("active");
        });
        
        button.addEventListener("mouseup", function() {
            const key = this.dataset.key;
            nes.buttonUp(1, key);
            this.classList.remove("active");
        });
    });

    // Helper function to highlight keys
    function highlightKey(key, isPressed) {
        const button = document.querySelector(`.controller button[data-key="${key}"]`);
        if (button) {
            button.classList.toggle("active", isPressed);
        }
    }

    // Load game function
    function loadGame(romPath) {
        fetch(romPath)
            .then(response => {
                if (!response.ok) throw new Error("Failed to load ROM");
                return response.arrayBuffer();
            })
            .then(buffer => {
                const rom = new Uint8Array(buffer);
                nes.loadROM(rom);
                nes.reset();
                gameStatus.textContent = `Playing: ${romPath.split('/').pop()}`;
                
                // Start the emulation loop
                function frame() {
                    nes.frame();
                    requestAnimationFrame(frame);
                }
                frame();
            })
            .catch(error => {
                console.error("Error loading ROM:", error);
                gameStatus.textContent = "Error loading game";
                alert(`Failed to load game: ${error.message}\n\nMake sure:\n1. The ROM file exists at ${romPath}\n2. You're running on a web server (not file://)\n3. The ROM is in the correct format`);
            });
    }

    // Start with a blank screen
    const canvas = document.getElementById("nes-screen");
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
});
