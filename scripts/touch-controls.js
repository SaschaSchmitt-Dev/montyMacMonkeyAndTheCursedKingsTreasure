/** Holds independent pointer inputs so walking, jumping and throwing can overlap. */
class TouchControls {
    element = document.getElementById('touch-controls');
    pointers = new Map();
    touchMode = false;
    enabled = false;

    constructor() {
        document.addEventListener('pointerdown', (event) => this.selectInput(event.pointerType), { capture: true });
        document.addEventListener('pointermove', (event) => {
            if (event.pointerType === 'mouse') this.selectInput('mouse');
        }, { capture: true });
        document.addEventListener('keydown', () => this.selectInput('keyboard'), { capture: true });
        for (const button of this.element.querySelectorAll('[data-touch]')) {
            button.addEventListener('pointerdown', (event) => this.press(event, button));
            for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) {
                button.addEventListener(name, (event) => this.release(event.pointerId));
            }
            button.addEventListener('pointermove', (event) => this.checkPosition(event, button));
            button.addEventListener('contextmenu', (event) => event.preventDefault());
            button.addEventListener('click', (event) => { event.preventDefault(); event.stopPropagation(); });
        }
        keyboard.resetListeners.add(() => this.releaseAll());
    }

    /** @param {PointerEvent} event - One finger or primary mouse pointer.
     * @param {HTMLButtonElement} button - Held control.
     */
    press(event, button) {
        if (this.element.hidden || !world?.active || world.paused || world.result || event.button !== 0) return;
        event.preventDefault();
        canvas.focus({ preventScroll: true });
        this.release(event.pointerId);
        this.pointers.set(event.pointerId, button);
        button.setPointerCapture(event.pointerId);
        keyboard.setKey(button.dataset.touch, true, 'touch-' + event.pointerId);
        button.classList.add('touch-held');
    }

    /** @param {number} pointerId - Pointer ending or leaving its button. */
    release(pointerId) {
        const button = this.pointers.get(pointerId);
        if (!button) return;
        this.pointers.delete(pointerId);
        keyboard.setKey(button.dataset.touch, false, 'touch-' + pointerId);
        if (![...this.pointers.values()].includes(button)) button.classList.remove('touch-held');
        if (button.hasPointerCapture(pointerId)) button.releasePointerCapture(pointerId);
    }

    /** @param {PointerEvent} event - Captured pointer movement.
     * @param {HTMLButtonElement} button - Original held control.
     */
    checkPosition(event, button) {
        const box = button.getBoundingClientRect();
        if (event.clientX < box.left || event.clientX > box.right
            || event.clientY < box.top || event.clientY > box.bottom) this.release(event.pointerId);
    }

    /** Releases fingers after focus loss, cancellation or a screen change. */
    releaseAll() {
        for (const id of [...this.pointers.keys()]) this.release(id);
    }

    /** @param {string} type - Use the actual input instead of detected touch hardware. */
    selectInput(type) {
        const touch = type === 'touch';
        if (this.touchMode === touch) return;
        this.touchMode = touch;
        if (!touch) this.releaseAll();
        this.element.hidden = !this.enabled || !this.touchMode;
        window.gameDisplay?.updateLayout();
    }

    /** Shows controls only when gameplay and the most recent input are both touch. */
    show() {
        this.enabled = true;
        this.element.hidden = !this.touchMode;
    }

    /** Hides controls and clears all touch input without affecting held keyboard keys. */
    hide() {
        this.enabled = false;
        this.releaseAll();
        this.element.hidden = true;
    }
}
const touchControls = new TouchControls();
