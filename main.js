// Initialize the emulator
const nes = new jsnes.NES({
    onFrame: (frameBuffer) => {
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
    onAudioSample: (left, right) => {
        // Audio handling would go here
    }
});

// DOM elements
const loadBtn = document.getElementById("load-btn");
const resetBtn = document.getElementById("reset-btn");
const saveBtn = document.getElementById("save-btn");
const loadStateBtn = document.getElementById("load-state-btn");
const gameList = document.getElementById("game-list");

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

// Controller state
const controller = {
    A: false,
    B: false,
    START: false,
    SELECT: false,
    UP: false,
    DOWN: false,
    LEFT: false,
    RIGHT: false
};

// Event listeners
loadBtn.addEventListener("click", () => {
    gameList.classList.toggle("hidden");
});

resetBtn.addEventListener("click", () => {
    nes.reset();
});

saveBtn.addEventListener("click", () => {
    const state = nes.toJSON();
    localStorage.setItem("nes_save_state", JSON.stringify(state));
    alert("Game state saved!");
});

loadStateBtn.addEventListener("click", () => {
    const savedState = localStorage.getItem("nes_save_state");
    if (savedState) {
        nes.fromJSON(JSON.parse(savedState));
        alert("Game state loaded!");
    } else {
        alert("No saved state found!");
    }
});

// Game selection
document.querySelectorAll("#game-list li").forEach(item => {
    item.addEventListener("click", () => {
        const romPath = item.getAttribute("data-rom");
        loadGame(romPath);
        gameList.classList.add("hidden");
    });
});

// Load a ROM
function loadGame(romPath) {
    fetch(romPath)
        .then(response => response.arrayBuffer())
        .then(buffer => {
            const rom = new Uint8Array(buffer);
            nes.loadROM(rom);
            nes.start();
        })
        .catch(error => {
            console.error("Error loading ROM:", error);
            alert("Failed to load game. Please try another.");
        });
}

// Keyboard controls
document.addEventListener("keydown", (e) => {
    const key = KEYMAP[e.keyCode];
    if (key && !controller[key]) {
        controller[key] = true;
        nes.buttonDown(1, key);
    }
});

document.addEventListener("keyup", (e) => {
    const key = KEYMAP[e.keyCode];
    if (key) {
        controller[key] = false;
        nes.buttonUp(1, key);
    }
});

// On-screen controller buttons
document.querySelectorAll(".controller button").forEach(button => {
    button.addEventListener("mousedown", () => {
        const key = button.textContent;
        if (key === "↑") nes.buttonDown(1, "UP");
        else if (key === "↓") nes.buttonDown(1, "DOWN");
        else if (key === "←") nes.buttonDown(1, "LEFT");
        else if (key === "→") nes.buttonDown(1, "RIGHT");
        else if (key === "A") nes.buttonDown(1, "A");
        else if (key === "B") nes.buttonDown(1, "B");
        else if (key === "Start") nes.buttonDown(1, "START");
        else if (key === "Select") nes.buttonDown(1, "SELECT");
    });

    button.addEventListener("mouseup", () => {
        const key = button.textContent;
        if (key === "↑") nes.buttonUp(1, "UP");
        else if (key === "↓") nes.buttonUp(1, "DOWN");
        else if (key === "←") nes.buttonUp(1, "LEFT");
        else if (key === "→") nes.buttonUp(1, "RIGHT");
        else if (key === "A") nes.buttonUp(1, "A");
        else if (key === "B") nes.buttonUp(1, "B");
        else if (key === "Start") nes.buttonUp(1, "START");
        else if (key === "Select") nes.buttonUp(1, "SELECT");
    });
});
