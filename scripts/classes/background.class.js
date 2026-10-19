/** The first static cave background. */
class Background extends DrawableObject {
    /** @param {Function} onLoad - Requests a redraw after loading. */
    constructor(onLoad) {
        super();
        this.loadImage('assets/images/backgrounds/jungle-cave/layer_01_A.png', onLoad);
    }
}
