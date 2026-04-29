/**
 * Time-based, multi-layer explosion animation drawn directly onto the
 * game canvas. The animation is parameterized by elapsed wall-clock time
 * so it remains consistent regardless of frame rate.
 *
 * Layers, in draw order:
 *   1. Bright white-hot flash core (very short, sharp).
 *   2. Orange/red fireball that expands and fades.
 *   3. Expanding white shockwave ring.
 *   4. Radiating spark particles that decelerate over time.
 *   5. Dark smoke cloud that lingers as the rest fades out.
 */
export default class Explosion {

    static DURATION_MS = 750;

    public x: number;
    public y: number;

    private ctx: CanvasRenderingContext2D | null;
    private canvas: HTMLCanvasElement | null;
    private startedAt: number;
    private maxRadius: number;
    private particles: Array<{angle: number, speed: number, size: number, hue: number}>;

    /**
     * @param canvas    target canvas
     * @param x         center X
     * @param y         center Y
     * @param intensity scales the overall size; 1.0 is a normal missile hit
     */
    constructor(canvas: HTMLCanvasElement, x: number, y: number, intensity: number = 1) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.x = x;
        this.y = y;
        this.startedAt = Date.now();
        this.maxRadius = 70 * intensity;

        // Pre-compute a fixed set of sparks so the pattern is stable across
        // the animation (deterministic for this instance).
        const particleCount = 18 + Math.floor(Math.random() * 10);
        this.particles = [];
        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                angle: Math.random() * Math.PI * 2,
                speed: 90 + Math.random() * 180, // pixels per second
                size: 1.6 + Math.random() * 2.4,
                hue: 30 + Math.random() * 25     // 30=red-orange, 55=yellow
            });
        }
    }

    /**
     * Whether the explosion still has frames left to render.
     */
    public isVisible(): boolean {
        return Date.now() - this.startedAt < Explosion.DURATION_MS;
    }

    /**
     * Draw the current frame. Safe to call after the animation has ended
     * (it just no-ops).
     */
    public render() {
        if (this.ctx === null || this.canvas === null) return;

        const elapsed = Date.now() - this.startedAt;
        if (elapsed >= Explosion.DURATION_MS) return;

        const t = elapsed / Explosion.DURATION_MS; // 0..1
        const tSec = elapsed / 1000;

        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.save();

        // ---- 1. White-hot flash (0..0.35) ----
        if (t < 0.35) {
            const k = 1 - t / 0.35;
            const flashRadius = this.maxRadius * (0.25 + t * 1.4);
            const grad = this.ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, flashRadius);
            grad.addColorStop(0, `rgba(255,255,230,${k})`);
            grad.addColorStop(0.55, `rgba(255,210,120,${k * 0.85})`);
            grad.addColorStop(1, `rgba(255,90,20,0)`);
            this.ctx.beginPath();
            this.ctx.fillStyle = grad;
            this.ctx.arc(this.x, this.y, flashRadius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.closePath();
        }

        // ---- 2. Fireball (0..0.7) ----
        if (t < 0.7) {
            const k = 1 - t / 0.7;
            const fireRadius = this.maxRadius * (0.45 + t * 1.3);
            const grad = this.ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, fireRadius);
            grad.addColorStop(0, `rgba(255,160,50,${k * 0.85})`);
            grad.addColorStop(0.6, `rgba(220,70,25,${k * 0.5})`);
            grad.addColorStop(1, `rgba(80,30,10,0)`);
            this.ctx.beginPath();
            this.ctx.fillStyle = grad;
            this.ctx.arc(this.x, this.y, fireRadius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.closePath();
        }

        // ---- 3. Shockwave ring (0..0.55) ----
        if (t < 0.55) {
            const k = 1 - t / 0.55;
            const ringRadius = this.maxRadius * (0.4 + t * 1.8);
            this.ctx.beginPath();
            this.ctx.strokeStyle = `rgba(255,240,190,${k * 0.55})`;
            this.ctx.lineWidth = 2;
            this.ctx.arc(this.x, this.y, ringRadius, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.closePath();
        }

        // ---- 4. Sparks ----
        // Distance = speed * time * (1 - decel * t); decelerates near the end.
        const decel = 0.5;
        const sparkLife = 0.85;
        if (t < sparkLife) {
            const sparkAlpha = 1 - t / sparkLife;
            this.particles.forEach((p) => {
                const travel = p.speed * tSec * (1 - decel * t);
                const px = this.x + Math.cos(p.angle) * travel;
                const py = this.y + Math.sin(p.angle) * travel;
                const sparkSize = Math.max(0.5, p.size * (1 - t * 0.6));

                this.ctx!.beginPath();
                this.ctx!.fillStyle = `hsla(${p.hue}, 95%, 60%, ${sparkAlpha})`;
                this.ctx!.arc(px, py, sparkSize, 0, Math.PI * 2);
                this.ctx!.fill();
                this.ctx!.closePath();
            });
        }

        // ---- 5. Dark lingering smoke (0.3..1.0) ----
        if (t > 0.3) {
            const smokeT = (t - 0.3) / 0.7;
            const smokeAlpha = 0.45 * (1 - smokeT);
            const smokeRadius = this.maxRadius * (0.55 + smokeT * 1.0);
            const grad = this.ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, smokeRadius);
            grad.addColorStop(0, `rgba(70,70,70,${smokeAlpha * 0.8})`);
            grad.addColorStop(1, `rgba(40,40,40,0)`);
            this.ctx.beginPath();
            this.ctx.fillStyle = grad;
            this.ctx.arc(this.x, this.y, smokeRadius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.closePath();
        }

        this.ctx.restore();
    }
}
