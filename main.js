class RetroEmulator {
    constructor() {
        this.nes = new jsnes.NES({
            onFrame: (frameBuffer) => this.renderFrame(frameBuffer),
            onAudioSample: (left, right) => {} // Audio would go here
        });
        
        this.isPaused = false;
        this.currentGame = null;
        this.lastTime = 0;
        this.fps = 0;
        this.frameCount = 0;
        this.lastFpsUpdate = 0;
        
        this.initElements();
        this.initEvents();
        this.loadGameList();
        this.setupGamepad();
        this.animationFrame();
    }
    
    initElements() {
        this.canvas = document.getElementById("nes-screen");
        this.ctx = this.canvas.getContext("2d");
        this.gameList = document.getElementById("game-list");
        this.gamesList = document.getElementById("games");
        this.gameSearch = document.getElementById("game-search");
        this.gameStatus = document.getElementById("game-status");
        this.fpsCounter = document.getElementById("fps-counter");
        
        // Buttons
        this.loadBtn = document.getElementById("load-btn");
        this.pauseBtn = document.getElementById("pause-btn");
        this.resetBtn = document.getElementById("reset-btn");
        this.saveBtn = document.getElementById("save-btn");
        this.loadStateBtn = document.getElementById("load-state-btn");
        this.fullscreenBtn = document.getElementById("fullscreen-btn");
    }
    
    initEvents() {
        // Control buttons
        this.loadBtn.addEventListener("click", () => this.toggleGameList());
        this.pauseBtn.addEventListener("click", () => this.togglePause());
        this.resetBtn.addEventListener("click", () => this.resetGame());
        this.saveBtn.addEventListener("click", () => this.saveState());
        this.loadStateBtn.addEventListener("click", () => this.loadState());
        this.fullscreenBtn.addEventListener("click", () => this.toggleFullscreen());
        
        // Game search
        this.gameSearch.addEventListener("input", () => this.filterGames());
        
        // Keyboard controls
        document.addEventListener("keydown", (e) => this.handleKeyDown(e));
        document.addEventListener("keyup", (e) => this.handleKeyUp(e));
        
        // On-screen controller buttons
        document.querySelectorAll(".controller button").forEach(button => {
            button.addEventListener("mousedown", () => {
                const key = button.dataset.key;
                this.nes.buttonDown(1, key);
                button.classList.add("active");
            });
            
            button.addEventListener("mouseup", () => {
                const key = button.dataset.key;
                this.nes.buttonUp(1, key);
                button.classList.remove("active");
            });
            
            // For touch devices
            button.addEventListener("touchstart", (e) => {
                e.preventDefault();
                const key = button.dataset.key;
                this.nes.buttonDown(1, key);
                button.classList.add("active");
            });
            
            button.addEventListener("touchend", (e) => {
                e.preventDefault();
                const key = button.dataset.key;
                this.nes.buttonUp(1, key);
                button.classList.remove("active");
            });
        });
    }
    
    // Key mappings
    get KEYMAP() {
        return {
            88: 'A',      // X
            90: 'B',      // Z
            13: 'START',  // Enter
            16: 'SELECT', // Shift
            38: 'UP',     // Up
            40: 'DOWN',   // Down
            37: 'LEFT',   // Left
            39: 'RIGHT',  // Right
            80: 'PAUSE'   // P
        };
    }
    
    handleKeyDown(e) {
        const key = this.KEYMAP[e.keyCode];
        if (key) {
            if (key === 'PAUSE') {
                this.togglePause();
            } else {
                this.nes.buttonDown(1, key);
                this.highlightKey(key, true);
            }
            e.preventDefault();
        }
    }
    
    handleKeyUp(e) {
        const key = this.KEYMAP[e.keyCode];
        if (key && key !== 'PAUSE') {
            this.nes.buttonUp(1, key);
            this.highlightKey(key, false);
            e.preventDefault();
        }
    }
    
    highlightKey(key, isPressed) {
        const button = document.querySelector(`.controller button[data-key="${key}"]`);
        if (button) {
            button.classList.toggle("active", isPressed);
        }
    }
    
    renderFrame(frameBuffer) {
        const imageData = this.ctx.createImageData(256, 240);
        
        for (let i = 0; i < 256 * 240; i++) {
            const j = i * 4;
            const pixel = frameBuffer[i];
            
            imageData.data[j] = (pixel >> 16) & 0xff;
            imageData.data[j+1] = (pixel >> 8) & 0xff;
            imageData.data[j+2] = pixel & 0xff;
            imageData.data[j+3] = 0xff;
        }
        
        this.ctx.putImageData(imageData, 0, 0);
    }
    
    animationFrame(time = 0) {
        if (!this.lastTime) this.lastTime = time;
        const deltaTime = time - this.lastTime;
        this.lastTime = time;
        
        if (!this.isPaused && this.nes) {
            this.nes.frame();
        }
        
        // Update FPS counter every second
        this.frameCount++;
        if (time - this.lastFpsUpdate >= 1000) {
            this.fps = Math.round((this.frameCount * 1000) / (time - this.lastFpsUpdate));
            this.fpsCounter.textContent = `${this.fps} FPS`;
            this.frameCount = 0;
            this.lastFpsUpdate = time;
        }
        
        requestAnimationFrame((t) => this.animationFrame(t));
    }
    
    toggleGameList() {
        this.gameList.classList.toggle("hidden");
        if (!this.gameList.classList.contains("hidden")) {
            this.gameSearch.focus();
        }
    }
    
    loadGameList() {
        // In a real implementation, you would load this from a JSON file or API
        const games = [
            { name: "Super Mario Bros.", file: "roms/super_mario_bros.nes" },
            { name: "Donkey Kong", file: "roms/donkey_kong.nes" },
            { name: "Pac-Man", file: "roms/pacman.nes" },
            { name: "Tetris", file: "roms/tetris.nes" },
            { name: "Legend of Zelda", file: "roms/zelda.nes" }
        ];
        
        this.gamesList.innerHTML = games.map(game => `
            <li data-file="${game.file}">${game.name}</li>
        `).join("");
        
        this.gamesList.querySelectorAll("li").forEach(item => {
            item.addEventListener("click", () => {
                const romFile = item.getAttribute("data-file");
                this.loadGame(romFile);
                this.gameList.classList.add("hidden");
            });
        });
    }
    
    filterGames() {
        const searchTerm = this.gameSearch.value.toLowerCase();
        const games = this.gamesList.querySelectorAll("li");
        
        games.forEach(game => {
            const gameName = game.textContent.toLowerCase();
            game.style.display = gameName.includes(searchTerm) ? "block" : "none";
        });
    }
    
    async loadGame(romPath) {
        try {
            const response = await fetch(romPath);
            if (!response.ok) throw new Error("Failed to load ROM");
            
            const buffer = await response.arrayBuffer();
            const rom = new Uint8Array(buffer);
            
            this.nes.loadROM(rom);
            this.currentGame = romPath.split('/').pop().replace('.nes', '');
            this.gameStatus.textContent = `Playing: ${this.currentGame}`;
            this.isPaused = false;
            this.pauseBtn.textContent = "Pause";
            
            console.log(`Loaded game: ${this.currentGame}`);
        } catch (error) {
            console.error("Error loading game:", error);
            this.gameStatus.textContent = "Error loading game";
            alert("Failed to load game. Please try another.");
        }
    }
    
    togglePause() {
        this.isPaused = !this.isPaused;
        this.pauseBtn.textContent = this.isPaused ? "Resume" : "Pause";
        this.gameStatus.textContent = this.isPaused 
            ? `Paused: ${this.currentGame || 'No game loaded'}` 
            : `Playing: ${this.currentGame || 'No game loaded'}`;
    }
    
    resetGame() {
        if (this.nes) {
            this.nes.reset();
            this.gameStatus.textContent = `Reset: ${this.currentGame || 'No game loaded'}`;
            setTimeout(() => {
                this.gameStatus.textContent = `Playing: ${this.currentGame || 'No game loaded'}`;
            }, 2000);
        }
    }
    
    saveState() {
        if (!this.currentGame) {
            alert("No game loaded to save!");
            return;
        }
        
        const state = this.nes.toJSON();
        localStorage.setItem(`nes_save_${this.currentGame}`, JSON.stringify(state));
        this.gameStatus.textContent = `Saved: ${this.currentGame}`;
        setTimeout(() => {
            this.gameStatus.textContent = `Playing: ${this.currentGame}`;
        }, 2000);
    }
    
    loadState() {
        if (!this.currentGame) {
            alert("No game loaded to load state for!");
            return;
        }
        
        const savedState = localStorage.getItem(`nes_save_${this.currentGame}`);
        if (savedState) {
            this.nes.fromJSON(JSON.parse(savedState));
            this.gameStatus.textContent = `Loaded: ${this.currentGame}`;
            setTimeout(() => {
                this.gameStatus.textContent = `Playing: ${this.currentGame}`;
            }, 2000);
        } else {
            alert("No saved state found for this game!");
        }
    }
    
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            this.canvas.requestFullscreen().catch(err => {
                alert(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    }
    
    setupGamepad() {
       
