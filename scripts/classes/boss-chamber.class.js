/** A fixed cave entrance and a fading transition into the throne room. */
class BossChamber {
    inside = false;
    phase = 'idle';
    fadeTime = 0;
    fadeDuration = 0.45;
    layerOffsetY = { back: 12, ground: 0, front: 12 };
    entrance;
    background;
    roomGround;
    boss;
    layers;
    seam;
    grass;

    /** @param {Level} level - Jungle level dimensions.
     * @param {Function} onLoad - Requests a redraw after loading.
     */
    constructor(level, onLoad) {
        this.entrance = new DrawableObject();
        this.entrance.width = level.width - level.transitionX;
        this.entrance.height = this.entrance.width * 1024 / 1536;
        this.entrance.x = level.transitionX;
        this.entrance.y = level.groundY + 112 - this.entrance.height * 820 / 1024;
        this.loadLayers(onLoad);
        this.createGrass(onLoad);
        this.createSeam(level.groundY + 112, onLoad);
        this.loadRoom(level, onLoad);
    }


    /** @param {Level} level - Level with the shared floor height.
     * @param {Function} onLoad - Requests a redraw after loading.
     */
    loadRoom(level, onLoad) {
        this.background = new DrawableObject();
        this.background.loadImage('assets/images/backgrounds/boss-chamber/background.png', onLoad);
        this.roomGround = new Ground(onLoad, 'assets/images/objects/platforms/boss-chamber-ground.png');
        this.boss = new Boss(this.background.width, level.groundY + 122, onLoad);
    }


    /** @returns {boolean} Whether the chamber's required images loaded successfully. */
    isRoomReady() {
        const images = [this.background.img, this.roomGround.img, ...Object.values(this.boss.imageCache)];
        return images.every((image) => image.complete && image.naturalWidth > 0);
    }


    /** @param {Function} onLoad - Requests a redraw after loading. */
    createGrass(onLoad) {
        this.grass = new DrawableObject();
        this.grass.width = 200;
        this.grass.height = 50;
        this.grass.x = this.entrance.x + this.entrance.width * 0.42;
        this.grass.y = this.entrance.y + this.entrance.height * 820 / 1024 - 44;
        this.grass.loadImage('assets/images/objects/entrances/jungle-cave-grass-overlay.png', onLoad);
    }


    /** @param {Function} onLoad - Requests a redraw after loading. */
    loadLayers(onLoad) {
        this.layers = { back: this.entrance, ground: new DrawableObject(), front: new DrawableObject() };
        for (const [name, layer] of Object.entries(this.layers)) {
            layer.loadImage('assets/images/objects/entrances/cave-transition-' + name + '.png', onLoad);
        }
    }


    /** @param {number} floorY - Shared walkable surface.
     * @param {Function} onLoad - Requests a redraw after loading.
     */
    createSeam(floorY, onLoad) {
        this.seam = new DrawableObject();
        this.seam.width = 64;
        this.seam.height = 128;
        this.seam.x = this.entrance.x - this.seam.width / 2;
        this.seam.y = floorY - 22;
        this.seam.loadImage('assets/images/objects/entrances/jungle-seam-overlay.png', onLoad);
    }


    /** @param {World} world - Game scene.
     * @returns {boolean} Whether the transition temporarily freezes gameplay.
     */
    update(world) {
        if (this.phase === 'idle') {
            const player = world.character;
            const reached = player.x + player.width >= this.entrance.x + this.entrance.width - 2;
            if (!this.inside && player.health > 0 && player.isGrounded() && reached) this.phase = 'out';
            return this.phase !== 'idle';
        }
        this.fadeTime += world.deltaTime;
        if (this.fadeTime >= this.fadeDuration) this.finishFade(world);
        return true;
    }


    /** @param {World} world - Scene whose level changes at full darkness. */
    finishFade(world) {
        if (this.phase === 'out' && !this.isRoomReady()) return;
        this.fadeTime = 0;
        if (this.phase === 'out') {
            this.inside = true;
            world.enterBossChamber();
            this.phase = 'in';
        } else {
            this.phase = 'idle';
        }
    }


    /** @param {CanvasRenderingContext2D} ctx - Canvas context.
     * @param {number} cameraX - Jungle camera position.
     * @param {string} layer - Back, ground or front image layer.
     */
    drawEntrance(ctx, cameraX, layer = 'back') {
        const door = this.entrance;
        const image = this.layers[layer].img;
        if (!image.complete || image.naturalWidth === 0) return;
        const y = door.y + this.layerOffsetY[layer];
        ImageQuality.draw(ctx, image, door.x - cameraX, y, door.width, door.height);
        if (layer === 'ground') this.extendGround(ctx, image, door.x - cameraX, y);
    }


    /** Extends only the lowest rock strip, preserving the entrance and walkable surface.
     * @param {CanvasRenderingContext2D} ctx - Scene context. @param {HTMLImageElement} image - Ground layer.
     * @param {number} x - Screen position. @param {number} y - Unchanged layer top.
     */
    extendGround(ctx, image, x, y) {
        const door = this.entrance;
        if (y + door.height >= CanvasResolution.height) return;
        const targetY = y + door.height * 0.9;
        ImageQuality.draw(ctx, image, 0, image.naturalHeight * 0.9, image.naturalWidth, image.naturalHeight * 0.1,
            x, targetY, door.width, CanvasResolution.height - targetY);
    }


    /** @param {CanvasRenderingContext2D} ctx - Canvas context.
     * @param {number} cameraX - World camera position.
     */
    drawGround(ctx, cameraX) {
        this.drawEntrance(ctx, cameraX, 'ground');
        this.grass.draw(ctx, this.grass.x - cameraX);
    }


    /** @param {CanvasRenderingContext2D} ctx - Canvas context. */
    drawFade(ctx) {
        if (this.phase === 'idle') return;
        const progress = Math.min(1, this.fadeTime / this.fadeDuration);
        ctx.save();
        ctx.globalAlpha = this.phase === 'out' ? progress : 1 - progress;
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, CanvasResolution.width, CanvasResolution.height);
        ctx.restore();
    }
}
