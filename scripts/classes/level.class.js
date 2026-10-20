/** Stores the basic dimensions and starting position of a level. */
class Level {
    width;
    characterStartX;
    groundY;
    parallaxFactors = [0.22, 0.48, 0.80];

    /**
     * @param {number} width - Level width in world pixels.
     * @param {number} characterStartX - Initial horizontal player position.
     * @param {number} groundY - Player position when standing on the ground.
     */
    constructor(width, characterStartX, groundY) {
        this.width = width;
        this.characterStartX = characterStartX;
        this.groundY = groundY;
    }
}
