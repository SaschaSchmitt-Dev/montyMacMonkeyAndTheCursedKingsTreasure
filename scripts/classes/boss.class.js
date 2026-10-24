/** The monkey king waiting in his chamber. */
class Boss extends DrawableObject {
    width = 300;
    height = 200;
    frames = [];
    animationTime = 0;
    framesPerSecond = 3;

    /** @param {number} roomWidth - Chamber width in pixels.
     * @param {number} floorY - Player foot position on the floor.
     * @param {Function} onLoad - Requests a redraw after loading.
     */
    constructor(roomWidth, floorY, onLoad) {
        super();
        this.x = roomWidth - this.width - 40;
        this.y = floorY - this.height * 0.98;
        this.frames = [1, 2].map((frame) =>
            `assets/images/enemies/cursed-monkey-king/idle/idle-0${frame}.png`
        );
        this.loadImages(this.frames, onLoad);
        this.img = this.imageCache[this.frames[0]];
    }


    /** @param {number} deltaTime - Frame duration in seconds. */
    update(deltaTime) {
        this.animationTime += deltaTime;
        const frame = Math.floor(this.animationTime * this.framesPerSecond) % this.frames.length;
        const image = this.imageCache[this.frames[frame]];
        if (image.complete && image.naturalWidth > 0) this.img = image;
    }


    /** @param {CanvasRenderingContext2D} ctx - Canvas drawing context. */
    draw(ctx) {
        if (!this.img.complete || this.img.naturalWidth === 0) return;
        ctx.save();
        ctx.translate(this.x + this.width, this.y);
        ctx.scale(-1, 1);
        ctx.drawImage(this.img, 0, 0, this.width, this.height);
        ctx.restore();
    }
}
