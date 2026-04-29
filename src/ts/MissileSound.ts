/**
 * Synthesized missile launch sound built with Web Audio API. Avoids
 * shipping a binary asset and keeps the sound tweakable.
 *
 * Layered design:
 *   1. White-noise burst piped through a band-pass filter whose center
 *      frequency sweeps from ~2.2 kHz down to ~450 Hz — the "hiss" of
 *      pressurized exhaust gas.
 *   2. Sawtooth oscillator with a fast pitch sweep from 220 Hz to 60 Hz —
 *      the low rumble of ignition.
 *   3. A short attack and exponential decay master envelope.
 */
export default class MissileSound {

    private static ctx: AudioContext | null = null;

    private volume: number;

    constructor(volume: number = 0.4) {
        this.volume = volume;
    }

    /**
     * Lazily create (and cache) a single shared AudioContext. Browsers
     * require this to happen after a user gesture; the game starts on a
     * button click so the first call here is always safe.
     */
    protected static getCtx(): AudioContext | null {
        if (this.ctx) return this.ctx;

        const w = window as unknown as {
            AudioContext?: typeof AudioContext;
            webkitAudioContext?: typeof AudioContext;
        };
        const Ctx = w.AudioContext || w.webkitAudioContext;
        if (!Ctx) return null;

        try {
            this.ctx = new Ctx();
        } catch (e) {
            this.ctx = null;
        }
        return this.ctx;
    }

    /**
     * Play one missile launch. Each call generates a fresh set of nodes
     * so successive launches can overlap.
     */
    public play() {
        const ctx = MissileSound.getCtx();
        if (!ctx) return;

        // Some browsers leave the context "suspended" until a user gesture
        // unlocks it; resume() is a no-op when already running.
        if (ctx.state === "suspended") {
            ctx.resume().catch(() => {
                /* ignore */
            });
        }

        const now = ctx.currentTime;
        const duration = 0.9;

        // Master envelope (per shot)
        const master = ctx.createGain();
        master.gain.setValueAtTime(0, now);
        master.gain.linearRampToValueAtTime(this.volume, now + 0.04);
        master.gain.exponentialRampToValueAtTime(0.001, now + duration);
        master.connect(ctx.destination);

        // ---- 1) Hissy whoosh: white noise -> sweeping band-pass ----
        const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = "bandpass";
        noiseFilter.Q.value = 1.2;
        noiseFilter.frequency.setValueAtTime(2200, now);
        noiseFilter.frequency.exponentialRampToValueAtTime(450, now + duration);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.6, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.05, now + duration);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(master);
        noise.start(now);
        noise.stop(now + duration);

        // ---- 2) Low ignition rumble: sawtooth with downward pitch sweep ----
        const osc = ctx.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + duration);

        const oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(0.0, now);
        oscGain.gain.linearRampToValueAtTime(0.35, now + 0.05);
        oscGain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        osc.connect(oscGain);
        oscGain.connect(master);
        osc.start(now);
        osc.stop(now + duration);
    }
}
