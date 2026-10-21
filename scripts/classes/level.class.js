/** Stores the basic dimensions and starting position of a level. */
class Level {
    width;
    characterStartX;
    groundY;
    enemies = [];
    platforms = [];
    ammoPickups = [];
    scoreItems = [];
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


    /** @param {number} heightAboveGround - Lower ledge height above the floor in pixels. */
    createPlatforms(heightAboveGround = 115) {
        this.platforms = [];
        const surfaceY = this.groundY + 122 - heightAboveGround;
        for (let x = 600; x + 490 <= this.width - 400; x += 1500) {
            this.platforms.push(new Platform(x, surfaceY));
            this.platforms.push(new Platform(x + 270, surfaceY - 80));
        }
    }


    /** Places banana bunches on the floor and on every upper ledge. */
    createAmmo() {
        this.ammoPickups = [];
        for (let x = 400; x + 48 <= this.width - 200; x += 1500) {
            this.ammoPickups.push(new BananaAmmo(x, this.groundY + 122));
        }
        this.platforms.forEach((platform, index) => {
            if (index % 2 === 1) {
                this.ammoPickups.push(new BananaAmmo(platform.x + 86, platform.surfaceY));
            }
        });
    }


    /** Places coins on the floor and more valuable treasures on ledges. */
    createScoreItems() {
        this.scoreItems = [];
        for (let x = 1150; x + 200 <= this.width - 200; x += 1500) {
            for (let index = 0; index < 3; index++) {
                this.scoreItems.push(new ScoreItem('coin', x + index * 80, this.groundY + 122));
            }
        }
        this.platforms.forEach((platform, index) => {
            const type = index % 2 === 0 ? 'ingot' : 'relic';
            this.scoreItems.push(new ScoreItem(type, platform.x + 35, platform.surfaceY));
        });
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
