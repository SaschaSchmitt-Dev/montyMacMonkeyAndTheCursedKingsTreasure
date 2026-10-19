/** Holds and draws the objects in the game scene. */
class World {
    canvas;
    ctx;
    keyboard;
    backgrounds = [];
    parallaxFactors = [0.22, 0.48, 0.80];
    cameraX = 0;
    ground;
    character;
    lastTime = null;
    deltaTime = 0;
    animationFrame;
    active = true;

    /**
     * @param {HTMLCanvasElement} canvas - Canvas used for the scene.
     * @param {Keyboard} keyboard - Current player input.
     */
    constructor(canvas, keyboard) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.keyboard = keyboard;
        this.createBackgrounds();
        this.ground = new Ground(() => this.draw());
        this.character = new Character(() => this.draw());
        this.animationFrame = requestAnimationFrame((time) => this.gameLoop(time));
    }


    /** Loads all three full-size sections for each of the three cave layers. */
    createBackgrounds() {
        for (let layer = 1; layer <= 3; layer++) {
            const sections = ['A', 'B', 'C'].map((section) =>
                new Background(layer, section, () => this.draw())
            );
            this.backgrounds.push(sections);
        }
    }


    /** @param {number} layer - Zero-based layer index. */
    drawBackgroundLayer(layer) {
        const width = this.canvas.width;
        const viewX = this.cameraX * this.parallaxFactors[layer];
        const currentSection = Math.floor(viewX / width);
        for (let section = currentSection - 1; section <= currentSection + 1; section++) {
            const index = ((section % 3) + 3) % 3;
            const x = Math.round(section * width - viewX);
            this.backgrounds[layer][index].draw(this.ctx, x);
        }
    }


    /** @param {number} time - Browser timestamp in milliseconds. */
    gameLoop(time) {
        if (!this.active) return;
        this.deltaTime = this.getDeltaTime(time);
        this.character.update(this.deltaTime, this.keyboard, this.canvas.width);
        this.draw();
        this.animationFrame = requestAnimationFrame((nextTime) => this.gameLoop(nextTime));
    }


    /**
     * Limits the time step to avoid large jumps after a tab pause.
     * @param {number} time - Current browser timestamp in milliseconds.
     * @returns {number} Time since the last frame in seconds, at most 0.05.
     */
    getDeltaTime(time) {
        if (this.lastTime === null) this.lastTime = time;
        const deltaTime = Math.min((time - this.lastTime) / 1000, 0.05);
        this.lastTime = time;
        return deltaTime;
    }


    /** Stops drawing and cancels the pending animation frame. */
    stop() {
        this.active = false;
        cancelAnimationFrame(this.animationFrame);
    }


    /** Redraws loaded objects in a fixed order, independent of loading order. */
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawBackgroundLayer(0);
        this.drawBackgroundLayer(1);
        this.ground.draw(this.ctx, this.cameraX);
        this.character.draw(this.ctx);
        this.drawBackgroundLayer(2);
    }
}
