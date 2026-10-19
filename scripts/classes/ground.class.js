/** The ground image, including its transparent upper margin. */
class Ground extends DrawableObject {
    y = 330;
    height = 320;

    /** @param {Function} onLoad - Requests a redraw after loading. */
    constructor(onLoad) {
        super();
        this.loadImage('assets/images/objects/platforms/platform-01-ground-straight.png', onLoad);
    }


    /**
     * Repeats the ground and fills the soil below its walkable surface.
     * @param {CanvasRenderingContext2D} ctx - Canvas drawing context.
     * @param {number} cameraX - Horizontal camera position.
     */
    draw(ctx, cameraX = 0) {
        ctx.fillStyle = '#332b1e';
        ctx.fillRect(0, 436, ctx.canvas.width, ctx.canvas.height - 436);
        const currentSection = Math.floor(cameraX / this.width);
        for (let section = currentSection - 1; section <= currentSection + 1; section++) {
            const x = Math.round(section * this.width - cameraX);
            super.draw(ctx, x);
        }
    }
}
