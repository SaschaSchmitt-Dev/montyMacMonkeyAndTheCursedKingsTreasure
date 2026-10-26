/** A floating ledge that can be landed on from above. */
class Platform extends DrawableObject {
    static types = {
        short: { width: 416, height: 175, walkY: 38, file: 'platform-02-floating-short.png' },
        long: { width: 800, height: 241, walkY: 42, file: 'platform-03-floating-long.png' }
    };
    surfaceY;
    imageOffsetY = 12;
    reward = 'coins';
    pattern = 'row';

    /** @param {number} x - Left image edge in world pixels.
     * @param {number} surfaceY - Walkable surface height in world pixels.
     * @param {string} type - Short or long ledge graphic.
     */
    constructor(x, surfaceY, type = 'short') {
        super();
        const settings = Platform.types[type];
        const scale = 220 / 416;
        this.x = x;
        this.surfaceY = surfaceY;
        this.width = settings.width * scale;
        this.height = settings.height * scale;
        this.y = surfaceY - settings.walkY * scale - this.imageOffsetY;
        this.loadImage('assets/images/objects/platforms/' + settings.file);
    }
}
