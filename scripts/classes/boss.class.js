/** The monkey king casting curse orbs from a fixed position. */
class Boss extends DrawableObject {
    width = 300;
    height = 200;
    frames = [];
    attackFrames = [];
    projectiles = [];
    projectilePath = 'assets/images/projectiles/boss/curse-orb.png';
    animationTime = 0;
    attackInterval = 2.5;
    cooldown = 2.5;
    attacking = false;
    attackTime = 0;
    shotReleased = false;

    /** @param {number} roomWidth - Chamber width in pixels.
     * @param {number} floorY - Player foot position on the floor.
     * @param {Function} onLoad - Requests a redraw after loading.
     */
    constructor(roomWidth, floorY, onLoad) {
        super();
        this.x = roomWidth - this.width - 40;
        this.y = floorY - this.height * 0.98;
        this.frames = this.createFramePaths('idle', 2);
        this.attackFrames = this.createFramePaths('attack', 4);
        this.loadImages([...this.frames, ...this.attackFrames, this.projectilePath], onLoad);
        this.img = this.imageCache[this.frames[0]];
    }


    /** @param {string} animation - Animation folder and filename prefix.
     * @param {number} count - Number of frames.
     * @returns {string[]} Ordered image paths.
     */
    createFramePaths(animation, count) {
        return Array.from({ length: count }, (_, index) =>
            `assets/images/enemies/cursed-monkey-king/${animation}/${animation}-0${index + 1}.png`
        );
    }


    /** @param {number} deltaTime - Frame duration in seconds.
     * @param {boolean} canAttack - Whether the player is alive.
     */
    update(deltaTime, canAttack = true) {
        this.projectiles.forEach((projectile) => projectile.update(deltaTime));
        this.projectiles = this.projectiles.filter((projectile) => projectile.x + projectile.width >= 0);
        if (!canAttack) this.attacking = false;
        else if (this.attacking) this.advanceAttack(deltaTime);
        else {
            this.cooldown -= deltaTime;
            if (this.cooldown <= 0) this.startAttack();
        }
        this.updateAnimation(deltaTime);
    }


    /** Starts the attack animation and resets its single-shot release. */
    startAttack() {
        this.attacking = true;
        this.attackTime = 0;
        this.shotReleased = false;
    }


    /** @param {number} deltaTime - Frame duration in seconds. */
    advanceAttack(deltaTime) {
        this.attackTime += deltaTime;
        if (!this.shotReleased && this.attackTime >= 2 / 7) {
            this.projectiles.push(new BossProjectile(this.x - 20, this.y + this.height - 80,
                this.imageCache[this.projectilePath]));
            this.shotReleased = true;
        }
        if (this.attackTime >= 4 / 7) {
            this.attacking = false;
            this.cooldown = this.attackInterval;
        }
    }


    /** @param {number} deltaTime - Frame duration in seconds. */
    updateAnimation(deltaTime) {
        this.animationTime += deltaTime;
        const paths = this.attacking ? this.attackFrames : this.frames;
        const time = this.attacking ? this.attackTime * 7 : this.animationTime * 3;
        const frame = this.attacking ? Math.min(3, Math.floor(time)) : Math.floor(time) % paths.length;
        const image = this.imageCache[paths[frame]];
        if (image.complete && image.naturalWidth > 0) this.img = image;
    }


    /** @param {CanvasRenderingContext2D} ctx - Canvas drawing context. */
    draw(ctx) {
        if (!this.img.complete || this.img.naturalWidth === 0) return;
        ctx.save();
        ctx.translate(this.x + this.width, this.y);
        ctx.scale(-1, 1);
        ctx.drawImage(this.img, 0, 0, this.width, this.height);
        ctx.restore();
        this.projectiles.forEach((projectile) => projectile.draw(ctx));
    }
}
