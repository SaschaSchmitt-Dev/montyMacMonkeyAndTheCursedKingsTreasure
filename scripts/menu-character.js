/** A separate, non-combat character walking between the menu islands. */
class MenuWalker {
    character;
    keyboard;
    frame = null;
    lastTime = null;
    nearby = null;
    surfaces = [];
    screen = document.getElementById('start-screen');
    canvas = document.getElementById('menu-character');

    /** Creates independent menu input and a smaller menu character. */
    constructor() {
        this.keyboard = new Keyboard(this.screen);
        this.character = new Character(() => this.draw());
        this.character.width = this.character.height = 96;
        this.screen.addEventListener('keydown', (event) => this.activate(event));
    }

    /** Creates landing surfaces from the same positions used by the artwork. */
    measureSurfaces() {
        const view = this.screen.getBoundingClientRect();
        this.surfaces = [...this.screen.querySelectorAll('[data-surface]')].map((element) => {
            const box = element.getBoundingClientRect();
            return { x: (box.left - view.left) * 960 / view.width,
                width: box.width * 960 / view.width,
                surfaceY: (box.top - view.top + box.height * Number(element.dataset.surface)) * 540 / view.height,
                element, solid: false };
        });
        this.addBridgeSurfaces();
    }

    /** Adds short connected landing segments along each visible menu bridge. */
    addBridgeSurfaces() {
        for (const element of this.screen.querySelectorAll('[data-bridge]')) {
            const [x0, y0, x1, y1] = element.dataset.bridge.split(',').map(Number);
            const count = Math.ceil((x1 - x0) / 10);
            for (let index = 0; index < count; index++) {
                this.surfaces.push({ x: x0 + (x1 - x0) * index / count,
                    width: (x1 - x0) / count + 2, surfaceY: y0 + (y1 - y0) * (index + 0.5) / count,
                    element, bridge: true, solid: false });
            }
        }
    }


    /** Starts one fresh menu loop with Monty on his own ledge. */
    start() {
        this.stop();
        this.measureSurfaces();
        this.respawn();
        this.lastTime = null;
        this.frame = requestAnimationFrame((time) => this.update(time));
    }

    /** Stops updates and releases all menu keys. */
    stop() {
        if (this.frame !== null) cancelAnimationFrame(this.frame);
        this.frame = null;
        this.keyboard.reset();
        this.setNearby(null);
    }

    /** Places Monty safely on the starting ledge after falling. */
    respawn() {
        const ledge = this.surfaces[0];
        Object.assign(this.character, { x: ledge.x + ledge.width / 2 - 48,
            y: ledge.surfaceY - 91.5, groundY: ledge.surfaceY - 91.5,
            floorGroundY: 900, velocityY: 0, jumpHeld: false, takeoffTime: 0,
            landingTime: 0, inactiveTime: 0, health: 5 });
    }

    /** @param {number} time - Frame timestamp. */
    update(time) {
        const delta = this.lastTime === null ? 0 : Math.min((time - this.lastTime) / 1000, 0.05);
        this.lastTime = time;
        if (!document.getElementById('menu-dialog').open) this.move(delta);
        this.draw();
        if (!this.screen.hidden) this.frame = requestAnimationFrame((next) => this.update(next));
        else this.frame = null;
    }

    /** @param {number} delta - Frame duration. */
    move(delta) {
        const steps = Math.max(1, Math.ceil(delta * 120));
        for (let index = 0; index < steps; index++) this.advanceMovement(delta / steps);
    }

    /** @param {number} delta - Small step keeping steep bridge movement consistent. */
    advanceMovement(delta) {
        const walking = this.character.isGrounded() && !this.keyboard.jump && this.character.takeoffTime === 0;
        this.character.update(delta, this.keyboard, 960, this.surfaces);
        if (walking && this.character.velocityY >= 0) this.followBridge();
        if (this.character.y > 580) this.respawn();
        gameAudio.updateCharacter(this.character, delta);
        this.updateNearby();
    }

    /** Follows shallow bridge slopes while walking, without affecting jumps. */
    followBridge() {
        const center = this.character.x + 48;
        const feet = this.character.y + 91.5;
        const ledge = this.surfaces.find((surface) => center >= surface.x && center <= surface.x + surface.width
            && Math.abs(feet - surface.surfaceY) < 32);
        if (!ledge) return;
        this.character.y = this.character.groundY = ledge.surfaceY - 91.5;
        this.character.velocityY = 0;
    }


    /** Finds the function platform directly below Monty. */
    updateNearby() {
        const feet = this.character.y + 91.5;
        const center = this.character.x + 48;
        this.setNearby(this.surfaces.find((ledge) => ledge.element.tagName === 'BUTTON'
            && Math.abs(feet - ledge.surfaceY) < 2 && this.character.isGrounded()
            && center > ledge.x + 12 && center < ledge.x + ledge.width - 12)?.element || null);
    }

    /** @param {KeyboardEvent} event - Space activates the current island once per press. */
    activate(event) {
        if (event.code !== 'Space' || event.repeat) return;
        this.updateNearby();
        this.nearby?.click();
    }


    /** @param {HTMLElement|null} button - Platform under Monty's feet. */
    setNearby(button) {
        if (this.nearby === button) return;
        this.nearby?.classList.remove('menu-near');
        this.nearby = button;
        button?.classList.add('menu-near');
    }

    /** Draws only Monty; all menu artwork remains ordinary HTML images. */
    draw() {
        if (this.screen.hidden) return;
        const context = this.canvas.getContext('2d');
        context.clearRect(0, 0, 960, 540);
        this.character.draw(context);
    }
}

const menuWalker = new MenuWalker();
window.addEventListener('resize', () => {
    if (!menuWalker.screen.hidden) menuWalker.measureSurfaces();
});
