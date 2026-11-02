/** Holds and draws the objects in the game scene. */
class World {
    canvas;
    ctx;
    keyboard;
    level;
    backgrounds = [];
    cameraX = 0;
    ground;
    character;
    lastTime = null;
    deltaTime = 0;
    animationFrame;
    active = true;
    ready = false;
    paused = false;
    projectiles = [];
    throwController;
    enemiesStarted = false;
    bossChamber;
    boss = null;
    healthBar;
    ammoBar;
    scoreBar;
    bossHealthBar;
    result = null;
    endTime = 0;
    endScore = null;
    scoreSaved = false;

    /**
     * @param {HTMLCanvasElement} canvas - Canvas used for the scene.
     * @param {Keyboard} keyboard - Current player input.
     * @param {Level} level - Level dimensions and starting position.
     * @param {boolean} autoStart - Whether to start immediately instead of waiting for images.
     */
    constructor(canvas, keyboard, level, autoStart = true) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.keyboard = keyboard;
        this.level = level;
        this.createSceneAssets();
        this.createHud(level);
        if (autoStart) this.start();
    }

    /** Starts the prepared world after loading, with a fresh frame timestamp. */
    start() {
        if (!this.active || this.paused) return;
        this.ready = true;
        this.lastTime = null;
        this.animationFrame = requestAnimationFrame((time) => this.gameLoop(time));
    }

    /** @returns {DrawableObject[]} Objects whose graphics are needed for this run. */
    getLoadingObjects() {
        const room = this.bossChamber;
        return [...this.backgrounds.flat(), this.ground, this.character,
            ...this.level.enemies, ...this.level.platforms, ...this.level.blocks,
            ...this.level.ammoPickups, ...this.level.scoreItems,
            this.healthBar, this.ammoBar, this.scoreBar, this.bossHealthBar,
            ...Object.values(room.layers), room.grass, room.seam,
            room.background, room.roomGround, room.boss];
    }

    /** @returns {Promise} Resolves when all game images are loaded and decoded. */
    waitForImages() {
        const images = this.getLoadingObjects().flatMap((object) =>
            [object.img, ...Object.values(object.imageCache)]).filter(Boolean);
        images.push(...Object.values(BananaProjectile.images));
        return Promise.all([...new Set(images)].map((image) => image.decode()));
    }

    /** Places the player using the current level's starting coordinates. */
    createCharacter() {
        this.character = new Character(() => this.draw());
        this.character.x = this.level.characterStartX;
        this.character.y = this.level.groundY;
        this.character.groundY = this.level.groundY;
        this.character.floorGroundY = this.level.groundY;
    }

    /** Loads all three full-size sections for each of the three cave layers. */
    createBackgrounds() {
        for (let layer = 1; layer <= 3; layer++) {
            const sections = ['A', 'B', 'C'].map((section) =>
                new Background(layer, section, () => this.draw())
            );
            this.backgrounds.push(sections);
        }
    }

    /** @param {number} layer - Zero-based layer index. */
    drawBackgroundLayer(layer) {
        const width = CanvasResolution.width;
        const viewX = this.cameraX * this.level.parallaxFactors[layer];
        const currentSection = Math.floor(viewX / width);
        for (let section = currentSection - 1; section <= currentSection + 1; section++) {
            const index = ((section % 3) + 3) % 3;
            const x = Math.round(section * width - viewX);
            this.backgrounds[layer][index].draw(this.ctx, x);
        }
    }

    /** @param {number} time - Browser timestamp in milliseconds. */
    gameLoop(time) {
        if (!this.active || this.paused) return;
        this.deltaTime = this.getDeltaTime(time);
        if (this.result) this.updateEnding();
        else if (!this.bossChamber.update(this)) this.updateScene();
        this.checkGameEnd();
        if (!this.result) gameAudio.updateCharacter(this.character, this.deltaTime);
        this.draw();
        if (this.active) this.animationFrame = requestAnimationFrame((nextTime) => this.gameLoop(nextTime));
    }

    /** Locks gameplay when either combatant has been defeated. */
    checkGameEnd() {
        if (this.result) return;
        if (this.character.health === 0) this.result = 'defeat';
        else if (this.boss && this.boss.defeated) this.result = 'victory';
        if (!this.result) return;
        if (this.throwController.active) this.throwController.cancel(this.character);
        gameAudio.setScene('ending');
        gameAudio.effect(this.result === 'victory' ? 'bossDefeat' : 'death');
        if (this.result === 'victory') this.calculateVictoryScore();
        this.keyboard.reset();
    }

    /** Captures collected points and remaining resources once for the victory result. */
    calculateVictoryScore() {
        if (this.endScore) return;
        const collected = this.character.score;
        const lives = this.character.health;
        const ammo = this.character.ammo;
        const lifeBonus = lives * 50;
        const ammoBonus = ammo * 10;
        this.endScore = { collected, lives, ammo, lifeBonus, ammoBonus,
            total: collected + lifeBonus + ammoBonus };
    }

    /** Finishes the death animation before stopping the scene and showing its result. */
    updateEnding() {
        this.endTime += this.deltaTime;
        if (this.result === 'defeat') {
            this.character.updateDeath(this.deltaTime, [...this.level.platforms, ...this.level.blocks]);
        } else this.boss.update(this.deltaTime, false);
        if (this.endTime < 0.8 || (this.result === 'defeat' && !this.character.isGrounded())) return;
        this.draw();
        this.stop();
        this.keyboard.reset();
        showEndScreen(this.result, this.endScore);
    }

    /** Updates the running level while no scene transition is active. */
    updateScene() {
        this.updateEnemies();
        if (this.boss) this.boss.update(this.deltaTime, this.character.health > 0);
        const previousFeet = this.character.y + this.character.height * 244 / 256;
        this.character.update(this.deltaTime, this.keyboard, this.level.width, [...this.level.platforms, ...this.level.blocks]);
        this.updateThrowing();
        this.collectAmmo();
        this.updateScoreItems();
        this.checkEnemyContact(previousFeet);
        this.updateCamera();
    }

    /** Places the player in a fresh room while preserving the collected resources. */
    enterBossChamber() {
        if (this.throwController.active) this.throwController.cancel(this.character);
        this.prepareBossRoom(this.character);
        this.boss = this.bossChamber.boss;
        gameAudio.setScene('boss');
        gameAudio.effect('cave');
        gameAudio.effect('awaken');
        this.throwController = new ThrowController(this.character);
    }

    /** Advances the throw, flying bananas and expired impact effects. */
    updateThrowing() {
        this.throwController.update(this);
        this.projectiles.forEach((projectile) => projectile.update(this.deltaTime));
        ProjectileCollisions.check(this.projectiles, this.level.enemies);
        ProjectileCollisions.checkBoss(this.projectiles, this.boss);
        this.projectiles = this.projectiles.filter((projectile) => !projectile.finished
            && projectile.x + projectile.width >= 0 && projectile.x <= this.level.width);
    }

    /** Moves enemies and carries a player resting on an armored back. */
    updateEnemies() {
        if (this.character.moving && this.character.health > 0) this.enemiesStarted = true;
        const carrier = this.character.ridingEnemy;
        const previousX = carrier ? carrier.x : 0;
        this.level.enemies.forEach((enemy) => enemy.update(this.deltaTime, this.level.width, this.enemiesStarted, this.level.blocks));
        if (carrier && !carrier.defeated && this.character.isGrounded()) {
            this.character.x += carrier.x - previousX;
            this.character.x = Math.max(0, Math.min(this.character.x, this.level.width - this.character.width));
        }
    }

    /** @param {number} previousFeet - Foot height before this frame's movement. */
    checkEnemyContact(previousFeet) {
        EnemyCollisions.check(this.character, this.level.enemies, previousFeet);
        if (this.boss) {
            this.boss.projectiles = ProjectileCollisions.checkCharacter(this.boss.projectiles, this.character);
        }
        this.level.enemies = this.level.enemies.filter((enemy) => !enemy.defeated || enemy.deathTime < 0.6);
    }

    /** Collects the complete ammunition pickup without a carrying limit. */
    collectAmmo() {
        if (this.character.health === 0) return;
        this.level.ammoPickups = this.level.ammoPickups.filter((pickup) => {
            if (!pickup.touches(this.character)) return true;
            this.character.ammo += pickup.amount;
            gameAudio.effect('banana');
            return false;
        });
    }

    /** Animates treasures and collects each touched item once while alive. */
    updateScoreItems() {
        this.level.scoreItems.forEach((item) => item.update(this.deltaTime));
        if (this.character.health === 0) return;
        this.level.scoreItems = this.level.scoreItems.filter((item) => {
            if (!item.touches(this.character)) return true;
            this.character.score += item.points;
            gameAudio.effect(item.points >= 100 ? 'relic' : 'treasure');
            return false;
        });
    }

    /** Follows the player after the first third of the screen, within the level. */
    updateCamera() {
        const maxCameraX = Math.max(0, this.level.width - CanvasResolution.width);
        const wantedX = this.character.x - CanvasResolution.width / 3;
        this.cameraX = Math.max(0, Math.min(wantedX, maxCameraX));
    }

    /** Draws enemies and player relative to the camera without moving the HUD. */
    drawFigures() {
        this.ctx.save();
        this.ctx.translate(-Math.round(this.cameraX), 0);
        this.drawVisible(this.level.blocks);
        this.drawVisible(this.level.platforms);
        this.drawVisible(this.level.ammoPickups);
        this.drawVisible(this.level.scoreItems);
        this.drawVisible(this.level.enemies);
        if (this.boss) this.boss.draw(this.ctx);
        this.drawVisible(this.projectiles);
        this.character.draw(this.ctx);
        this.ctx.restore();
    }

    /** @param {DrawableObject[]} objects - Draw only objects near the visible camera section. */
    drawVisible(objects) {
        const left = this.cameraX - 64;
        const right = this.cameraX + CanvasResolution.width + 64;
        for (const object of objects) {
            if (object.x + object.width >= left && object.x <= right) object.draw(this.ctx);
        }
    }

    /**
     * Limits the time step to avoid large jumps after a tab pause.
     * @param {number} time - Current browser timestamp in milliseconds.
     * @returns {number} Time since the last frame in seconds, at most 0.05.
     */
    getDeltaTime(time) {
        if (this.lastTime === null) this.lastTime = time;
        const deltaTime = Math.min((time - this.lastTime) / 1000, 0.05);
        this.lastTime = time;
        return deltaTime;
    }

    /** Stops drawing and cancels the pending animation frame. */
    stop() {
        this.active = false;
        cancelAnimationFrame(this.animationFrame);
    }

    /** Draws either the jungle layers or the fixed throne room. */
    drawSceneBackground() {
        if (this.bossChamber.inside) {
            this.bossChamber.background.draw(this.ctx);
        } else {
            this.drawBackgroundLayer(0);
            this.drawBackgroundLayer(1);
        }
    }

    /** Draws the jungle foreground and the entrance over the player. */
    drawSceneForeground() {
        if (this.bossChamber.inside) return;
        this.drawBackgroundLayer(2);
        this.bossChamber.drawEntrance(this.ctx, Math.round(this.cameraX), 'front');
    }

    /** Joins the regular floor to the separate exit floor at a shared height.
     * @returns {void} Updates state or drawing only.
     */
    drawSceneGround() {
        if (this.bossChamber.inside) return this.ground.draw(this.ctx, this.cameraX);
        const cameraX = Math.round(this.cameraX);
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.rect(0, 0, Math.max(0, this.level.transitionX - cameraX), CanvasResolution.height);
        this.ctx.clip();
        this.ground.draw(this.ctx, cameraX);
        this.ctx.restore();
        this.bossChamber.drawGround(this.ctx, cameraX);
    }

    /** Redraws loaded objects in order. @param {boolean} force - Refresh a frozen scene after resizing. */
    draw(force = false) {
        if ((!force && (!this.active || this.paused)) || !this.ready) return;
        this.ctx.clearRect(0, 0, CanvasResolution.width, CanvasResolution.height);
        this.drawSceneBackground();
        if (!this.bossChamber.inside) this.bossChamber.drawEntrance(this.ctx, Math.round(this.cameraX));
        this.drawSceneGround();
        this.drawFigures();
        this.drawSceneForeground();
        this.healthBar.draw(this.ctx, this.character.health, this.character.maxHealth);
        this.ammoBar.draw(this.ctx, this.character.ammo);
        this.scoreBar.draw(this.ctx, this.character.score);
        this.bossHealthBar.draw(this.ctx, this.boss);
        this.bossChamber.drawFade(this.ctx);
    }

    /** Creates the shared scene, character, projectiles and cave in their original loading order. */
    createSceneAssets() {
        this.createBackgrounds();
        BananaProjectile.preloadImages();
        this.ground = new Ground(() => this.draw());
        this.ground.y += this.level.groundY - 330;
        this.createCharacter();
        this.throwController = new ThrowController(this.character);
        this.bossChamber = new BossChamber(this.level, () => this.draw());
    }

    /** @param {Level} level - Level whose collectible total defines the score meter. */
    createHud(level) {
        this.healthBar = new HealthBar(() => this.draw());
        this.ammoBar = new AmmoBar(() => this.draw());
        const totalScore = level.scoreItems.reduce((sum, item) => sum + item.points, 0);
        this.scoreBar = new ScoreBar(totalScore, () => this.draw());
        this.bossHealthBar = new BossHealthBar(() => this.draw());
    }

    /** @param {Character} previous - Character whose floor, life, score and ammunition are preserved. */
    prepareBossRoom(previous) {
        this.level = new Level(CanvasResolution.width, 120, previous.floorGroundY);
        this.ground = this.bossChamber.roomGround;
        this.ground.alignBossGround(CanvasResolution.width, previous.floorGroundY + 122);
        this.keyboard.reset();
        this.projectiles = [];
        this.cameraX = 0;
        this.createCharacter();
        Object.assign(this.character, { health: previous.health, ammo: previous.ammo, score: previous.score });
    }

}
