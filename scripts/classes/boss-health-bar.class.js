/** The monkey king's remaining health in a fixed chamber panel. */
class BossHealthBar extends DrawableObject {
    y = 80;
    width = 420;
    height = 140;
    framePath = 'assets/images/ui/hud/boss-health-frame.png';
    fillPath = 'assets/images/ui/hud/boss-health-fill.png';

    /** @param {Function} onLoad - Requests a redraw after loading. */
    constructor(onLoad) {
        super();
        this.loadImages([this.framePath, this.fillPath], onLoad);
    }


    /** @param {CanvasRenderingContext2D} ctx - Canvas drawing context.
     * @param {Boss|null} boss - Boss in the active chamber, if present.
     */
    draw(ctx, boss) {
        if (!boss || boss.defeated) return;
        if (!Object.values(this.imageCache).every((image) => image.complete && image.naturalWidth > 0)) return;
        ctx.save();
        ctx.translate((ctx.canvas.width - this.width) / 2, this.y);
        ctx.scale(this.width / 2172, this.height / 724);
        this.drawFill(ctx, boss);
        this.drawFrame(ctx);
        this.drawCount(ctx, boss);
        ctx.restore();
    }


    /** @param {CanvasRenderingContext2D} ctx - Panel-local drawing context. */
    drawFrame(ctx) {
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
        ctx.shadowBlur = 16;
        ctx.shadowOffsetY = 4;
        ctx.drawImage(this.imageCache[this.framePath], 0, 0, 2172, 724);
        ctx.restore();
    }


    /** @param {CanvasRenderingContext2D} ctx - Panel-local drawing context.
     * @param {Boss} boss - Boss whose health determines the filled width.
     */
    drawFill(ctx, boss) {
        const ratio = boss.maxHealth > 0 ? Math.max(0, Math.min(1, boss.health / boss.maxHealth)) : 0;
        ctx.fillStyle = 'rgb(22, 9, 15)';
        ctx.fillRect(528, 300, 1392, 100);
        ctx.save();
        ctx.beginPath();
        ctx.rect(528, 300, 1392 * ratio, 100);
        ctx.clip();
        ctx.drawImage(this.imageCache[this.fillPath], 76, 452, 1384, 118, 528, 300, 1392, 100);
        ctx.restore();
    }


    /** @param {CanvasRenderingContext2D} ctx - Panel-local drawing context.
     * @param {Boss} boss - Boss with current and maximum health.
     */
    drawCount(ctx, boss) {
        ctx.font = '400 70px "Racing Sans One", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgb(255, 245, 225)';
        ctx.fillText(`${boss.health}/${boss.maxHealth}`, 1224, 350);
    }
}
