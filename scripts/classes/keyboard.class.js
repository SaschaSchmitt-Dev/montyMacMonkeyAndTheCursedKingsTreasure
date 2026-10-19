/** Stores the current keyboard input for the game. */
class Keyboard {
    left = false;
    right = false;
    jump = false;
    throw = false;
    lastDirection = null;
    bindings = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'jump', Space: 'throw' };

    /** @param {HTMLCanvasElement} canvas - Focusable game canvas. */
    constructor(canvas) {
        canvas.addEventListener('keydown', (event) => this.pressKey(event));
        window.addEventListener('keyup', (event) => this.setKey(event.code, false));
        canvas.addEventListener('pointerdown', () => canvas.focus({ preventScroll: true }));
        canvas.addEventListener('blur', () => this.reset());
        window.addEventListener('blur', () => this.reset());
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) this.reset();
        });
    }


    /** @param {KeyboardEvent} event - Key pressed on the game canvas. */
    pressKey(event) {
        if (Object.hasOwn(this.bindings, event.code)) {
            event.preventDefault();
            this.setKey(event.code, true);
        }
    }


    /**
     * Updates the action associated with a known key.
     * @param {string} code - Physical keyboard key code.
     * @param {boolean} pressed - Whether the key is held down.
     */
    setKey(code, pressed) {
        if (Object.hasOwn(this.bindings, code)) {
            const action = this.bindings[code];
            if (pressed && !this[action] && (action === 'left' || action === 'right')) {
                this.lastDirection = action;
            }
            this[action] = pressed;
        }
    }


    /** @returns {number} -1 for left, 1 for right, or 0 for no held direction. */
    getDirection() {
        if (this.left && this.right) {
            return this.lastDirection === 'left' ? -1 : 1;
        }
        if (this.left) return -1;
        if (this.right) return 1;
        return 0;
    }


    /** Releases all actions after focus loss or a tab change. */
    reset() {
        this.left = false;
        this.right = false;
        this.jump = false;
        this.throw = false;
        this.lastDirection = null;
    }
}
