/** A game object with an image, position and drawing size. */
class DrawableObject {
    x = 0;
    y = 0;
    width = 960;
    height = 540;
    img;
    imageCache = {};

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
     * Preloads animation frames without replacing the current image.
     * @param {string[]} paths - Paths to the animation images.
     * @param {Function} onLoad - Requests a redraw after loading.
     */
    loadImages(paths, onLoad) {
        paths.forEach((path) => {
            const image = new Image();
            image.onload = onLoad;
            image.src = path;
            this.imageCache[path] = image;
        });
    }


    /**
     * Draws the object once its image has loaded successfully.
     * @param {CanvasRenderingContext2D} ctx - Canvas drawing context.
     * @param {number} x - Optional screen position for repeated sections.
     */
    draw(ctx, x = this.x) {
        if (this.img.complete && this.img.naturalWidth > 0) {
            ctx.drawImage(this.img, x, this.y, this.width, this.height);
        }
    }
}
