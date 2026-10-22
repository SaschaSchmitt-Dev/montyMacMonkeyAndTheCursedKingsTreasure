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
     */
    update(deltaTime, levelWidth, canMove = true) {
        if (this.defeated) return this.updateDeath(deltaTime);
        if (!canMove) return;
        this.moveOnPatrol(deltaTime, levelWidth);
        this.animationTime += deltaTime;
        const path = this.frames[Math.floor(this.animationTime / 0.12) % this.frames.length];
        const image = this.imageCache[path];
        if (image.complete && image.naturalWidth > 0) this.img = image;
    }


    /** @param {number} deltaTime - Frame duration in seconds.
     * @param {number} levelWidth - Horizontal level boundary.
     */
    moveOnPatrol(deltaTime, levelWidth) {
        const right = Math.max(0, Math.min(levelWidth - this.width, this.spawnX + this.patrolRadius));
        const left = Math.min(right, Math.max(0, this.spawnX - this.patrolRadius));
        this.move(deltaTime, this.direction, levelWidth);
        this.x = Math.max(left, Math.min(this.x, right));
        if (this.x <= left) this.direction = 1;
        if (this.x >= right) this.direction = -1;
        this.facingLeft = this.direction < 0;
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
        ctx.drawImage(this.img, -this.width / 2, 0, this.width, this.height);
        ctx.restore();
    }
}
