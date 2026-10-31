/** Fits the fixed game world to the viewport without changing gameplay coordinates. */
class GameDisplay {
    frame = document.querySelector('.game-frame');
    orientationDialog = document.getElementById('orientation-dialog');
    fullscreenButton = document.getElementById('fullscreen-toggle');
    automaticAttempted = false;
    pending = false;
    mobileDevice = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
        || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    constructor() {
        window.addEventListener('resize', () => this.updateLayout());
        window.visualViewport?.addEventListener('resize', () => this.updateLayout());
        for (const name of ['fullscreenchange', 'webkitfullscreenchange']) {
            document.addEventListener(name, () => this.updateLayout());
        }
        document.addEventListener('click', (event) => this.startFullscreen(event), { capture: true });
        this.fullscreenButton.addEventListener('click', () => this.toggleFullscreen(!this.isFullscreen()));
        this.orientationDialog.addEventListener('cancel', (event) => event.preventDefault());
        this.protectGameGestures();
        this.protectMixedTouches();
        this.updateLayout();
    }

    /** @returns {boolean} Whether the browser currently displays a fullscreen element. */
    isFullscreen() {
        return Boolean(document.fullscreenElement || document.webkitFullscreenElement);
    }

    /** @returns {boolean} Detect capability instead of assuming all mobile browsers support it. */
    supportsFullscreen() {
        return Boolean(document.fullscreenEnabled && document.documentElement.requestFullscreen
            || document.webkitFullscreenEnabled && document.documentElement.webkitRequestFullscreen);
    }

    /** @returns {boolean} Tablets/phones and small browser windows use the available space. */
    isCompact() {
        return this.mobileDevice || window.innerWidth <= 1024 || window.innerHeight <= 600;
    }

    /** Requests fullscreen within a start gesture, never on load or repeatedly after Escape. */
    startFullscreen(event) {
        if (!event.target.closest('#intro-play-button, #intro-menu-button, #start-button')) return;
        if (!this.isCompact() || this.automaticAttempted || !this.supportsFullscreen()) return;
        this.automaticAttempted = true;
        this.toggleFullscreen(true);
    }

    /** @param {boolean} enter - Explicit requested state; browser rejection leaves the game usable. */
    async toggleFullscreen(enter) {
        if (this.pending || enter === this.isFullscreen() || !this.supportsFullscreen()) return;
        this.pending = true;
        try {
            if (enter) await this.enterFullscreen();
            else await (document.exitFullscreen || document.webkitExitFullscreen).call(document);
        } catch {
            // Unsupported or denied fullscreen keeps the responsive browser view.
        } finally {
            this.pending = false;
            this.updateLayout();
        }
    }

    /** Uses the whole document so modal menus remain visible in the fullscreen top layer. */
    enterFullscreen() {
        const root = document.documentElement;
        if (root.requestFullscreen) return root.requestFullscreen({ navigationUI: 'hide' });
        return root.webkitRequestFullscreen();
    }

    /** Tracks Safari's visible viewport as its browser bars expand and collapse. */
    updateLayout() {
        const viewport = window.visualViewport;
        const height = viewport && viewport.scale === 1 ? viewport.height : window.innerHeight;
        document.documentElement.style.setProperty('--view-height', height + 'px');
        document.body.classList.toggle('compact-display', this.isCompact() || this.isFullscreen());
        ImageQuality.update(this.frame, this.mobileDevice);
        this.updateCanvases();
        this.updateOrientation();
        this.updateLabels();
    }

    /** Refreshes resized buffers immediately, including a frozen pause/result screen. */
    updateCanvases() {
        if (CanvasResolution.resize(canvas)) world?.draw(true);
        if (CanvasResolution.resize(menuWalker.canvas)) menuWalker.draw();
        PerformanceOverlay.element.hidden = this.mobileDevice;
        PerformanceOverlay.refresh();
    }

    /** Blocks portrait play on mobile; a running world remains paused after rotating back. */
    updateOrientation() {
        const portrait = window.innerHeight > window.innerWidth;
        const blocked = portrait && (this.mobileDevice || touchControls.touchMode);
        if (blocked && world?.active && !world.paused && !world.result) {
            if (this.orientationDialog.open) this.orientationDialog.close();
            openPauseMenu();
        }
        if (blocked && !this.orientationDialog.open) {
            keyboard.reset();
            menuWalker.keyboard.reset();
            this.orientationDialog.showModal();
        } else if (!blocked && this.orientationDialog.open) this.orientationDialog.close();
    }

    /** Updates options after language changes, Escape, and native fullscreen transitions. */
    updateLabels() {
        const available = this.supportsFullscreen();
        this.fullscreenButton.disabled = !available;
        this.fullscreenButton.textContent = t(this.isFullscreen() ? 'on' : 'off');
        this.fullscreenButton.setAttribute('aria-pressed', String(this.isFullscreen()));
        this.fullscreenButton.setAttribute('aria-label', t('fullscreen') + ': ' + this.fullscreenButton.textContent);
        const note = document.getElementById('fullscreen-note');
        note.hidden = available;
        note.textContent = available ? '' : t('fullscreenUnavailable');
    }

    /** Prevents selection, long-press menus and multi-finger browser gestures only on game artwork. */
    protectGameGestures() {
        for (const name of ['contextmenu', 'selectstart', 'dragstart']) {
            this.frame.addEventListener(name, (event) => event.preventDefault());
        }
        for (const name of ['touchstart', 'touchmove', 'gesturestart', 'gesturechange', 'gestureend']) {
            this.frame.addEventListener(name, (event) => {
                if ((name !== 'touchstart' || event.touches.length > 1) && event.cancelable) event.preventDefault();
            }, { passive: false });
        }
    }
    /** Also blocks a pinch with one finger on a button and the other in the letterbox margin. */
    protectMixedTouches() {
        for (const name of ['touchstart', 'touchmove']) {
            document.addEventListener(name, (event) => {
                const touchesGame = Array.from(event.touches || []).some((touch) => this.frame.contains(touch.target));
                if (event.touches?.length > 1 && touchesGame && event.cancelable) event.preventDefault();
            }, { passive: false });
        }
    }
}
window.gameDisplay = new GameDisplay();
