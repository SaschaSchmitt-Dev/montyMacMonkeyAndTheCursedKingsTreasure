/** An animated treasure that awards points when collected. */
class ScoreItem extends DrawableObject {
    static types = {
        coin: { folder: 'gold-coin', prefix: 'coin', points: 10, rotationDuration: 1 },
        ingot: { folder: 'gold-ingot', prefix: 'ingot', points: 50, rotationDuration: 2 },
        relic: { folder: 'gold-score-relic', prefix: 'relic', points: 100, rotationDuration: 3 }
    };
    width = 40;
    height = 40;
    points;
    frames;
    animationTime = 0;
    frameCount = 24;
    framesPerSecond;

    /** @param {string} type - Treasure type from ScoreItem.types.
     * @param {number} x - Left edge in world pixels.
     * @param {number} surfaceY - Supporting surface in world pixels.
     */
    constructor(type, x, surfaceY) {
        super();
        const settings = ScoreItem.types[type];
        this.x = x;
        this.y = surfaceY - this.height;
        this.points = settings.points;
        this.framesPerSecond = this.frameCount / settings.rotationDuration;
        this.frames = Array.from({ length: this.frameCount }, (_, index) =>
            `assets/images/items/${settings.folder}/${settings.prefix}-${String(index).padStart(2, '0')}.png`
        );
        this.loadImages(this.frames);
        this.img = this.imageCache[this.frames[0]];
    }


    /** @param {number} deltaTime - Frame duration in seconds. */
    update(deltaTime) {
        this.animationTime += deltaTime;
        const frame = Math.floor(this.animationTime * this.framesPerSecond) % this.frames.length;
        const image = this.imageCache[this.frames[frame]];
        if (image.complete && image.naturalWidth > 0) this.img = image;
    }


    /** @param {Character} character - Player body.
     * @returns {boolean} Whether the player's body touches this treasure.
     */
    touches(character) {
        return character.x + character.width * 0.75 > this.x + 6
            && character.x + character.width * 0.25 < this.x + this.width - 6
            && character.y + character.height * 244 / 256 > this.y + 6
            && character.y + 20 < this.y + this.height - 4;
    }
}
