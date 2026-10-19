/** One complete section of a cave background layer. */
class Background extends DrawableObject {
    /**
     * @param {number} layer - Layer number, from 1 to 3.
     * @param {string} section - Section letter A, B or C.
     * @param {Function} onLoad - Requests a redraw after loading.
     */
    constructor(layer, section, onLoad) {
        super();
        const path = 'assets/images/backgrounds/jungle-cave/';
        this.loadImage(`${path}layer-0${layer}-${section.toLowerCase()}.png`, onLoad);
    }
}
