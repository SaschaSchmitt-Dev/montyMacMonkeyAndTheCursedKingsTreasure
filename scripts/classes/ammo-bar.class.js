/** Ammunition panel drawn at a fixed canvas position. */
class AmmoBar extends DrawableObject {
    rightOffset = 109.333333;
    y = 0;
    width = 260;
    height = 97.5;
    framePath = 'assets/images/ui/hud/statusbar-frame.png';
    iconPath = 'assets/images/ui/hud/banana-icon.png';

    /** @param {Function} onLoad - Requests a redraw after loading. */
    constructor(onLoad) {
        super();
        this.loadImages([this.framePath, this.iconPath], onLoad);
    }

    /** @param {CanvasRenderingContext2D} ctx - Canvas drawing context.
     * @param {number} ammo - Current banana count.
     */
    draw(ctx, ammo) {
        const images = Object.values(this.imageCache);
        if (!images.every((image) => image.complete && image.naturalWidth > 0)) return;
        ctx.save();
        ctx.translate(CanvasResolution.width - this.width - this.rightOffset, this.y);
        ctx.scale(this.width / 2048, this.height / 768);
        ImageQuality.draw(ctx, this.imageCache[this.framePath], 0, 0, 2048, 768);
        ImageQuality.draw(ctx, this.imageCache[this.iconPath], 225, 248, 285, 208);
        this.drawText(ctx, ammo);
        ctx.restore();
    }

    /** @param {CanvasRenderingContext2D} ctx - Canvas drawing context.
     * @param {number} ammo - Current banana count.
     */
    drawText(ctx, ammo) {
        ctx.fillStyle = 'rgb(244, 231, 197)';
        ctx.font = '400 104px "Racing Sans One", Arial, sans-serif';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'left';
        ctx.fillText(t('hudAmmo'), 594, 246);
        ctx.fillText(String(ammo), 594, 510);
    }
}
