/** An animated enemy that moves along the ground. */
class Enemy extends MovableObject {
    static types = {
        'vine-lizard': { speed: 140, width: 120, height: 80, facesLeft: false, stompable: true },
        'thorn-beetle': { speed: 95, width: 108, height: 72, facesLeft: false, stompable: true },
        'armored-armadillo': { speed: 55, width: 132, height: 88, facesLeft: true, stompable: false }
    };
    type;
    frames;
    animationTime = 0;
    direction = -1;
    facingLeft = true;
    spriteFacesLeft;
    canBeStomped;
    defeated = false;
    deathTime = 0;
    deathFrames = [];
    spawnX;
    patrolRadius = 240;
    preferredPatrolBodyLengths = 5;
    patrolLeft = null;
    patrolRight = null;

    /**
     * @param {string} type - Enemy type from Enemy.types.
     * @param {number} x - Starting world position.
     * @param {number} floorY - Visible floor surface in world coordinates.
     */
    constructor(type, x, floorY) {
        super();
        this.configure(type, x, floorY);
        this.frames = Array.from({ length: 4 }, (_, index) =>
            `assets/images/enemies/${type}/movement/frame-0${index + 1}.png`
        );
        this.loadImages(this.frames);
        this.img = this.imageCache[this.frames[0]];
        this.loadDeathFrames();
    }

    /** Loads the four images used when the enemy is defeated. */
    loadDeathFrames() {
        this.deathFrames = Array.from({ length: 4 }, (_, index) =>
            `assets/images/enemies/${this.type}/death/frame-0${index + 1}.png`
        );
        this.loadImages(this.deathFrames);
    }

    /** Stops movement and starts the defeat animation once. */
    defeat() {
        if (this.defeated) return;
        this.defeated = true;
        gameAudio.effect(this.type, this.x);
        this.deathTime = 0;
        this.img = this.imageCache[this.deathFrames[0]];
    }

    /** @param {string} type - Enemy type.
     * @param {number} x - Starting position.
     * @param {number} floorY - Floor surface.
     */
    configure(type, x, floorY) {
        const settings = Enemy.types[type];
        this.type = type;
        this.x = x;
        this.spawnX = x;
        this.speed = settings.speed;
        this.width = settings.width;
        this.height = settings.height;
        this.y = floorY - this.height * 0.94;
        this.spriteFacesLeft = settings.facesLeft;
        this.canBeStomped = settings.stompable;
    }

    /** @param {number} deltaTime - Frame duration in seconds.
     * @param {number} levelWidth - Horizontal level boundary.
     * @param {boolean} canMove - Whether walking and its animation are enabled.
     * @param {Platform[]} blocks - Solid floor obstacles.
     * @returns {void} Updates state or drawing only.
     */
    update(deltaTime, levelWidth, canMove = true, blocks = []) {
        if (this.defeated) return this.updateDeath(deltaTime);
        if (!canMove) return;
        this.moveOnPatrol(deltaTime, levelWidth, blocks);
        this.animationTime += deltaTime;
        const path = this.frames[Math.floor(this.animationTime / 0.12) % this.frames.length];
        const image = this.imageCache[path];
        if (image.complete && image.naturalWidth > 0) this.img = image;
    }

    /** @param {number} deltaTime - Frame duration in seconds.
     * @param {number} levelWidth - Horizontal level boundary.
     * @param {Platform[]} blocks - Solid floor obstacles.
     */
    moveOnPatrol(deltaTime, levelWidth, blocks = []) {
        if (this.patrolLeft === null && !this.setPatrolBounds(levelWidth, blocks)) return;
        this.move(deltaTime, this.direction, levelWidth);
        this.x = Math.max(this.patrolLeft, Math.min(this.x, this.patrolRight));
        if (this.x <= this.patrolLeft) this.direction = 1;
        if (this.x >= this.patrolRight) this.direction = -1;
        this.facingLeft = this.direction < 0;
    }

    /** @param {number} levelWidth - Playable width before the exit transition.
     * @param {Platform[]} blocks - Fixed solid floor obstacles.
     * @returns {boolean} Whether the enemy fits in a free corridor, even when its preferred route is longer.
     */
    setPatrolBounds(levelWidth, blocks = []) {
        const areas = this.getPatrolAreas(levelWidth, blocks);
        if (areas.length === 0) return false;
        const distance = (area) => Math.abs(this.spawnX - Math.max(area.left, Math.min(this.spawnX, area.right)));
        areas.sort((a, b) => distance(a) - distance(b));
        this.applyPatrolArea(areas[0]);
        return true;
    }

    /** @param {number} levelWidth - Playable width.
     * @param {Platform[]} blocks - Obstacles dividing the floor into open corridors.
     * @returns {Object[]} Valid left-edge ranges, including the enemy's full width.
     */
    getPatrolAreas(levelWidth, blocks) {
        const areas = [];
        let left = 0;
        for (const block of [...blocks].sort((a, b) => a.x - b.x)) {
            const right = block.x + block.width * 0.06 - this.width;
            if (right >= left) areas.push({ left, right });
            left = Math.max(left, block.x + block.width * 0.94);
        }
        const right = levelWidth - this.width;
        if (right >= left) areas.push({ left, right });
        return areas;
    }

    /** @param {number} deltaTime - Frame duration in seconds. */
    updateDeath(deltaTime) {
        this.deathTime += deltaTime;
        const frame = Math.min(3, Math.floor(this.deathTime / 0.15));
        this.img = this.imageCache[this.deathFrames[frame]];
    }

    /** @param {CanvasRenderingContext2D} ctx - Canvas drawing context. */
    draw(ctx) {
        if (!this.img.complete || this.img.naturalWidth === 0) return;
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y);
        ctx.scale(this.facingLeft !== this.spriteFacesLeft ? -1 : 1, 1);
        ImageQuality.draw(ctx, this.img, -this.width / 2, 0, this.width, this.height);
        ctx.restore();
    }

    /** @param {{left: number, right: number}} area - Nearest free corridor that fits this enemy. */
    applyPatrolArea(area) {
        const span = Math.min(Math.max(this.patrolRadius * 2, this.width * this.preferredPatrolBodyLengths), area.right - area.left);
        this.patrolLeft = Math.max(area.left, Math.min(this.spawnX - span / 2, area.right - span));
        this.patrolRight = this.patrolLeft + span;
        this.x = Math.max(this.patrolLeft, Math.min(this.spawnX, this.patrolRight));
        this.spawnX = this.x;
        this.direction = this.x <= this.patrolLeft ? 1 : -1;
        this.facingLeft = this.direction < 0;
    }

}
