/** Temporary, sampled CPU/RAF diagnostics; these are not GPU presentation measurements. */
class PerformanceOverlay {
    static element = document.createElement('output');
    static source = null;
    static start = null;
    static last = null;
    static frames = 0;
    static fps = null;
    static counter = 0;
    static sampling = false;
    static markTime = 0;
    static stages = {};
    static totals = {};
    static samples = 0;
    static drawCalls = 0;
    static totalCalls = 0;
    static intervals = [];
    static scene = '—';
    static report = null;
    static history = [];

    /** Inserts diagnostics without adding an animation loop or measuring every frame. */
    static init() {
        this.element.id = 'performance-overlay';
        this.element.setAttribute('aria-label', 'Temporäre Leistungsanzeige');
        document.body.append(this.element);
    }

    /** @param {string} scene - Current gameplay area. Samples every tenth frame. */
    static beginFrame(scene) {
        this.scene = scene;
        this.sampling = this.counter++ % 10 === 0;
        if (!this.sampling) return;
        this.stages = {};
        this.drawCalls = 0;
        this.markTime = performance.now();
    }

    /** @param {string} name - Work completed since the preceding mark. */
    static mark(name) {
        if (!this.sampling) return;
        const now = performance.now();
        this.stages[name] = (this.stages[name] || 0) + now - this.markTime;
        this.markTime = now;
    }

    /** Counts image draw commands only during sampled frames. */
    static countDraw() {
        if (this.sampling) this.drawCalls++;
    }

    /** Stores a sample without causing any pixel readback or GPU synchronisation. */
    static finishSample() {
        if (!this.sampling) return;
        this.sampling = false;
        for (const [name, time] of Object.entries(this.stages)) this.totals[name] = (this.totals[name] || 0) + time;
        this.totalCalls += this.drawCalls;
        this.samples++;
    }

    /** @param {number} time - Real RAF timestamp. @param {HTMLCanvasElement} canvas - Drawn scene. */
    static record(time, canvas) {
        if (this.source !== canvas || this.last === null || time - this.last > 1000) this.reset(time, canvas);
        if (this.last !== null && time > this.last) this.intervals.push(time - this.last);
        this.last = time;
        this.finishSample();
        this.frames++;
        if (time - this.start < 1000) return;
        this.publish(time);
    }

    /** @param {number} time - End of the current measurement window. */
    static publish(time) {
        this.fps = Math.round((this.frames - 1) * 1000 / (time - this.start));
        const sorted = [...this.intervals].sort((a, b) => a - b);
        const stages = Object.fromEntries(Object.entries(this.totals).map(([name, sum]) => [name, sum / Math.max(1, this.samples)]));
        this.report = { scene: this.scene, fps: this.fps, frameMs: this.intervals.reduce((a, b) => a + b, 0) / Math.max(1, sorted.length),
            p95: sorted[Math.floor(sorted.length * 0.95)] || 0, stages, draws: this.totalCalls / Math.max(1, this.samples) };
        this.history.push(this.report);
        if (this.history.length > 30) this.history.shift();
        this.start = time;
        this.frames = 1;
        this.clearSamples();
        this.refresh();
    }

    /** Starts the next measurement window. */
    static clearSamples() {
        this.intervals = [];
        this.totals = {};
        this.samples = this.totalCalls = 0;
    }

    /** @param {number} time - Fresh sample timestamp. @param {HTMLCanvasElement} canvas - Active canvas. */
    static reset(time, canvas) {
        this.source = canvas;
        this.start = time;
        this.last = null;
        this.frames = 0;
        this.fps = null;
        this.report = null;
        this.clearSamples();
        this.refresh();
    }

    /** Reports loop cadence and sampled JavaScript work separately from the physical canvas size. */
    static refresh() {
        const menu = document.getElementById('start-screen');
        const canvas = document.getElementById(menu.hidden ? 'canvas' : 'menu-character');
        const box = document.querySelector('.game-frame').getBoundingClientRect();
        const r = this.report;
        const stages = r ? Object.entries(r.stages).map(([name, ms]) => `${name} ${ms.toFixed(1)}`).join(' | ') : 'Messung läuft …';
        this.element.textContent = `Loop-FPS: ${this.fps ?? '—'} | Frame Ø/P95: ${r ? r.frameMs.toFixed(1) + '/' + r.p95.toFixed(1) : '—'} ms`
            + ` | ${this.scene} | Bilder: ${r ? Math.round(r.draws) : '—'}\nCPU-Zeiten (ms, Stichprobe): ${stages}`
            + `\nCanvas: ${canvas.width} × ${canvas.height} | Ansicht: ${Math.round(box.width)} × ${Math.round(box.height)} | DPR: ${window.devicePixelRatio || 1}`;
    }
}
PerformanceOverlay.init();
