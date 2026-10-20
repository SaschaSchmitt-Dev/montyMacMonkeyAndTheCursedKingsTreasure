/** Indiana Monkey with running and a single animated jump. */
class Character extends MovableObject {
    x = 120;
    y = 314;
    width = 128;
    height = 128;
    idlePath = 'assets/images/character/idle/idle-00.png';
    runImages = [];
    jumpImages = [];
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
        this.loadImages([...this.runImages, ...this.jumpImages], onLoad);
        this.setupIdleAnimations(onLoad);
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
     * @param {number} screenWidth - Width of the playable area.
     */
    update(deltaTime, keyboard, screenWidth) {
        const previousX = this.x;
        this.move(deltaTime, keyboard.getDirection(), screenWidth);
        this.moving = this.x !== previousX;
        this.readJumpInput(keyboard.jump);
        this.updateJump(deltaTime);
        this.updateAnimation(deltaTime);
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


    /** @param {number} deltaTime - Frame duration in seconds. */
    updateAnimation(deltaTime) {
        const jumping = !this.isGrounded() || this.takeoffTime > 0 || this.landingTime > 0;
        const nextAnimation = jumping ? 'jump' : (this.moving ? 'run' : 'idle');
        this.animationTime = nextAnimation === this.animation ? this.animationTime + deltaTime : 0;
        this.animation = nextAnimation;
        if (this.animation !== 'idle') this.resetIdle();
        let path = this.animation === 'idle' ? this.getIdlePath(deltaTime) : this.idlePath;
        if (this.animation === 'run') path = this.runImages[Math.floor(this.animationTime / 0.08) % 8];
        if (this.animation === 'jump') path = this.jumpImages[this.getJumpFrame()];
        const image = this.imageCache[path];
        if (image.complete && image.naturalWidth > 0) this.img = image;
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
        ctx.save();
        if (this.facingLeft) {
            ctx.translate(this.x + this.width, 0);
            ctx.scale(-1, 1);
            super.draw(ctx, 0);
        } else {
            super.draw(ctx);
        }
        ctx.restore();
    }
}
