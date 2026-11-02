/** A game object with an image, position and drawing size. */
class DrawableObject {
    x = 0;
    y = 0;
    width = 960;
    height = 540;
    img;
    imageCache = {};
    static sharedImages = new Map();
    static redraws = new Set();
    static redrawFrame = null;

    /**
     * Loads an image and requests a redraw when it is ready.
     * @param {string} path - Path to the image file.
     * @param {Function} onLoad - Callback after loading.
     */
    loadImage(path, onLoad) {
        this.img = DrawableObject.getImage(path, onLoad);
    }

    /**
     * Preloads animation frames without replacing the current image.
     * @param {string[]} paths - Paths to the animation images.
     * @param {Function} onLoad - Requests a redraw after loading.
     */
    loadImages(paths, onLoad) {
        paths.forEach((path) => {
            this.imageCache[path] = DrawableObject.getImage(path, onLoad);
        });
    }

    /** @param {string} path - Original asset path.
     * @param {Function} onLoad - Optional redraw, grouped into a single animation frame.
     * @returns {HTMLImageElement} Shared web-sized image.
     */
    static getImage(path, onLoad) {
        const source = optimizedImagePaths[path] || path;
        if (!this.sharedImages.has(source)) this.createSharedImage(source);
        const image = this.sharedImages.get(source);
        if (onLoad) {
            if (image.complete) this.queueRedraw(onLoad);
            else image.addEventListener('load', () => this.queueRedraw(onLoad), { once: true });
        }
        return image;
    }

    /** @param {Function} callback - Loaded-image redraw; never once per image in the same frame. */
    static queueRedraw(callback) {
        this.redraws.add(callback);
        if (this.redrawFrame !== null) return;
        this.redrawFrame = requestAnimationFrame(() => {
            const callbacks = [...this.redraws];
            this.redraws.clear();
            this.redrawFrame = null;
            callbacks.forEach((draw) => draw());
        });
    }

    /**
     * Draws the object once its image has loaded successfully.
     * @param {CanvasRenderingContext2D} ctx - Canvas drawing context.
     * @param {number} x - Optional screen position for repeated sections.
     */
    draw(ctx, x = this.x) {
        if (this.img.complete && this.img.naturalWidth > 0) {
            ImageQuality.draw(ctx, this.img, x, this.y, this.width, this.height);
        }
    }

    /** @param {string} source - Resolved URL to cache until a load failure. */
    static createSharedImage(source) {
        const image = new Image();
        image.decoding = 'async';
        image.addEventListener('error', () => {
            if (this.sharedImages.get(source) === image) this.sharedImages.delete(source);
        }, { once: true });
        image.src = source;
        this.sharedImages.set(source, image);
    }

}
