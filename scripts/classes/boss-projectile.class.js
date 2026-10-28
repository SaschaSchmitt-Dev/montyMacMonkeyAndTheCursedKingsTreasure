/** A curse orb travelling straight across the chamber. */
class BossProjectile extends MovableObject {
    width = 72;
    height = 72;
    speed = 320;

    /** @param {number} x - Left edge of the projectile.
     * @param {number} y - Upper edge of the projectile.
     * @param {HTMLImageElement} image - Preloaded curse orb image.
     * @param {number} launchY - Staff-tip origin before settling into the attack lane.
     */
    constructor(x, y, image, launchY = y) {
        super();
        this.x = x;
        this.y = launchY;
        this.launchY = launchY;
        this.targetY = y;
        this.flightTime = 0;
        this.img = image;
    }


    /** @param {number} deltaTime - Frame duration in seconds. */
    update(deltaTime) {
        this.x -= this.speed * deltaTime;
        this.flightTime += deltaTime;
        const progress = Math.min(1, this.flightTime / 0.22);
        this.y = this.launchY + (this.targetY - this.launchY) * progress;
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
