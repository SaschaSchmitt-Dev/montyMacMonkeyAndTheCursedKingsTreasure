/** A floating ledge that can be landed on from above. */
class Platform extends DrawableObject {
    width = 220;
    height = 110;
    surfaceY;
    imageOffsetY = 12;

    /** @param {number} x - Left image edge in world pixels.
     * @param {number} surfaceY - Walkable surface height in world pixels.
     */
    constructor(x, surfaceY) {
        super();
        this.x = x;
        this.surfaceY = surfaceY;
        this.y = surfaceY - this.height * (33 / 153) - this.imageOffsetY;
        this.loadImage('assets/images/objects/platforms/platform-02-floating-short.png');
    }
}
