/** Stores the current keyboard input for the game. */
class Keyboard {
    left = false;
    right = false;
    jump = false;
    throw = false;
    lastDirection = null;
    sources = new Map();
    resetListeners = new Set();
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
     * @param {string} source - Independent keyboard or touch pointer identifier.
     */
    setKey(code, pressed, source = 'keyboard') {
        if (!Object.hasOwn(this.bindings, code)) return;
        if (!this.sources.has(source)) this.sources.set(source, new Set());
        const keys = this.sources.get(source);
        if (pressed) keys.add(code);
        else keys.delete(code);
        if (keys.size === 0) this.sources.delete(source);
        const action = this.bindings[code];
        const held = [...this.sources.values()].some((input) => input.has(code));
        if (held && !this[action] && (action === 'left' || action === 'right')) this.lastDirection = action;
        this[action] = held;
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
        this.sources.clear();
        this.left = false;
        this.right = false;
        this.jump = false;
        this.throw = false;
        this.lastDirection = null;
        this.resetListeners.forEach((listener) => listener());
    }
}
