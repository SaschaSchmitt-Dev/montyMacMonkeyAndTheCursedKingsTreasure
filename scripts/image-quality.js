/** Chooses original-resolution artwork only for large desktop views. */
class ImageQuality {
    static highResolution = false;
    static images = new Map();

    /** @param {HTMLElement} frame - Visible game frame. @param {boolean} mobile - Mobile browser flag. */
    static update(frame, mobile) {
        const high = !mobile && frame.getBoundingClientRect().width > 1200;
        if (high === this.highResolution) return;
        this.highResolution = high;
        document.body.classList.toggle('high-resolution', high);
        this.updateHtmlImages();
    }

    /** @param {string} path - Optimized web image path. @returns {Object|null} Cached high variant state. */
    static load(path) {
        const source = highResolutionImagePaths[path];
        if (!source) return null;
        if (this.images.has(path)) return this.images.get(path);
        const image = new Image();
        image.decoding = 'async';
        image.src = source;
        const entry = { image, ready: false };
        this.images.set(path, entry);
        entry.promise = image.decode().then(() => { entry.ready = true; this.redraw(); }).catch(() => {});
        return entry;
    }

    /** @param {HTMLImageElement} image - Loaded small variant. @returns {HTMLImageElement} Best ready image. */
    static get(image) {
        if (!this.highResolution || !image?.src) return image;
        const path = image.src.slice(image.src.indexOf('assets/images/'));
        const entry = this.load(path);
        return entry?.ready ? (entry.bitmap || entry.image) : image;
    }

    /** Preserves source cropping when switching between images with different pixel dimensions.
     * @param {CanvasRenderingContext2D} ctx - Scene context. @param {HTMLImageElement} image - Base image.
     * @param {...number} coordinates - Standard drawImage coordinates, in original source/logical units.
     */
    static draw(ctx, image, ...coordinates) {
        const selected = this.get(image);
        if (selected !== image && coordinates.length === 8) {
            const scaleX = (selected.naturalWidth || selected.width) / image.naturalWidth;
            const scaleY = (selected.naturalHeight || selected.height) / image.naturalHeight;
            coordinates = coordinates.map((value, index) => index < 4 ? value * (index % 2 ? scaleY : scaleX) : value);
        }
        PerformanceOverlay.countDraw();
        ctx.drawImage(selected, ...coordinates);
    }

    /** Loads and prepares the whole level, including off-screen animation frames and the boss room.
     * @param {World} scene - Newly created, not yet running world.
     */
    static async preloadWorld(scene) {
        if (!this.highResolution) return;
        const targets = this.collectTargets(scene);
        const entries = [...targets.entries()];
        for (let index = 0; index < entries.length; index += 4) {
            if (world !== scene || !scene.active) return;
            await Promise.all(entries.slice(index, index + 4).map(([path, size]) => this.prepare(path, size, scene)));
            await new Promise((resolve) => requestAnimationFrame(resolve));
        }
    }

    /** @param {World} scene - Level to prepare. @returns {Map} Unique image paths and required pixel sizes. */
    static collectTargets(scene) {
        const targets = new Map();
        const scale = scene.canvas.width / CanvasResolution.width;
        for (const object of scene.getLoadingObjects()) {
            for (const image of [object.img, ...Object.values(object.imageCache)].filter(Boolean)) {
                this.addTarget(targets, image, object.width * scale, object.height * scale);
            }
        }
        for (const image of Object.values(BananaProjectile.images)) this.addTarget(targets, image, 128 * scale, 128 * scale);
        return targets;
    }

    /** @param {Map} targets - Unique sources. @param {HTMLImageElement} image - Base image.
     * @param {number} width - Target pixels. @param {number} height - Target pixels.
     */
    static addTarget(targets, image, width, height) {
        const path = image.src.slice(image.src.indexOf('assets/images/'));
        if (!highResolutionImagePaths[path]) return;
        const previous = targets.get(path) || { width: 0, height: 0 };
        targets.set(path, { width: Math.max(width, previous.width), height: Math.max(height, previous.height) });
    }

    /** Pre-scales expensive oversized sources once; uploads behind the loading overlay.
     * @param {string} path - Small source path. @param {Object} size - Required drawing pixels.
     * @param {World} scene - Hidden level drawing context.
     */
    static async prepare(path, size, scene) {
        const entry = this.load(path);
        await entry.promise;
        if (!entry.ready || world !== scene || !scene.active) return;
        if (typeof createImageBitmap === 'function') await this.prepareBitmap(entry, size);
        if (world === scene && scene.active) scene.ctx.drawImage(entry.bitmap || entry.image, 0, 0, 1, 1);
    }

    /** @param {Object} entry - Cached original-resolution image. @param {Object} size - Required pixels. */
    static async prepareBitmap(entry, size) {
        const scale = Math.min(1, Math.max(size.width / entry.image.naturalWidth, size.height / entry.image.naturalHeight));
        const width = Math.ceil(entry.image.naturalWidth * scale), height = Math.ceil(entry.image.naturalHeight * scale);
        if (entry.bitmap?.width >= width && entry.bitmap?.height >= height) return;
        try {
            const bitmap = await createImageBitmap(entry.image, { resizeWidth: width, resizeHeight: height, resizeQuality: 'high' });
            entry.bitmap?.close();
            entry.bitmap = bitmap;
        } catch {
            // Keep the decoded image if this browser cannot prepare a bitmap.
        }
    }

    /** Changes ordinary menu artwork only after decoding; keeps its small fallback on failure. */
    static updateHtmlImages() {
        for (const element of document.querySelectorAll('img[src], svg image[href]')) {
            const attribute = element instanceof HTMLImageElement ? 'src' : 'href';
            const path = element.dataset.qualitySource || element.getAttribute(attribute);
            if (!highResolutionImagePaths[path]) continue;
            element.dataset.qualitySource = path;
            if (!this.highResolution) element.setAttribute(attribute, path);
            else this.load(path).promise.then(() => {
                if (this.highResolution && this.images.get(path).ready) element.setAttribute(attribute, highResolutionImagePaths[path]);
            });
        }
    }

    /** Updates the current scene after an upgraded image decodes; physics never waits for downloads. */
    static redraw() {
        if (!ImageQuality.highResolution) return;
        DrawableObject.queueRedraw(ImageQuality.drawReadyImages);
    }

    /** Draws without resuming stopped or paused simulations. */
    static drawReadyImages() {
        world?.draw(true);
        menuWalker.draw();
    }
}
