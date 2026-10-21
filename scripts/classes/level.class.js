/** Stores the basic dimensions and starting position of a level. */
class Level {
    width;
    characterStartX;
    groundY;
    enemies = [];
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


    /** Creates a fresh enemy layout with a clear start and spaced spawn areas. */
    createEnemies() {
        const types = Object.keys(Enemy.types);
        const lastX = this.width - 400 - 132;
        this.enemies = [];
        for (let slotX = 1000; slotX <= lastX; slotX += 700) {
            const offset = Math.random() * Math.min(240, lastX - slotX);
            const type = types[Math.floor(Math.random() * types.length)];
            this.enemies.push(new Enemy(type, slotX + offset, this.groundY + 122));
        }
    }
}
