/** Holds and draws the objects in the game scene. */
class World {
    canvas;
    ctx;
    background;
    ground;
    character;

    /** @param {HTMLCanvasElement} canvas - Canvas used for the scene. */
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.background = new Background(() => this.draw());
        this.ground = new Ground(() => this.draw());
        this.character = new Character(() => this.draw());
    }


    /** Redraws loaded objects in a fixed order, independent of loading order. */
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.background.draw(this.ctx);
        this.ground.draw(this.ctx);
        this.character.draw(this.ctx);
    }
}
