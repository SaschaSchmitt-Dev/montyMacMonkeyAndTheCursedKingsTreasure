/** A game object with an image, position and drawing size. */
class DrawableObject {
    x = 0;
    y = 0;
    width = 960;
    height = 540;
    img;

    /**
     * Loads an image and requests a redraw when it is ready.
     * @param {string} path - Path to the image file.
     * @param {Function} onLoad - Callback after loading.
     */
    loadImage(path, onLoad) {
        this.img = new Image();
        this.img.onload = onLoad;
        this.img.src = path;
    }


    /**
     * Draws the object once its image has loaded successfully.
     * @param {CanvasRenderingContext2D} ctx - Canvas drawing context.
     */
    draw(ctx) {
        if (this.img.complete && this.img.naturalWidth > 0) {
            ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
        }
    }
}
