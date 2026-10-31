/** Owns local music, ambience and bounded pools of short effects. */
class GameAudio {
    scene = 'none';
    sceneVersion = 0;
    unlocked = false;
    paused = false;
    musicMuted = gameSettings.musicMuted;
    sfxMuted = gameSettings.sfxMuted;
    loops = new Map();
    effects = new Map();
    effectBuffers = new Map();
    context = null;
    previous = null;
    stepTime = 0;
    variantIndexes = new Map();
    variants = { step: 4, land: 2, hurt: 2, treasure: 3 };
    lastEffect = new Map();
    sounds = {
        menu: ['v2/music/jungle-loop.ogg', 0.45],
        jungle: ['v2/music/jungle-loop.ogg', 0.6],
        boss: ['v2/music/boss-loop.ogg', 0.65],
        ambience: ['v2/ambience/jungle-loop.ogg', 0.75],
        snore: ['effects/player/friendly-snore-loop.wav', 0.24],
        jump: ['v2/effects/player/jump.wav', 0.65],
        death: ['effects/player/death.wav', 0.45],
        throw: ['effects/player/banana-throw.wav', 0.35],
        impact: ['effects/player/banana-impact.wav', 0.3],
        banana: ['v2/effects/collectibles/pickup-banana.wav', 0.7],
        relic: ['v2/effects/collectibles/world-01/pickup-relic.wav', 0.55],
        awaken: ['v2/effects/bosses/cursed-monkey-king/boss-awaken.wav', 0.65],
        charge: ['v2/effects/bosses/cursed-monkey-king/staff-charge.wav', 0.5],
        cast: ['v2/effects/bosses/cursed-monkey-king/curse-cast.wav', 0.55],
        bossHurt: ['v2/effects/bosses/cursed-monkey-king/boss-hurt.wav', 0.7],
        bossDefeat: ['v2/effects/bosses/cursed-monkey-king/boss-defeat.wav', 0.65],
        victory: ['v2/effects/transitions/level-complete.wav', 0.6],
        defeat: ['v2/effects/transitions/game-over.wav', 0.6],
        cave: ['v2/effects/transitions/cave-enter.wav', 0.5],
        confirm: ['effects/ui/confirm.wav', 0.22],
        back: ['effects/ui/back.wav', 0.22],
        focus: ['effects/ui/focus.wav', 0.12]
    };

    constructor() {
        for (const [group, count] of Object.entries(this.variants)) {
            for (let index = 1; index <= count; index++) {
                const suffix = String(index).padStart(2, '0');
                const files = { step: 'player/step-', land: 'player/land-',
                    hurt: 'player/player-hurt-', treasure: 'collectibles/pickup-coin-' };
                const volume = { step: 0.5, land: 0.55, hurt: 0.65, treasure: 0.65 };
                this.sounds[group + index] = ['v2/effects/' + files[group] + suffix + '.wav', volume[group]];
            }
        }
        for (const type of Object.keys(Enemy.types)) {
            this.sounds[type] = ['v2/effects/world-01/enemies/' + type + '/death.wav', 0.45];
        }
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) this.stopEffects();
            this.syncLoops();
        });
        for (const event of ['pointerdown', 'keydown']) {
            document.addEventListener(event, () => this.unlock(), { capture: true });
        }
        document.addEventListener('click', (event) => {
            if (event.target.closest('button')) this.effect('confirm');
        });
        document.addEventListener('focusin', (event) => {
            if (event.target.matches('button')) this.effect('focus');
        });
    }

    /** Unlocks only after input; rejected playback never interrupts the game. */
    unlock() {
        if (!this.context) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) this.context = new AudioContextClass();
        }
        if (this.context?.state === 'suspended') this.context.resume().catch(() => {});
        if (this.unlocked) return;
        this.unlocked = true;
        this.syncLoops();
    }

    /** @param {string} key - Registry entry. @returns {HTMLAudioElement} Local clip. */
    createClip(key) {
        const [path, volume] = this.sounds[key];
        const clip = new Audio('assets/sounds/' + path);
        clip.volume = volume;
        clip.preload = 'auto';
        return clip;
    }

    /** @returns {boolean} Whether app state currently allows sound. */
    canPlay() {
        return this.unlocked && !this.paused && !document.hidden;
    }

    /** @param {string} scene - menu, jungle, boss, ending, result or none.
     * @param {boolean} clearEffects - Whether short effects from the old scene must stop.
     */
    setScene(scene, clearEffects = true) {
        if (this.scene === scene) return;
        this.scene = scene;
        this.sceneVersion++;
        this.paused = false;
        this.previous = null;
        this.stepTime = 0;
        for (const clip of this.loops.values()) { clip.pause(); clip.currentTime = 0; }
        if (clearEffects) this.stopEffects();
        this.syncLoops();
    }

    /** Applies independent saved switches; ambience and intro audio belong to SFX. */
    setPreferences() {
        this.musicMuted = gameSettings.musicMuted;
        this.sfxMuted = gameSettings.sfxMuted;
        if (this.sfxMuted) this.stopEffects();
        this.syncLoops();
    }

    /** @param {boolean} value - Whether the simulation is paused. */
    setPaused(value) {
        this.paused = value;
        if (value) this.stopEffects();
        this.syncLoops();
    }

    /** Starts only loops belonging to the current screen, never duplicate instances. */
    syncLoops() {
        const wanted = [];
        if (['menu', 'jungle', 'boss'].includes(this.scene)) wanted.push(this.scene);
        if (this.scene === 'jungle') wanted.push('ambience');
        if (this.previous?.sleeping && ['menu', 'jungle', 'boss'].includes(this.scene)) wanted.push('snore');
        for (const key of wanted) {
            if (!this.loops.has(key)) {
                const clip = this.createClip(key);
                clip.loop = true;
                this.loops.set(key, clip);
            }
        }
        for (const [key, clip] of this.loops) {
            const muted = ['menu', 'jungle', 'boss'].includes(key) ? this.musicMuted : this.sfxMuted;
            if (this.canPlay() && !muted && wanted.includes(key)) {
                if (clip.paused) clip.play().catch(() => {});
            } else clip.pause();
        }
    }

    /** @param {string} key - Short effect. @param {number|null} x - Optional world position. */
    effect(key, x = null) {
        if (!this.canPlay() || this.sfxMuted) return;
        if (x !== null && world && Math.abs(x - world.character.x) > CanvasResolution.width) return;
        const now = performance.now();
        if (now - (this.lastEffect.get(key) ?? -Infinity) < 65) return;
        this.lastEffect.set(key, now);
        key = this.selectVariant(key);
        if (!this.sounds[key]) return;
        if (!this.effects.has(key)) this.effects.set(key, []);
        const pool = this.effects.get(key);
        let clip = pool.find((audio) => audio.paused || audio.ended);
        if (!clip && pool.length < 2 && this.context) {
            const [path, volume] = this.sounds[key];
            clip = new SoundEffect(this, path, volume);
            pool.push(clip);
        }
        if (!clip) return;
        clip.currentTime = 0;
        clip.play().catch(() => {});
    }

    /** @param {string} path - Effect URL.
     * @returns {Promise<AudioBuffer>} One decoded buffer shared by every voice and replay.
     */
    getEffectBuffer(path) {
        if (!this.effectBuffers.has(path)) {
            const loaded = fetch(path).then((response) => {
                if (!response.ok) throw new Error('Audio unavailable');
                return response.arrayBuffer();
            }).then((data) => this.context.decodeAudioData(data));
            this.effectBuffers.set(path, loaded);
            loaded.catch(() => this.effectBuffers.delete(path));
        }
        return this.effectBuffers.get(path);
    }

    /** @param {string} key - Effect group. @returns {string} Variant without immediate repeats. */
    selectVariant(key) {
        const count = this.variants[key];
        if (!count) return key;
        const previous = this.variantIndexes.get(key) ?? 0;
        const index = (previous + 1 + Math.floor(Math.random() * (count - 1))) % count;
        this.variantIndexes.set(key, index);
        return key + (index + 1);
    }

    /** @param {string} result - Result cue follows the longer boss defeat instead of covering it. */
    playResult(result) {
        const defeat = this.effects.get('bossDefeat')?.find((clip) => !clip.paused && !clip.ended);
        if (result !== 'victory' || !defeat) return this.effect(result === 'victory' ? 'victory' : 'defeat');
        const version = this.sceneVersion;
        defeat.onended = () => {
            defeat.onended = null;
            if (this.scene === 'result' && this.sceneVersion === version) this.effect('victory');
        };
    }

    /** Stops pending and playing effects; they are not replayed after a pause. */
    stopEffects() {
        for (const pool of this.effects.values()) {
            for (const clip of pool) { clip.onended = null; clip.pause(); clip.currentTime = 0; }
        }
    }

    /** @param {Character} character - Current game or menu figure.
     * @param {number} delta - Simulation time in seconds.
     */
    updateCharacter(character, delta) {
        const grounded = character.isGrounded();
        const sleeping = character.animation === 'sleep' && character.animationTime >= 5 / 6;
        if (this.previous?.character !== character) this.previous = null;
        if (this.previous?.grounded && character.velocityY < 0) this.effect('jump');
        if (this.previous && !this.previous.grounded && grounded) this.effect('land');
        this.stepTime = grounded && character.moving ? this.stepTime + delta : 0;
        if (this.stepTime >= 0.24) {
            this.effect('step');
            this.stepTime = 0;
        }
        const changed = this.previous?.sleeping !== sleeping;
        this.previous = { character, grounded, sleeping };
        if (changed) this.syncLoops();
    }

    /** Stops the menu snore while a dialog suspends the menu character. */
    clearCharacter() {
        this.previous = null;
        this.stepTime = 0;
        this.syncLoops();
    }
}
const gameAudio = new GameAudio();
