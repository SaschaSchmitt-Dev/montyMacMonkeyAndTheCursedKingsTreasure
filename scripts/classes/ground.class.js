/** The ground image, including its transparent upper margin. */
class Ground extends DrawableObject {
    y = 330;
    height = 320;

    /** @param {Function} onLoad - Requests a redraw after loading.
     * @param {string} imagePath - Ground image path.
     */
    constructor(onLoad, imagePath = 'assets/images/objects/platforms/platform-01-ground-straight.png') {
        super();
        if (imagePath.endsWith('platform-01-ground-straight.png')) this.alignJungleGround();
        this.loadImage(imagePath, onLoad);
    }

    /** Aligns the jungle tile with the cave floor at the same image scale. */
    alignJungleGround() {

        const scale = 720 / 1536;
        this.width = 1024 * scale;
        this.height = 268 * scale;
        this.y = 442 - 64 * scale;
    }

    /** @param {number} viewWidth - Canvas width in pixels.
     * @param {number} floorY - Player foot position on the floor.
     */
    alignBossGround(viewWidth, floorY) {
        this.x = 0;
        this.width = viewWidth / 2;
        const scale = this.width / 1024;
        this.height = 268 * scale;
        this.y = floorY - 10 - 64 * scale;
    }

    /**
     * Repeats the ground image across the visible area.
     * @param {CanvasRenderingContext2D} ctx - Canvas drawing context.
     * @param {number} cameraX - Horizontal camera position.
     */
    draw(ctx, cameraX = 0) {

        const currentSection = Math.floor(cameraX / this.width);
        for (let section = currentSection - 1; section <= currentSection + Math.ceil(CanvasResolution.width / this.width); section++) {
            const x = Math.round(this.x + section * this.width - cameraX);
            this.drawTile(ctx, x);
        }
    }

    /** Keeps the walkable upper edge unchanged while extending rock down to the frame bottom.
     * @param {CanvasRenderingContext2D} ctx - Scene context.
     * @param {number} x - Tile position in view coordinates.
     * @returns {void} Updates state or drawing only.
     */
    drawTile(ctx, x) {
        if (!this.img.complete || this.img.naturalWidth === 0) return;
        const extra = Math.max(0, CanvasResolution.height - this.y - this.height);
        if (extra === 0) return super.draw(ctx, x);
        const sourceTop = this.img.naturalHeight * 0.4;
        const targetTop = this.height * 0.4;
        ImageQuality.draw(ctx, this.img, 0, 0, this.img.naturalWidth, sourceTop,
            x, this.y, this.width, targetTop);
        ImageQuality.draw(ctx, this.img, 0, sourceTop, this.img.naturalWidth, this.img.naturalHeight - sourceTop,
            x, this.y + targetTop, this.width, this.height - targetTop + extra);
    }

}
