/** Ammunition panel drawn at a fixed canvas position. */
class AmmoBar extends DrawableObject {
    rightOffset = 12;
    y = 0;
    width = 280;
    height = 105;
    maxAmmo;
    framePath = 'assets/images/ui/hud/statusbar-frame.png';
    iconPath = 'assets/images/ui/hud/banana-icon.png';
    fillPath = 'assets/images/ui/hud/statusbar-fill-orange.png';

    /** @param {number} maxAmmo - Maximum ammunition the player can carry.
     * @param {Function} onLoad - Requests a redraw after loading.
     */
    constructor(maxAmmo, onLoad) {
        super();
        this.maxAmmo = Math.max(1, maxAmmo);
        this.loadImages([this.framePath, this.iconPath, this.fillPath], onLoad);
    }


    /** @param {CanvasRenderingContext2D} ctx - Canvas drawing context.
     * @param {number} ammo - Current banana count.
     */
    draw(ctx, ammo) {
        const images = Object.values(this.imageCache);
        if (!images.every((image) => image.complete && image.naturalWidth > 0)) return;
        ctx.save();
        ctx.translate(ctx.canvas.width - this.width - this.rightOffset, this.y);
        ctx.scale(this.width / 2048, this.height / 768);
        ctx.drawImage(this.imageCache[this.framePath], 0, 0, 2048, 768);
        ctx.drawImage(this.imageCache[this.iconPath], 225, 248, 285, 208);
        this.drawFill(ctx, ammo);
        this.drawText(ctx, ammo);
        ctx.restore();
    }


    /** @param {CanvasRenderingContext2D} ctx - Canvas drawing context.
     * @param {number} ammo - Current banana count.
     */
    drawFill(ctx, ammo) {
        const ratio = Math.max(0, Math.min(1, ammo / this.maxAmmo));
        ctx.save();
        ctx.beginPath();
        ctx.rect(578, 326, 1239 * ratio, 100);
        ctx.clip();
        ctx.drawImage(this.imageCache[this.fillPath], 0, 283, 2172, 145, 578, 326, 1239, 100);
        ctx.restore();
    }


    /** @param {CanvasRenderingContext2D} ctx - Canvas drawing context.
     * @param {number} ammo - Current banana count.
     */
    drawText(ctx, ammo) {
        ctx.fillStyle = 'rgb(244, 231, 197)';
        ctx.font = 'bold 104px Arial';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'left';
        ctx.fillText('Munition', 594, 246);
        ctx.fillText(`${ammo}/${this.maxAmmo}`, 594, 510);
    }
}
