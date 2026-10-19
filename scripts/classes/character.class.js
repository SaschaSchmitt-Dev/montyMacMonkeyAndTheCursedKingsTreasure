/** Indiana Monkey in the initial idle pose. */
class Character extends DrawableObject {
    x = 120;
    y = 314;
    width = 128;
    height = 128;

    /** @param {Function} onLoad - Requests a redraw after loading. */
    constructor(onLoad) {
        super();
        this.loadImage('assets/images/character/idle/idle_00.png', onLoad);
    }
}
