/** A curse orb travelling straight across the chamber. */
class BossProjectile extends MovableObject {
    width = 72;
    height = 72;
    speed = 260;

    /** @param {number} x - Left edge of the projectile.
     * @param {number} y - Upper edge of the projectile.
     * @param {HTMLImageElement} image - Preloaded curse orb image.
     */
    constructor(x, y, image) {
        super();
        this.x = x;
        this.y = y;
        this.img = image;
    }


    /** @param {number} deltaTime - Frame duration in seconds. */
    update(deltaTime) {
        this.x -= this.speed * deltaTime;
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
