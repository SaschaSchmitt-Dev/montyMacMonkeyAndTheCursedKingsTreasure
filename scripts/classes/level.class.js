/** Stores the basic dimensions and starting position of a level. */
class Level {
    width;
    characterStartX;
    groundY;
    enemies = [];
    platforms = [];
    platformRepeatWidth = 5400;
    upperPlatformOffset = 120;
    blocks = [];
    ammoPickups = [];
    scoreItems = [];
    transitionX;
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

    /** @param {number} width - Width of the appended exit section in world pixels. */
    addTransition(width = 720) {
        this.transitionX = this.width;
        this.width += width;
    }

    /** @returns {Array[]} Ledge positions, height offsets, types and rewards. */
    getPlatformLayout() {
        return [
            [600, 0, 'short', 'coins', 'column'],
            [870, this.upperPlatformOffset, 'short', 'ammo', 'row'],
            [1450, 0, 'long', 'ingot', 'pyramid'],
            [1960, this.upperPlatformOffset, 'short', 'relic', 'row'],
            [2550, 0, 'short', 'ammo', 'row'],
            [2860, this.upperPlatformOffset, 'long', 'ingot', 'row'],
            [3735, this.upperPlatformOffset, 'long', 'relic', 'row'],
            [4240, 150, 'short', 'ammo', 'row'],
            [4820, 0, 'short', 'coins', 'arc'],
            [5100, this.upperPlatformOffset, 'long', 'relic', 'row']
        ];
    }

    /** @param {number} heightAboveGround - Minimum ledge height above the floor. */
    createPlatforms(heightAboveGround = 140) {
        this.platforms = [];
        const surfaceY = this.groundY + 122 - heightAboveGround;
        for (let offset = 0; offset < this.width; offset += this.platformRepeatWidth) {
            for (const [x, height, type, reward, pattern] of this.getPlatformLayout()) {
                const platform = new Platform(x + offset, surfaceY - Math.max(0, height), type);
                if (platform.x + platform.width > this.width - 200) continue;
                platform.reward = reward;
                platform.pattern = pattern;
                this.platforms.push(platform);
            }
        }
        this.addIntermediatePlatforms(heightAboveGround);
    }

    /** @param {number} heightAboveGround - Lower tier height used to reach the guarded upper ledge. */
    addIntermediatePlatforms(heightAboveGround) {
        const surfaceY = this.groundY + 122 - heightAboveGround;
        for (let offset = 0; offset < this.width; offset += this.platformRepeatWidth) {
            const platform = new Platform(3655 + offset, surfaceY, 'step');
            if (platform.x + platform.width > this.width - 200) continue;
            platform.reward = null;
            this.platforms.push(platform);
        }
    }

    /** @param {number} blockGroundOffsetY - Downward adjustment for both blocks and their surfaces. */
    createEnemyZone(blockGroundOffsetY = 6) {
        const floorY = this.groundY + 122;
        this.createZoneBlocks(blockGroundOffsetY);
        if (this.width < 4500) return;
        this.enemies = this.enemies.filter((enemy) => enemy.x + enemy.width < 3500 || enemy.x > 4400);
        ['vine-lizard', 'thorn-beetle', 'armored-armadillo'].forEach((type, index) => {
            this.enemies.push(new Enemy(type, 3710 + index * 160, floorY));
        });
    }

    /** Fits every patrol into an open corridor before the first game frame. */
    configureEnemyPatrols() {
        this.enemies = this.enemies.filter((enemy) => enemy.setPatrolBounds(this.width, this.blocks));
    }

    /** Adds floor treasures between the two blocks. */
    addGuardedTreasures() {
        if (this.blocks.length === 0 || this.width < 4500) return;
        const floorY = this.groundY + 122;
        for (let index = 0; index < 9; index++) {
            this.scoreItems.push(new ScoreItem('coin', 3690 + index * 54, floorY));
        }
        this.scoreItems.push(new ScoreItem('ingot', 3830, floorY - 50, floorY));
        this.scoreItems.push(new ScoreItem('relic', 3990, floorY - 50, floorY));
    }

    /** Places ammunition on the floor and on ledges reserved for ammunition. */
    createAmmo() {
        this.ammoPickups = [];
        for (let x = 400; x + 48 <= this.width - 200; x += 1500) {
            this.ammoPickups.push(new BananaAmmo(x, this.groundY + 122));
        }
        for (const platform of this.platforms) {
            if (platform.reward !== 'ammo') continue;
            this.ammoPickups.push(new BananaAmmo(platform.x + platform.width / 2 - 24, platform.surfaceY));
        }
        this.ammoPickups = this.ammoPickups.filter((pickup) => !this.isInsideFloorBlock(pickup));
    }

    /** Places floor coins and each ledge's chosen treasure formation. */
    createScoreItems() {
        this.createFloorTreasures();
        this.platforms.filter((platform) => platform.reward && platform.reward !== 'ammo')
            .forEach((platform) => this.addPlatformTreasures(platform));
        if (this.blocks.length > 0) {
            this.scoreItems = this.scoreItems.filter((item) => item.supportY !== this.groundY + 122
                || item.x < 3500 || item.x > 4400);
        }
        this.addGuardedTreasures();
        this.scoreItems = this.scoreItems.filter((item) => !this.isInsideFloorBlock(item));
    }

    /** @param {BananaAmmo|ScoreItem} item - Pickup whose support may be blocked.
     * @returns {boolean} Whether a floor pickup would be hidden inside a solid block.
     */
    isInsideFloorBlock(item) {
        if (item.supportY !== this.groundY + 122) return false;
        return this.blocks.some((block) => item.x + item.width > block.x + block.width * 0.06
            && item.x < block.x + block.width * 0.94);
    }

    /** @param {Platform} platform - Ledge and its chosen treasure layout. */
    addPlatformTreasures(platform) {
        const positions = this.getTreasurePattern(platform.pattern);
        const center = platform.pattern === 'pyramid' ? 6 : Math.floor(positions.length / 2);
        positions.forEach(([x, y], index) => {
            const type = index === center && platform.reward !== 'coins' ? platform.reward : 'coin';
            this.scoreItems.push(new ScoreItem(type, platform.x + platform.width / 2 + x - 20,
                platform.surfaceY + y, platform.surfaceY));
        });
    }

    /** @param {string} pattern - Name of a treasure formation.
     * @returns {number[][]} Horizontal and vertical offsets from the ledge center.
     */
    getTreasurePattern(pattern) {
        const patterns = {
            row: [[-96, 0], [-48, 0], [0, 0], [48, 0], [96, 0]],
            column: [[0, 0], [0, -40], [0, -80]],
            arc: [[-80, 0], [-40, -25], [0, -45], [40, -25], [80, 0]],
            diamond: [[0, 0], [-48, -40], [0, -40], [48, -40], [0, -80]],
            pyramid: [[-96, 0], [-48, 0], [0, 0], [48, 0], [96, 0],
                [-48, -44], [0, -44], [48, -44], [0, -88]]
        };
        return patterns[pattern];
    }

    /** @param {number} patrolRadius - Maximum walking distance on either side of each spawn. */
    createEnemies(patrolRadius = 240) {
        const types = Object.keys(Enemy.types);
        const lastX = this.width - 400 - 132;
        this.enemies = [];
        for (let slotX = 1000; slotX <= lastX; slotX += 700) {
            const offset = Math.random() * Math.min(240, lastX - slotX);
            const type = types[Math.floor(Math.random() * types.length)];
            const enemy = new Enemy(type, slotX + offset, this.groundY + 122);
            enemy.patrolRadius = patrolRadius;
            this.enemies.push(enemy);
        }
    }

    /** @param {number} blockGroundOffsetY - Shared visual and collision offset of the floor blocks. */
    createZoneBlocks(blockGroundOffsetY) {
        this.blocks = [];
        const floorY = this.groundY + 122;
        for (let offset = 0; offset < this.width; offset += this.platformRepeatWidth) {
            for (const x of [3500, 4240]) {
                const block = new Platform(x + offset, floorY - 58 + blockGroundOffsetY, 'block');
                if (block.x + block.width <= this.width - 200) this.blocks.push(block);
            }
        }
    }

    /** Adds the regular rows of floor coins before filtering guarded areas. */
    createFloorTreasures() {
        this.scoreItems = [];
        for (let x = 1150; x + 200 <= this.width - 200; x += 1500) {
            for (let index = 0; index < 3; index++) {
                this.scoreItems.push(new ScoreItem('coin', x + index * 80, this.groundY + 122));
            }
        }
    }

}
