/** The monkey king casting curse orbs from a fixed position. */
class Boss extends DrawableObject {
    width = 300;
    height = 200;
    frames = [];
    attackFrames = [];
    hitFrames = [];
    deathFrames = [];
    maxHealth = 10;
    invulnerableDuration = 1;
    invulnerableTime = 0;
    health = this.maxHealth;
    hitTime = 0;
    deathTime = 0;
    deathOffsetY = 0;
    defeated = false;
    projectiles = [];
    projectilePath = 'assets/images/projectiles/boss/curse-orb.png';
    animationTime = 0;
    attackInterval = 0.8;
    attackIntervalVariation = 0.4;
    cooldown = 2.5;
    attacking = false;
    attackTime = 0;
    shotsReleased = 0;
    attackShots = [];
    shotInterval = 0.6;
    highShotOffset = 96;
    attackPatterns = ['low-high', 'high-low', 'low-high-low', 'high-low-high', 'high-high-low', 'low-high-high'];
    patternStreak = 0;
    attackPattern = null;

    /** @param {number} roomWidth - Chamber width in pixels.
     * @param {number} floorY - Player foot position on the floor.
     * @param {Function} onLoad - Requests a redraw after loading.
     */
    constructor(roomWidth, floorY, onLoad) {
        super();
        this.x = roomWidth - this.width - 40;
        this.y = floorY - this.height * 0.98;
        this.frames = this.createFramePaths('idle', 4);
        this.attackFrames = this.createFramePaths('attack', 4);
        this.loadImages([...this.frames, ...this.attackFrames, this.projectilePath], onLoad);
        this.loadDamageFrames(onLoad);
        this.img = this.imageCache[this.frames[0]];
    }

    /** @param {Function} onLoad - Requests a redraw after loading. */
    loadDamageFrames(onLoad) {
        this.hitFrames = this.createFramePaths('hit', 2);
        this.deathFrames = this.createFramePaths('death', 4);
        this.loadImages([...this.hitFrames, ...this.deathFrames], onLoad);
    }

    /** Removes one life unless the boss is defeated or temporarily protected. */
    takeHit() {
        if (this.defeated || this.invulnerableTime > 0) return;
        this.health = Math.max(0, this.health - 1);
        this.invulnerableTime = this.invulnerableDuration;
        this.hitTime = 0.25;
        if (this.health > 0) gameAudio.effect('bossHurt');
        if (this.health === 0) {
            this.defeated = true;
            this.attacking = false;
            this.projectiles = [];
        }
        if (this.defeated || !this.attacking) this.updateDamageAnimation(0);
    }

    /** @param {number} deltaTime - Frame duration in seconds. */
    updateDamageAnimation(deltaTime) {
        if (this.defeated) this.deathTime += deltaTime;

        const paths = this.defeated ? this.deathFrames : this.hitFrames;
        const time = this.defeated ? this.deathTime * 3.5 : (0.25 - this.hitTime) * 8;
        this.img = this.imageCache[paths[Math.min(paths.length - 1, Math.floor(time))]];
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
     * @returns {void} Updates state or drawing only.
     */
    update(deltaTime, canAttack = true) {
        this.projectiles.forEach((projectile) => projectile.update(deltaTime));
        this.projectiles = this.projectiles.filter((projectile) => projectile.x + projectile.width >= 0);
        if (this.defeated) return this.updateDamageAnimation(deltaTime);
        this.invulnerableTime = Math.max(0, this.invulnerableTime - deltaTime);
        this.hitTime = Math.max(0, this.hitTime - deltaTime);
        this.updateAttackCycle(deltaTime, canAttack);
        if (this.hitTime > 0 && !this.attacking) this.updateDamageAnimation(0);
        else this.updateAnimation(deltaTime);
    }

    /** @param {number} deltaTime - Frame duration in seconds.
     * @param {boolean} canAttack - Whether the player is alive.
     */
    updateAttackCycle(deltaTime, canAttack) {
        if (!canAttack) this.attacking = false;
        else if (this.attacking) this.advanceAttack(deltaTime);
        else {
            this.cooldown -= deltaTime;
            if (this.cooldown <= 0) this.startAttack();
        }
    }

    /** Selects a random pattern and resets the timed projectile releases. */
    startAttack() {
        this.attacking = true;
        gameAudio.effect('charge');
        this.attackTime = 0;
        this.shotsReleased = 0;
        this.selectAttackPattern();
        this.attackShots = this.attackPattern.split('-').map((height) => height === 'high');
    }

    /** Allows random repeats but prevents the same pattern more than twice in a row. */
    selectAttackPattern() {
        const alternatives = this.attackPatterns.filter((pattern) => pattern !== this.attackPattern);
        const choices = this.patternStreak >= 2 && alternatives.length > 0 ? alternatives : this.attackPatterns;
        const next = choices[Math.floor(Math.random() * choices.length)];
        this.patternStreak = next === this.attackPattern ? this.patternStreak + 1 : 1;
        this.attackPattern = next;
    }

    /** @returns {number} Recovery pause between 0.8 and 1.2 seconds after a salvo. */
    getAttackDelay() {
        return this.attackInterval + Math.random() * this.attackIntervalVariation;
    }

    /** @param {number} deltaTime - Frame duration in seconds. */
    advanceAttack(deltaTime) {
        this.attackTime += deltaTime;
        this.releaseDueShots();
        const duration = 0.78 + (this.attackShots.length - 1) * this.shotInterval;
        if (this.attackTime >= duration) {
            this.attacking = false;
            this.cooldown = this.getAttackDelay();
        }
    }

    /** Fires each scheduled orb once, preserving the proven gap between shots. */
    releaseDueShots() {
        while (this.shotsReleased < this.attackShots.length
            && this.attackTime >= 0.36 + this.shotsReleased * this.shotInterval) {
            this.releaseShot(this.attackShots[this.shotsReleased]);
            this.shotsReleased++;
        }
    }

    /** @returns {number} Time within the casting animation for the current shot. */
    getCastingTime() {
        const last = Math.max(0, this.attackShots.length - 1);
        const cycle = Math.min(last, Math.floor(this.attackTime / this.shotInterval));
        return this.attackTime - cycle * this.shotInterval;
    }

    /** @param {boolean} high - Whether the orb travels above the standing player. */
    releaseShot(high) {
        gameAudio.effect('cast');
        const y = this.y + this.height - 80 - (high ? this.highShotOffset : 0);
        this.projectiles.push(new BossProjectile(this.x - 20, y, this.imageCache[this.projectilePath], this.y - 20));
    }

    /** @param {number} deltaTime - Frame duration in seconds. */
    updateAnimation(deltaTime) {
        this.animationTime += deltaTime;
        const paths = this.attacking ? this.attackFrames : this.frames;
        const time = this.attacking ? this.getCastingTime() / 0.18 : this.animationTime / 0.65;
        const frame = this.attacking ? Math.min(3, Math.floor(time)) : Math.floor(time) % paths.length;
        const image = this.imageCache[paths[frame]];
        if (image.complete && image.naturalWidth > 0) this.img = image;
    }

    /** @param {CanvasRenderingContext2D} ctx - Canvas drawing context. */
    draw(ctx) {
        if (!this.img.complete || this.img.naturalWidth === 0) return;
        ctx.save();
        if (!this.defeated && this.invulnerableTime > 0) {
            ctx.globalAlpha = Math.floor(this.invulnerableTime * 12) % 2 === 0 ? 1 : 0.55;
        }
        const y = this.y + (this.defeated ? this.deathOffsetY : 0);
        ctx.translate(this.x + this.width, y);
        ctx.scale(-1, 1);
        ImageQuality.draw(ctx, this.img, 0, 0, this.width, this.height);
        ctx.restore();
        this.projectiles.forEach((projectile) => projectile.draw(ctx));
    }
}
