/** Ammunition panel drawn at a fixed canvas position. */
class AmmoBar extends DrawableObject {
    rightOffset = 109.333333;
    y = 0;
    width = 260;
    height = 97.5;
    framePath = 'assets/images/ui/hud/statusbar-frame.png';
    iconPath = 'assets/images/ui/hud/banana-icon.png';
    fillPath = 'assets/images/ui/hud/statusbar-fill-orange.png';
    totalAmmo;

    /** @param {number} totalAmmo - Fixed sum of all ammunition placed in this level.
     * @param {Function} onLoad - Requests a redraw after loading.
     */
    constructor(totalAmmo, onLoad) {
        super();
        this.totalAmmo = totalAmmo;
        this.loadImages([this.framePath, this.iconPath, this.fillPath], onLoad);
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
        this.drawFill(ctx, ammo);
        this.drawText(ctx, ammo);
        ctx.restore();
    }

    /** @param {CanvasRenderingContext2D} ctx - Canvas drawing context.
     * @param {number} ammo - Current banana count relative to the original level supply.
     */
    drawFill(ctx, ammo) {
        const ratio = this.totalAmmo > 0 ? Math.max(0, Math.min(1, ammo / this.totalAmmo)) : 0;
        ctx.save();
        ctx.beginPath();
        ctx.rect(578, 326, 1239 * ratio, 100);
        ctx.clip();
        const fill = this.imageCache[this.fillPath];
        const scaleX = fill.naturalWidth / 2172;
        const scaleY = fill.naturalHeight / 724;
        ImageQuality.draw(ctx, fill, 0, 295 * scaleY, 2172 * scaleX, 132 * scaleY, 578, 326, 1239, 100);
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
        ctx.fillText(`${ammo}/${this.totalAmmo}`, 594, 510);
    }
}
