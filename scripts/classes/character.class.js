/** Indiana Monkey with running and a single animated jump. */
class Character extends MovableObject {
    x = 120;
    y = 320;
    width = 128;
    height = 128;
    floorGroundY = 320;
    ammo = 0;
    score = 0;
    throwTime = 0;
    throwImages = [];
    ridingEnemy = null;
    health = 3;
    invulnerableTime = 0;
    hitTime = 0;
    hitImages = [];
    deathImages = [];
    idlePath = 'assets/images/character/idle/idle-00.png';
    runImages = [];
    jumpImages = [];
    restImages = [];
    inactiveTime = 0;
    sleepScale = 0.8;
    sleepOffsetY = 16;
    sleepAngle = -8;
    animation = 'idle';
    animationTime = 0;
    moving = false;
    jumpHeld = false;
    takeoffTime = 0;
    landingTime = 0;
    airTime = 0;
    idleTime = 0;
    idleDelay = 4 + Math.random() * 4;
    idleVariant = Math.random() < 0.5 ? 'hat' : 'map';
    idleClips;

    /** @param {Function} onLoad - Requests a redraw after loading. */
    constructor(onLoad) {
        super();
        this.loadImage(this.idlePath, onLoad);
        this.imageCache[this.idlePath] = this.img;
        this.runImages = this.createFramePaths('run-right/run', 8);
        this.jumpImages = this.createFramePaths('jump/jump', 6);
        this.restImages = this.createFramePaths('rest/rest', 6);
        this.loadImages([...this.runImages, ...this.jumpImages, ...this.restImages], onLoad);
        this.setupIdleAnimations(onLoad);
        this.setupDamageAnimations(onLoad);
    }


    /** @param {Function} onLoad - Requests a redraw after loading. */
    setupDamageAnimations(onLoad) {
        this.hitImages = this.createFramePaths('hit/hit', 4);
        this.deathImages = this.createFramePaths('death/death', 4);
        this.loadImages([...this.hitImages, ...this.deathImages], onLoad);
    }


    /** Removes one life unless protection is active or no lives remain. */
    takeHit() {
        if (this.health === 0 || this.invulnerableTime > 0) return;
        this.health--;
        this.invulnerableTime = 1.2;
        this.hitTime = 0.4;
        this.inactiveTime = 0;
        this.takeoffTime = 0;
        this.landingTime = 0;
        this.animation = '';
        this.updateAnimation(0);
    }


    /** @param {Function} onLoad - Requests a redraw after loading. */
    setupIdleAnimations(onLoad) {
        const hat = this.createFramePaths('idle-hat/hat', 3);
        const map = this.createFramePaths('idle-map/map', 4);
        this.idleClips = {
            hat: { paths: [hat[0], hat[1], hat[2], hat[0]], times: [0.3, 0.75, 0.65, 0.15] },
            map: { paths: [map[0], map[1], map[2], map[1], map[3], map[0]], times: [0.26, 1, 1.1, 0.45, 0.65, 0.18] }
        };
        this.loadImages([...hat, ...map], onLoad);
    }


    /** @param {number} deltaTime - Frame duration in seconds.
     * @returns {string} Current idle image, including occasional hat/map gestures.
     */
    getIdlePath(deltaTime) {
        this.idleTime += deltaTime;
        if (this.idleTime < this.idleDelay) return this.idlePath;
        const clip = this.idleClips[this.idleVariant];
        let time = this.idleTime - this.idleDelay;
        for (let index = 0; index < clip.paths.length; index++) {
            if (time < clip.times[index]) return clip.paths[index];
            time -= clip.times[index];
        }
        this.resetIdle();
        this.idleVariant = this.idleVariant === 'hat' ? 'map' : 'hat';
        return this.idlePath;
    }


    /** Restarts the quiet delay after movement or a completed gesture. */
    resetIdle() {
        if (this.idleTime > 0) {
            this.idleTime = 0;
            this.idleDelay = 4 + Math.random() * 4;
        }
    }


    /**
     * @param {string} name - Animation folder and filename prefix.
     * @param {number} count - Number of consecutive frames.
     * @returns {string[]} Animation paths in playback order.
     */
    createFramePaths(name, count) {
        return Array.from({ length: count }, (_, index) =>
            `assets/images/character/${name}-${String(index).padStart(2, '0')}.png`
        );
    }


    /**
     * @param {number} deltaTime - Frame duration in seconds.
     * @param {Keyboard} keyboard - Current input state.
     * @param {number} levelWidth - Width of the playable level.
     * @param {Platform[]} platforms - Floating landing surfaces.
     */
    update(deltaTime, keyboard, levelWidth, platforms = []) {
        this.invulnerableTime = Math.max(0, this.invulnerableTime - deltaTime);
        this.hitTime = Math.max(0, this.hitTime - deltaTime);
        if (this.health === 0) return this.updateDeath(deltaTime, platforms);
        const previousX = this.x;
        this.move(deltaTime, keyboard.getDirection(), levelWidth);
        this.moving = this.x !== previousX;
        this.updateSupport(platforms);
        this.readJumpInput(keyboard.jump);
        this.updateJump(deltaTime);
        this.updateSleep(deltaTime, keyboard, platforms);
        this.updateAnimation(deltaTime);
    }


    /** @param {number} deltaTime - Frame duration in seconds.
     * @param {Platform[]} platforms - Surfaces below the falling figure.
     */
    updateDeath(deltaTime, platforms) {
        this.updateSupport(platforms);
        this.applyGravity(deltaTime);
        this.updateAnimation(deltaTime);
    }


    /** @param {Platform[]} platforms - Ledges below the player's feet. */
    updateSupport(platforms) {
        this.groundY = this.floorGroundY;
        for (const platform of platforms) {
            const landingY = platform.surfaceY - this.height * 244 / 256;
            const overlaps = this.x + this.width * 0.7 > platform.x + platform.width * 0.06
                && this.x + this.width * 0.3 < platform.x + platform.width * 0.94;
            if (overlaps && this.y <= landingY + 0.01) {
                this.groundY = Math.min(this.groundY, landingY);
            }
        }
        this.updateEnemySupport();
    }


    /** Keeps the current armored back as support only while standing above it. */
    updateEnemySupport() {
        const enemy = this.ridingEnemy;
        if (!enemy) return;
        const landingY = enemy.y + enemy.height * 0.2 - this.height * 244 / 256;
        if (enemy.defeated || this.velocityY < 0 || Math.abs(this.y - landingY) > 0.1
            || !EnemyCollisions.overlapsHorizontally(this, enemy)) {
            this.ridingEnemy = null;
        } else {
            this.groundY = Math.min(this.groundY, landingY);
        }
    }


    /** @param {boolean} pressed - A new press may interrupt the landing pose. */
    readJumpInput(pressed) {
        if (pressed && !this.jumpHeld && this.isGrounded()
            && this.takeoffTime === 0) {
            this.landingTime = 0;
            this.takeoffTime = 0.08;
        }
        this.jumpHeld = pressed;
    }


    /** @param {number} deltaTime - Frame duration in seconds. */
    updateJump(deltaTime) {
        this.landingTime = Math.max(0, this.landingTime - deltaTime);
        if (this.takeoffTime > 0) {
            this.updateTakeoff(deltaTime);
            return;
        }
        const wasInAir = !this.isGrounded();
        if (wasInAir) this.airTime += deltaTime;
        this.applyGravity(deltaTime);
        if (wasInAir && this.isGrounded()) this.landingTime = 0.1;
    }


    /** @param {number} deltaTime - Frame duration in seconds. */
    updateTakeoff(deltaTime) {
        this.takeoffTime = Math.max(0, this.takeoffTime - deltaTime);
        if (this.takeoffTime === 0) {
            this.airTime = 0;
            this.jump();
        }
    }


    /**
     * @param {number} deltaTime - Frame duration in seconds.
     * @param {Keyboard} keyboard - Current input state.
     * @param {Platform[]} platforms - Available resting surfaces.
     */
    updateSleep(deltaTime, keyboard, platforms) {
        const input = keyboard.getDirection() !== 0 || keyboard.jump || keyboard.throw;
        if (input || !this.isGrounded() || this.takeoffTime > 0 || this.landingTime > 0
            || !this.hasSleepingSpace(platforms)) {
            this.inactiveTime = 0;
        } else {
            this.inactiveTime = Math.min(15, this.inactiveTime + deltaTime);
        }
    }


    /** @param {Platform[]} platforms - Ledges supporting the lying figure.
     * @returns {boolean} Whether the sleeping pose fits on the current surface.
     */
    hasSleepingSpace(platforms) {
        if (this.groundY === this.floorGroundY) return true;
        const image = this.imageCache[this.restImages[5]];
        if (!image.complete || image.naturalHeight === 0) return false;
        const imageWidth = image.naturalWidth * this.height / image.naturalHeight;
        const tiltMargin = this.height * Math.abs(Math.sin(this.sleepAngle * Math.PI / 180));
        const halfWidth = (imageWidth / 2 + tiltMargin) * this.sleepScale;
        const centerX = this.x + this.width / 2;
        return platforms.some((platform) => Math.abs(platform.surfaceY - this.y - this.height * 244 / 256) < 0.1
            && centerX - halfWidth >= platform.x + platform.width * 0.06
            && centerX + halfWidth <= platform.x + platform.width * 0.94);
    }


    /** @returns {string} Highest-priority animation for the current state. */
    getAnimation() {
        if (this.health === 0) return 'death';
        if (this.hitTime > 0) return 'hit';
        if (this.throwTime > 0) return 'throw';
        const jumping = !this.isGrounded() || this.takeoffTime > 0 || this.landingTime > 0;
        if (jumping) return 'jump';
        if (this.inactiveTime >= 15) return 'sleep';
        return this.moving ? 'run' : 'idle';
    }


    /** @param {number} deltaTime - Frame duration in seconds. */
    updateAnimation(deltaTime) {
        const nextAnimation = this.getAnimation();
        this.animationTime = nextAnimation === this.animation ? this.animationTime + deltaTime : 0;
        this.animation = nextAnimation;
        if (this.animation !== 'idle') this.resetIdle();
        const image = this.imageCache[this.getAnimationPath(deltaTime)];
        if (image.complete && image.naturalWidth > 0) this.img = image;
    }


    /** @param {number} deltaTime - Frame duration in seconds.
     * @returns {string} Image path for the current animation frame.
     */
    getAnimationPath(deltaTime) {
        if (this.animation === 'death') return this.deathImages[Math.min(3, Math.floor(this.animationTime / 0.16))];
        if (this.animation === 'hit') return this.hitImages[Math.min(3, Math.floor(this.animationTime / 0.1))];
        if (this.animation === 'throw') return this.throwImages[Math.min(5, Math.floor((0.48 - this.throwTime) / 0.08))];
        if (this.animation === 'run') return this.runImages[Math.floor(this.animationTime / 0.08) % 8];
        if (this.animation === 'jump') return this.jumpImages[this.getJumpFrame()];
        if (this.animation === 'sleep') return this.restImages[Math.min(5, Math.floor(this.animationTime / 0.18))];
        return this.getIdlePath(deltaTime);
    }


    /** @returns {number} Pose for takeoff, ascent, apex, fall or landing. */
    getJumpFrame() {
        if (this.takeoffTime > 0) return 0;
        if (this.landingTime > 0) return 5;
        if (Math.abs(this.velocityY) < 100) return 3;
        if (this.velocityY < 0) return this.airTime < 0.09 ? 1 : 2;
        return 4;
    }


    /** @param {CanvasRenderingContext2D} ctx - Canvas drawing context. */
    draw(ctx) {
        if (!this.img.complete || this.img.naturalWidth === 0) return;
        const drawWidth = this.img.naturalWidth * this.height / this.img.naturalHeight;
        ctx.save();
        if (this.health > 0 && this.invulnerableTime > 0 && Math.floor(this.invulnerableTime * 12) % 2) ctx.globalAlpha = 0.45;
        ctx.translate(this.x + this.width / 2, this.y + this.height * 244 / 256);
        ctx.scale(this.facingLeft ? -1 : 1, 1);
        this.rotateSleepPose(ctx);
        ctx.drawImage(this.img, -drawWidth / 2, -this.height * 244 / 256, drawWidth, this.height);
        ctx.restore();
    }


    /** @param {CanvasRenderingContext2D} ctx - Canvas drawing context. */
    rotateSleepPose(ctx) {
        if (this.animation !== 'sleep') return;
        ctx.translate(0, this.sleepOffsetY);
        ctx.rotate(this.sleepAngle * Math.PI / 180);
        ctx.scale(this.sleepScale, this.sleepScale);
    }
}
