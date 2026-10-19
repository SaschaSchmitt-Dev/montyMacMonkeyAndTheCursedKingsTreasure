/** Holds and draws the objects in the game scene. */
class World {
    canvas;
    ctx;
    background;
    ground;
    character;
    lastTime = null;
    deltaTime = 0;
    animationFrame;
    active = true;

    /** @param {HTMLCanvasElement} canvas - Canvas used for the scene. */
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.background = new Background(() => this.draw());
        this.ground = new Ground(() => this.draw());
        this.character = new Character(() => this.draw());
        this.animationFrame = requestAnimationFrame((time) => this.gameLoop(time));
    }


    /** @param {number} time - Browser timestamp in milliseconds. */
    gameLoop(time) {
        if (!this.active) return;
        this.deltaTime = this.getDeltaTime(time);
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
        this.background.draw(this.ctx);
        this.ground.draw(this.ctx);
        this.character.draw(this.ctx);
    }
}
