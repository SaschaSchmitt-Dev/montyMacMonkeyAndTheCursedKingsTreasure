/** Five heart slots fixed to the canvas instead of the scrolling world. */
class HealthBar extends DrawableObject {
    x = 18;
    y = 16;
    width = 48;
    height = 48;
    spacing = 44;
    fullPath = 'assets/images/ui/hud/heart-full.svg';
    emptyPath = 'assets/images/ui/hud/heart-empty.svg';

    /** @param {Function} onLoad - Requests a redraw after loading. */
    constructor(onLoad) {
        super();
        this.loadImages([this.fullPath, this.emptyPath], onLoad);
    }


    /** @param {CanvasRenderingContext2D} ctx - Canvas drawing context.
     * @param {number} health - Current player lives.
     * @param {number} maxHealth - Number of available heart slots.
     */
    draw(ctx, health, maxHealth) {
        for (let index = 0; index < maxHealth; index++) {
            const path = index < health ? this.fullPath : this.emptyPath;
            const image = this.imageCache[path];
            if (!image.complete || image.naturalWidth === 0) continue;
            ctx.drawImage(image, this.x + index * this.spacing, this.y, this.width, this.height);
        }
    }
}
