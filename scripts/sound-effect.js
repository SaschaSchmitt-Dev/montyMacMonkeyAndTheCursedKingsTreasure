/** A short, reusable effect voice on the shared Web Audio context. */
class SoundEffect {
    paused = true;
    ended = false;
    currentTime = 0;
    onended = null;
    source = null;
    gain = null;
    generation = 0;

    /** @param {GameAudio} owner - Shared context and decoded buffers.
     * @param {string} path - Local sound file. @param {number} volume - Effect gain.
     */
    constructor(owner, path, volume) {
        this.owner = owner;
        this.src = 'assets/sounds/' + path;
        this.volume = volume;
    }

    /** Decodes once per file, then creates only a lightweight one-shot source. */
    async play() {
        const generation = ++this.generation;
        this.paused = false;
        this.ended = false;
        try {
            const buffer = await this.owner.getEffectBuffer(this.src);
            if (generation !== this.generation || !this.owner.canPlay() || this.owner.sfxMuted) return;
            this.startSource(buffer, generation);
        } catch (error) {
            if (generation === this.generation) this.paused = true;
            throw error;
        }
    }

    /** @param {number} generation - Ignore ended callbacks from a cancelled source. */
    finish(generation) {
        if (generation !== this.generation) return;
        this.source?.disconnect();
        this.gain?.disconnect();
        this.source = this.gain = null;
        this.paused = this.ended = true;
        this.onended?.();
    }

    /** Cancels both a playing source and an effect still waiting for decoding. */
    pause() {
        this.generation++;
        if (this.source) {
            this.source.onended = null;
            this.source.stop();
            this.source.disconnect();
        }
        this.gain?.disconnect();
        this.source = this.gain = null;
        this.paused = true;
    }

    /** @param {AudioBuffer} buffer - Shared decoded data. @param {number} generation - Cancellation token. */
    startSource(buffer, generation) {
        const context = this.owner.context;
        this.source = context.createBufferSource();
        this.gain = context.createGain();
        this.gain.gain.value = this.volume;
        this.source.buffer = buffer;
        this.source.connect(this.gain);
        this.gain.connect(context.destination);
        this.source.onended = () => this.finish(generation);
        this.source.start();
    }

}
