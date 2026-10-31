/** Five heart slots within the second panel of the HUD row. */
class HealthBar extends DrawableObject {
    x = 301.333333;
    y = 0;
    width = 44.571429;
    height = 44.571429;
    spacing = 40.857143;
    panelWidth = 260;
    panelHeight = 97.5;
    fullPath = 'assets/images/ui/hud/heart-full.svg';
    emptyPath = 'assets/images/ui/hud/heart-empty.svg';
    panelPath = 'assets/images/ui/hud/heart-panel.png';

    /** @param {Function} onLoad - Requests a redraw after loading. */
    constructor(onLoad) {
        super();
        this.loadImages([this.fullPath, this.emptyPath, this.panelPath], onLoad);
    }


    /** @param {CanvasRenderingContext2D} ctx - Canvas drawing context.
     * @param {number} health - Current player lives.
     * @param {number} maxHealth - Number of available heart slots.
     */
    draw(ctx, health, maxHealth) {
        const panel = this.imageCache[this.panelPath];
        if (!panel.complete || panel.naturalWidth === 0) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        ImageQuality.draw(ctx, panel, 0, 0, this.panelWidth, this.panelHeight);
        this.drawHearts(ctx, health, maxHealth);
        ctx.restore();
    }


    /** @param {CanvasRenderingContext2D} ctx - Panel-local drawing context.
     * @param {number} health - Current player lives.
     * @param {number} maxHealth - Number of available heart slots.
     */
    drawHearts(ctx, health, maxHealth) {
        const rowWidth = (maxHealth - 1) * this.spacing + this.width;
        const startX = (this.panelWidth - rowWidth) / 2;
        const y = (this.panelHeight - this.height) / 2;
        for (let index = 0; index < maxHealth; index++) {
            const path = index < health ? this.fullPath : this.emptyPath;
            const image = this.imageCache[path];
            if (!image.complete || image.naturalWidth === 0) continue;
            ImageQuality.draw(ctx, image, startX + index * this.spacing, y, this.width, this.height);
        }
    }
}
