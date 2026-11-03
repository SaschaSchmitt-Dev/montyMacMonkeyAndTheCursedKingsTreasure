/** A landing surface or solid floor block with matching jungle artwork. */
class Platform extends DrawableObject {
    static types = {
        step: { width: 208, height: 87.5, walkY: 19, file: 'platform-02-floating-short.png' },
        short: { width: 416, height: 175, walkY: 38, file: 'platform-02-floating-short.png' },
        long: { width: 800, height: 241, walkY: 42, file: 'platform-03-floating-long.png' },
        block: { width: 288, height: 163, walkY: 31, file: 'platform_04_step_block_high.png' }
    };
    surfaceY;
    imageOffsetY = 12;
    reward = 'coins';
    pattern = 'row';
    solid = false;

    /** @param {number} x - Left image edge in world pixels.
     * @param {number} surfaceY - Walkable surface height in world pixels.
     * @param {string} type - Short, long, half-size step or block graphic.
     */
    constructor(x, surfaceY, type = 'short') {
        super();
        const settings = Platform.types[type];
        const scale = 220 / 416;
        this.x = x;
        this.surfaceY = surfaceY;
        this.solid = type === 'block';
        this.width = settings.width * scale;
        this.height = settings.height * scale;
        this.y = surfaceY - settings.walkY * scale - this.imageOffsetY;
        this.loadImage('assets/images/objects/platforms/' + settings.file);
    }
}
