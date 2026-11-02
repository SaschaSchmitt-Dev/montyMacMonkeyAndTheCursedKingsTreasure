/** A rotating banana with gravity and a short impact animation. */
class BananaProjectile extends MovableObject {
    static images = {};
    width = 64;
    height = 64;
    speed = 600;
    gravity = 1200;
    velocityY = -180;
    animationTime = 0;
    impacted = false;
    finished = false;
    frames;
    impactFrames;

    /** @param {Character} character - Throwing player.
     * @param {boolean} facingLeft - Direction captured at the start of the throw.
     * @param {number} floorY - Ground surface in world pixels.
     */
    constructor(character, facingLeft, floorY) {
        super();
        this.facingLeft = facingLeft;
        this.x = character.x + (facingLeft ? -4 : character.width - 60);
        this.y = character.y + 20;
        this.groundY = floorY - this.height;
        BananaProjectile.preloadImages();
        this.imageCache = BananaProjectile.images;
        this.frames = BananaProjectile.createPaths('flight/banana', 60);
        this.impactFrames = BananaProjectile.createPaths('impact/banana-impact', 5);

        this.img = this.imageCache[this.frames[0]];
    }

    /** Loads the shared flight and impact images once. */
    static preloadImages() {
        if (Object.keys(this.images).length > 0) return;
        const loader = new DrawableObject();
        loader.loadImages([...this.createPaths('flight/banana', 60),
            ...this.createPaths('impact/banana-impact', 5)]);
        this.images = loader.imageCache;
    }

    /** @param {string} prefix - Folder and filename prefix.
     * @param {number} count - Number of images.
     * @returns {string[]} Ordered image paths.
     */
    static createPaths(prefix, count) {
        return Array.from({ length: count }, (_, index) =>
            'assets/images/projectiles/banana/' + prefix + '-' + String(index).padStart(2, '0') + '.png'
        );
    }

    /** @param {number} deltaTime - Frame duration in seconds. */
    update(deltaTime) {
        this.animationTime += deltaTime;
        if (!this.impacted) this.updateFlight(deltaTime);
        const paths = this.impacted ? this.impactFrames : this.frames;
        const duration = this.impacted ? 0.05 : 1 / 60;
        const frame = Math.floor(this.animationTime / duration) % paths.length;
        const image = this.imageCache[paths[frame]];
        if (image.complete && image.naturalWidth > 0) this.img = image;
        if (this.impacted && this.animationTime >= 0.25) this.finished = true;
    }

    /** @param {number} deltaTime - Frame duration in seconds. */
    updateFlight(deltaTime) {
        this.x += (this.facingLeft ? -1 : 1) * this.speed * deltaTime;
        this.applyGravity(deltaTime);
        if (this.isGrounded()) this.impact();
    }

    /** Stops the banana and starts its impact animation once. */
    impact() {
        if (this.impacted) return;
        this.impacted = true;
        gameAudio.effect('impact', this.x);
        this.animationTime = 0;
        this.velocityY = 0;
        const image = this.imageCache[this.impactFrames[0]];
        if (image.complete && image.naturalWidth > 0) this.img = image;
    }

    /** @param {CanvasRenderingContext2D} ctx - Canvas drawing context. */
    draw(ctx) {
        if (!this.img.complete || this.img.naturalWidth === 0) return;
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y);
        ctx.scale(this.facingLeft ? -1 : 1, 1);
        ImageQuality.draw(ctx, this.img, -this.width / 2, 0, this.width, this.height);
        ctx.restore();
    }
}

