/** Handles one banana throw per key press and the timed release. */
class ThrowController {
    held = false;
    active = false;
    released = false;
    elapsed = 0;
    facingLeft = false;

    /** @param {Character} character - Player whose throw images are loaded. */
    constructor(character) {
        character.throwImages = character.createFramePaths('throw/throw', 6);
        character.loadImages(character.throwImages);
    }

    /** @param {World} world - Current player, input and projectiles. */
    update(world) {
        const character = world.character;
        const pressed = world.keyboard.throw;
        if (this.active) this.advance(world);
        if (pressed && !this.held && !this.active && character.ammo > 0
            && character.health > 0 && character.hitTime === 0) this.start(character);
        this.held = pressed;
        if (this.active) character.facingLeft = this.facingLeft;
        character.updateAnimation(0);
    }

    /** @param {Character} character - Player beginning a throw. */
    start(character) {
        character.ammo--;
        character.throwTime = 0.48;
        character.inactiveTime = 0;
        this.active = true;
        this.released = false;
        this.elapsed = 0;
        this.facingLeft = character.facingLeft;
    }

    /** @param {World} world - Scene containing the active throw.
     * @returns {void} Updates state or drawing only.
     */
    advance(world) {
        const character = world.character;
        if (character.health === 0 || character.hitTime > 0) return this.cancel(character);
        this.elapsed += world.deltaTime;
        character.throwTime = Math.max(0, 0.48 - this.elapsed);
        if (!this.released && this.elapsed >= 0.16) {
            world.projectiles.push(new BananaProjectile(character, this.facingLeft, world.level.groundY + 122));
            this.released = true;
            gameAudio.effect('throw');
        }
        if (character.throwTime === 0) this.active = false;
    }

    /** @param {Character} character - Player interrupted before or after release. */
    cancel(character) {
        if (!this.released) character.ammo++;
        character.throwTime = 0;
        this.active = false;
    }
}
