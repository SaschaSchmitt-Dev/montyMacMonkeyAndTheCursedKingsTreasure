/** Hides the cursor only during gameplay until a real mouse movement. */
class GameplayCursor {
    frame = document.querySelector('.game-frame');

    /** Ignores stationary pointer events caused by browser layout or cursor changes. */
    constructor() {
        document.addEventListener('pointermove', (event) => {
            if (event.pointerType === 'mouse' && (event.movementX !== 0 || event.movementY !== 0)) this.show();
        }, { capture: true });
        window.addEventListener('blur', () => this.show());
    }

    /** Starts/resumes a round with an unobstructed game view. */
    hide() {
        if (world?.active && !world.paused && !world.result) this.frame.classList.add('cursor-hidden');
    }

    /** Restores pointer feedback in menus, results, loading, or after mouse movement. */
    show() {
        this.frame.classList.remove('cursor-hidden');
    }
}
const gameplayCursor = new GameplayCursor();
