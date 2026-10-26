/** Five heart slots centered on a fixed canvas panel. */
class HealthBar extends DrawableObject {
    y = 0;
    width = 48;
    height = 48;
    spacing = 44;
    panelWidth = 280;
    panelHeight = 105;
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
        ctx.translate((ctx.canvas.width - this.panelWidth) / 2, this.y);
        ctx.drawImage(panel, 0, 0, this.panelWidth, this.panelHeight);
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
            ctx.drawImage(image, startX + index * this.spacing, y, this.width, this.height);
        }
    }
}
