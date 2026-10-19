/** Indiana Monkey with horizontal movement and an idle image. */
class Character extends DrawableObject {
    x = 120;
    y = 314;
    width = 128;
    height = 128;
    speed = 220;
    facingLeft = false;

    /** @param {Function} onLoad - Requests a redraw after loading. */
    constructor(onLoad) {
        super();
        this.loadImage('assets/images/character/idle/idle_00.png', onLoad);
    }


    /**
     * Moves within the current canvas while keeping the last facing direction.
     * @param {number} deltaTime - Frame duration in seconds.
     * @param {number} direction - -1 for left, 1 for right, or 0.
     * @param {number} screenWidth - Width of the playable area.
     */
    move(deltaTime, direction, screenWidth) {
        if (direction !== 0) this.facingLeft = direction < 0;
        this.x += direction * this.speed * deltaTime;
        this.x = Math.max(0, Math.min(this.x, screenWidth - this.width));
    }


    /** @param {CanvasRenderingContext2D} ctx - Canvas drawing context. */
    draw(ctx) {
        ctx.save();
        if (this.facingLeft) {
            ctx.translate(this.x + this.width, 0);
            ctx.scale(-1, 1);
            super.draw(ctx, 0);
        } else {
            super.draw(ctx);
        }
        ctx.restore();
    }
}
