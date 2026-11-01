/** Tracks each finger within its original group, allowing sliding between paired actions. */
class TouchControls {
    element = document.getElementById('touch-controls');
    pointers = new Map();
    captures = new Map();
    touchMode = false;
    enabled = false;

    constructor() {
        document.addEventListener('pointerdown', (event) => this.selectInput(event.pointerType), { capture: true });
        document.addEventListener('pointermove', (event) => {
            if (event.pointerType === 'mouse') this.selectInput('mouse');
        }, { capture: true });
        document.addEventListener('keydown', () => this.selectInput('keyboard'), { capture: true });
        this.connectButtons();
        keyboard.resetListeners.add(() => this.releaseAll());
    }

    /** Capture stays on the original button while the current action can move to its neighbour. */
    connectButtons() {
        for (const button of this.element.querySelectorAll('[data-touch]')) {
            button.addEventListener('pointerdown', (event) => this.press(event, button));
            for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) {
                button.addEventListener(name, (event) => this.release(event.pointerId));
            }
            button.addEventListener('pointermove', (event) => this.checkPosition(event));
            button.addEventListener('contextmenu', (event) => event.preventDefault());
            button.addEventListener('click', (event) => { event.preventDefault(); event.stopPropagation(); });
        }
    }

    /** @param {PointerEvent} event - Pressing finger. @param {HTMLButtonElement} button - Initial action. */
    press(event, button) {
        if (this.element.hidden || !world?.active || world.paused || world.result || event.button !== 0) return;
        event.preventDefault();
        canvas.focus({ preventScroll: true });
        this.release(event.pointerId);
        this.captures.set(event.pointerId, { button, group: button.closest('.touch-group') });
        button.setPointerCapture(event.pointerId);
        this.setAction(event.pointerId, button);
    }

    /** @param {number} pointerId - Independent input source. @param {HTMLButtonElement|null} button - Hit or gap. */
    setAction(pointerId, button) {
        const previous = this.pointers.get(pointerId);
        if (previous === button) return;
        this.pointers.set(pointerId, button);
        if (previous) keyboard.setKey(previous.dataset.touch, false, 'touch-' + pointerId);
        if (previous && ![...this.pointers.values()].includes(previous)) previous.classList.remove('touch-held');
        if (button) {
            keyboard.setKey(button.dataset.touch, true, 'touch-' + pointerId);
            button.classList.add('touch-held');
        }
    }

    /** @param {number} pointerId - Finger ending, cancelled, or losing capture. */
    release(pointerId) {
        const capture = this.captures.get(pointerId);
        if (!capture) return;
        this.setAction(pointerId, null);
        this.pointers.delete(pointerId);
        this.captures.delete(pointerId);
        if (capture.button.hasPointerCapture(pointerId)) capture.button.releasePointerCapture(pointerId);
    }

    /** @param {PointerEvent} event - Captured movement, including gaps and positions outside the group. */
    checkPosition(event) {
        const capture = this.captures.get(event.pointerId);
        if (!capture) return;
        event.preventDefault();
        const button = [...capture.group.querySelectorAll('[data-touch]')].find((candidate) => {
            const box = candidate.getBoundingClientRect();
            return event.clientX >= box.left && event.clientX <= box.right
                && event.clientY >= box.top && event.clientY <= box.bottom;
        });
        this.setAction(event.pointerId, button || null);
    }

    /** Releases active and temporarily neutral fingers after a screen/input change. */
    releaseAll() {
        for (const id of [...this.captures.keys()]) this.release(id);
    }

    /** @param {string} type - Actual input rather than detected touch hardware. */
    selectInput(type) {
        const touch = type === 'touch';
        if (this.touchMode === touch) return;
        this.touchMode = touch;
        if (!touch) this.releaseAll();
        this.element.hidden = !this.enabled || !this.touchMode;
        window.gameDisplay?.updateLayout();
    }

    /** Shows controls only during touch gameplay. */
    show() {
        this.enabled = true;
        this.element.hidden = !this.touchMode;
    }

    /** Hides controls without clearing independent physical keyboard sources. */
    hide() {
        this.enabled = false;
        this.releaseAll();
        this.element.hidden = true;
    }
}
const touchControls = new TouchControls();
