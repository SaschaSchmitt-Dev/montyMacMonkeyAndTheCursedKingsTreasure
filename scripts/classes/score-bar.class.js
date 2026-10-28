/** Collected treasure points drawn at the top left of the canvas. */
class ScoreBar extends DrawableObject {
    x = 12;
    y = 0;
    width = 260;
    height = 97.5;
    maxScore;
    framePath = 'assets/images/ui/hud/statusbar-frame.png';
    iconPath = 'assets/images/ui/hud/score-icon.png';
    fillPath = 'assets/images/ui/hud/statusbar-fill-gold.png';

    /** @param {number} maxScore - Total points available from the level treasures.
     * @param {Function} onLoad - Requests a redraw after loading.
     */
    constructor(maxScore, onLoad) {
        super();
        this.maxScore = maxScore;
        this.loadImages([this.framePath, this.iconPath, this.fillPath], onLoad);
    }


    /** @param {CanvasRenderingContext2D} ctx - Canvas drawing context.
     * @param {number} score - Current collected points.
     */
    draw(ctx, score) {
        const images = Object.values(this.imageCache);
        if (!images.every((image) => image.complete && image.naturalWidth > 0)) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(this.width / 2048, this.height / 768);
        ctx.drawImage(this.imageCache[this.framePath], 0, 0, 2048, 768);
        ctx.drawImage(this.imageCache[this.iconPath], 230, 215, 275, 275);
        this.drawFill(ctx, score);
        this.drawText(ctx, score);
        ctx.restore();
    }


    /** @param {CanvasRenderingContext2D} ctx - Canvas drawing context.
     * @param {number} score - Current collected points.
     */
    drawFill(ctx, score) {
        const ratio = this.maxScore > 0 ? Math.max(0, Math.min(1, score / this.maxScore)) : 0;
        ctx.save();
        ctx.beginPath();
        ctx.rect(578, 326, 1239 * ratio, 100);
        ctx.clip();
        ctx.drawImage(this.imageCache[this.fillPath], 0, 295, 2172, 132, 578, 326, 1239, 100);
        ctx.restore();
    }


    /** @param {CanvasRenderingContext2D} ctx - Canvas drawing context.
     * @param {number} score - Current collected points.
     */
    drawText(ctx, score) {
        ctx.fillStyle = 'rgb(244, 231, 197)';
        ctx.font = '400 104px "Racing Sans One", Arial, sans-serif';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'left';
        ctx.fillText(t('hudScore'), 594, 246);
        ctx.fillText(`${score}/${this.maxScore}`, 594, 510);
    }
}
