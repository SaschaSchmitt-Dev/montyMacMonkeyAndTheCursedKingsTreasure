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
    projectiles = [];
    throwController;
    enemiesStarted = false;
    bossChamber;
    boss = null;
    healthBar;
    ammoBar;
    scoreBar;

    /**
     * @param {HTMLCanvasElement} canvas - Canvas used for the scene.
     * @param {Keyboard} keyboard - Current player input.
     * @param {Level} level - Level dimensions and starting position.
     */
    constructor(canvas, keyboard, level) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.keyboard = keyboard;
        this.level = level;
        this.createBackgrounds();
        BananaProjectile.preloadImages();
        this.ground = new Ground(() => this.draw());
        this.ground.y += this.level.groundY - 330;
        this.createCharacter();
        this.throwController = new ThrowController(this.character);
        this.bossChamber = new BossChamber(this.level, () => this.draw());
        this.healthBar = new HealthBar(() => this.draw());
        this.ammoBar = new AmmoBar(this.character.maxAmmo, () => this.draw());
        const totalScore = level.scoreItems.reduce((sum, item) => sum + item.points, 0);
        this.scoreBar = new ScoreBar(totalScore, () => this.draw());
        this.animationFrame = requestAnimationFrame((time) => this.gameLoop(time));
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
        const width = this.canvas.width;
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
        if (!this.active) return;
        this.deltaTime = this.getDeltaTime(time);
        if (!this.bossChamber.update(this)) this.updateScene();
        this.draw();
        this.animationFrame = requestAnimationFrame((nextTime) => this.gameLoop(nextTime));
    }


    /** Updates the running level while no scene transition is active. */
    updateScene() {
        this.updateEnemies();
        if (this.boss) this.boss.update(this.deltaTime, this.character.health > 0);
        const previousFeet = this.character.y + this.character.height * 244 / 256;
        this.character.update(this.deltaTime, this.keyboard, this.level.width, this.level.platforms);
        this.updateThrowing();
        this.collectAmmo();
        this.updateScoreItems();
        this.checkEnemyContact(previousFeet);
        this.updateCamera();
    }


    /** Places the player in a fresh room while preserving the collected resources. */
    enterBossChamber() {
        if (this.throwController.active) this.throwController.cancel(this.character);
        const previous = this.character;
        this.level = new Level(this.canvas.width, 120, previous.floorGroundY);
        this.ground = this.bossChamber.roomGround;
        this.ground.alignBossGround(this.canvas.width, previous.floorGroundY + 122);
        this.keyboard.reset();
        this.projectiles = [];
        this.cameraX = 0;
        this.createCharacter();
        Object.assign(this.character, { health: previous.health, ammo: previous.ammo, score: previous.score });
        this.boss = this.bossChamber.boss;
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
        this.level.enemies.forEach((enemy) => enemy.update(this.deltaTime, this.level.width, this.enemiesStarted));
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
        const counter = document.getElementById('health-counter');
        const text = this.character.health > 0 ? `Leben: ${this.character.health}` : 'Game Over';
        if (counter.textContent !== text) counter.textContent = text;
        counter.hidden = this.character.health > 0;
        document.getElementById('restart-button').hidden = this.character.health > 0;
    }


    /** Removes touched bunches and updates the visible ammunition count. */
    collectAmmo() {
        if (this.character.health === 0) return;
        this.level.ammoPickups = this.level.ammoPickups.filter((pickup) => {
            if (!pickup.touches(this.character) || this.character.ammo >= this.character.maxAmmo) return true;
            const amount = Math.min(pickup.amount, this.character.maxAmmo - this.character.ammo);
            this.character.ammo += amount;
            pickup.amount -= amount;
            return pickup.amount > 0;
        });
        const counter = document.getElementById('ammo-counter');
        const text = `Bananen: ${this.character.ammo}`;
        if (counter.textContent !== text) counter.textContent = text;
    }


    /** Animates treasures and collects each touched item once while alive. */
    updateScoreItems() {
        this.level.scoreItems.forEach((item) => item.update(this.deltaTime));
        if (this.character.health === 0) return;
        this.level.scoreItems = this.level.scoreItems.filter((item) => {
            if (!item.touches(this.character)) return true;
            this.character.score += item.points;
            return false;
        });
        const counter = document.getElementById('score-counter');
        const text = `Punkte: ${this.character.score}`;
        if (counter.textContent !== text) counter.textContent = text;
    }


    /** Follows the player after the first third of the screen, within the level. */
    updateCamera() {
        const maxCameraX = Math.max(0, this.level.width - this.canvas.width);
        const wantedX = this.character.x - this.canvas.width / 3;
        this.cameraX = Math.max(0, Math.min(wantedX, maxCameraX));
    }


    /** Draws enemies and player relative to the camera without moving the HUD. */
    drawFigures() {
        this.ctx.save();
        this.ctx.translate(-Math.round(this.cameraX), 0);
        this.level.platforms.forEach((platform) => platform.draw(this.ctx));
        this.level.ammoPickups.forEach((pickup) => pickup.draw(this.ctx));
        this.level.scoreItems.forEach((item) => item.draw(this.ctx));
        this.level.enemies.forEach((enemy) => enemy.draw(this.ctx));
        if (this.boss) this.boss.draw(this.ctx);
        this.projectiles.forEach((projectile) => projectile.draw(this.ctx));
        this.character.draw(this.ctx);
        this.ctx.restore();
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


    /** Joins the regular floor to the separate exit floor at a shared height. */
    drawSceneGround() {
        if (this.bossChamber.inside) return this.ground.draw(this.ctx, this.cameraX);
        const cameraX = Math.round(this.cameraX);
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.rect(0, 0, Math.max(0, this.level.transitionX - cameraX), this.canvas.height);
        this.ctx.clip();
        this.ground.draw(this.ctx, cameraX);
        this.ctx.restore();
        this.bossChamber.drawGround(this.ctx, cameraX);
    }


    /** Redraws loaded objects in a fixed order, independent of loading order. */
    draw() {
        if (!this.active) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawSceneBackground();
        if (!this.bossChamber.inside) this.bossChamber.drawEntrance(this.ctx, Math.round(this.cameraX));
        this.drawSceneGround();
        this.drawFigures();
        this.drawSceneForeground();
        this.healthBar.draw(this.ctx, this.character.health, this.character.maxHealth);
        this.ammoBar.draw(this.ctx, this.character.ammo);
        this.scoreBar.draw(this.ctx, this.character.score);
        this.bossChamber.drawFade(this.ctx);
    }
}
