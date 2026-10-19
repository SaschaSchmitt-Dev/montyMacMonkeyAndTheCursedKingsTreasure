/** The ground image, including its transparent upper margin. */
class Ground extends DrawableObject {
    y = 330;
    height = 320;

    /** @param {Function} onLoad - Requests a redraw after loading. */
    constructor(onLoad) {
        super();
        this.loadImage('assets/images/objects/platforms/platform_01_ground_straight.png', onLoad);
    }
}
