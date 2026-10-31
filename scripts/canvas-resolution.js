/** Keeps gameplay coordinates fixed while supplying more drawing pixels on large/retina screens. */
class CanvasResolution {
    static width = 960;
    static height = 540;

    /** @param {HTMLCanvasElement} canvas - Either the game canvas or transparent menu character layer.
     * @returns {boolean} Whether resizing cleared the drawing surface.
     */
    static resize(canvas) {
        const frame = canvas.closest('.game-frame').getBoundingClientRect();
        const scale = Math.min(2, Math.max(1, frame.width * (window.devicePixelRatio || 1) / this.width));
        const width = Math.round(this.width * scale), height = Math.round(this.height * scale);
        if (canvas.width === width && canvas.height === height) return false;
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        context.setTransform(width / this.width, 0, 0, height / this.height, 0, 0);
        context.imageSmoothingQuality = 'high';
        return true;
    }
}
