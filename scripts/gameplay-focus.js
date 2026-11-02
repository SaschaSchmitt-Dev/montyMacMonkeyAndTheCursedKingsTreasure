/** Keeps keyboard input on the active game without taking focus from interface controls. */
class GameplayFocus {
    /** Restores gameplay focus after background clicks or returning to the browser. */
    constructor() {
        document.addEventListener('pointerdown', (event) => this.focusFromPointer(event));
        document.addEventListener('focusin', () => this.restore());
        canvas.addEventListener('blur', () => requestAnimationFrame(() => this.restore()));
        window.addEventListener('focus', () => this.restore());
        document.addEventListener('visibilitychange', () => this.restore());
    }

    /** @returns {boolean} Whether the visible, unpaused game can accept keyboard input. */
    isPlaying() {
        return Boolean(world?.active && world.ready && !world.paused && !world.result
            && !canvas.inert && !document.hidden && document.hasFocus());
    }

    /** @param {Element|null} element - Current target. @returns {boolean} Whether it needs its own focus. */
    isControl(element) {
        return Boolean(element?.closest('button, a, input, select, textarea, [contenteditable], dialog'));
    }

    /** @param {PointerEvent} event - Click or touch on a non-interactive part of the page. */
    focusFromPointer(event) {
        if (!this.isPlaying() || this.isControl(event.target) || event.button !== 0) return;
        event.preventDefault();
        canvas.focus({ preventScroll: true });
    }

    /** Returns to the canvas when the page has focus and no interface control is selected. */
    restore() {
        if (!this.isPlaying() || document.activeElement === canvas || this.isControl(document.activeElement)) return;
        canvas.focus({ preventScroll: true });
    }
}
const gameplayFocus = new GameplayFocus();
