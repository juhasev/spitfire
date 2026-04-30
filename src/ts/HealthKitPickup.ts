/**
 * Collectable medical kit. Renders as a clean white rounded square with
 * a bold red cross, a soft heartbeat-style red glow, gentle bob, and a
 * smooth fade-out across the final 3s of life.
 *
 * Spawning is driven by Sky based on the players' health — the kit only
 * appears when at least one combatant is below 50% HP.
 */
export default class HealthKitPickup {

    static PICKUP_RADIUS = 22;
    static LIFETIME_MS = 12000;

    /** Health restored when collected. */
    static HEAL_AMOUNT = 40;

    public x: number;
    public y: number;

    private ctx: CanvasRenderingContext2D | null;
    private canvas: HTMLCanvasElement | null;
    private spawnedAt: number;
    private collected: boolean;
    private bobPhase: number;

    constructor(canvas: HTMLCanvasElement, x: number, y: number) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.x = x;
        this.y = y;
        this.spawnedAt = Date.now();
        this.collected = false;
        this.bobPhase = Math.random() * Math.PI * 2;
    }

    /**
     * Whether the kit should still exist on screen.
     */
    public isActive(): boolean {
        if (this.collected) return false;
        if (Date.now() - this.spawnedAt > HealthKitPickup.LIFETIME_MS) return false;
        return true;
    }

    /**
     * Mark the kit collected.
     */
    public collect() {
        this.collected = true;
    }

    public getX() { return this.x; }
    public getY() { return this.y; }
    public getRadius() { return HealthKitPickup.PICKUP_RADIUS; }

    /**
     * Draw the medkit. All layers are alpha-multiplied by a fade factor
     * that smoothly drops to 0 across the last 3s of life.
     */
    public render() {
        if (this.ctx === null || this.canvas === null) return;
        if (!this.isActive()) return;

        const elapsed = Date.now() - this.spawnedAt;
        const remaining = HealthKitPickup.LIFETIME_MS - elapsed;

        const FADE_MS = 3000;
        const fadeAlpha = remaining >= FADE_MS
            ? 1
            : Math.max(0, remaining / FADE_MS);

        const bob = Math.sin(this.bobPhase + elapsed / 250) * 3;
        const drawY = this.y + bob;
        const baseRadius = HealthKitPickup.PICKUP_RADIUS;

        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.save();
        this.ctx.globalAlpha = fadeAlpha;

        // ---- Heartbeat-style pulse for the glow ----
        // A quick "lub" then a softer "dub" inside an ~0.9s cycle, otherwise quiet.
        const beatCycle = 900;
        const beatPhase = (elapsed % beatCycle) / beatCycle; // 0..1
        let beat = 0;
        if (beatPhase < 0.10) {
            beat = Math.sin((beatPhase / 0.10) * Math.PI);          // primary lub
        } else if (beatPhase >= 0.18 && beatPhase < 0.32) {
            beat = 0.6 * Math.sin(((beatPhase - 0.18) / 0.14) * Math.PI); // softer dub
        }
        const pulse = 0.35 + 0.65 * beat;

        // ---- Soft red aura ----
        const auraRadius = baseRadius + 10 + pulse * 9;
        const auraAlpha = 0.30 + pulse * 0.45;
        const aura = this.ctx.createRadialGradient(this.x, drawY, 4, this.x, drawY, auraRadius);
        aura.addColorStop(0, `rgba(244,67,54,${auraAlpha})`);
        aura.addColorStop(0.55, `rgba(229,57,53,${auraAlpha * 0.45})`);
        aura.addColorStop(1, "rgba(183,28,28,0)");
        this.ctx.beginPath();
        this.ctx.fillStyle = aura;
        this.ctx.arc(this.x, drawY, auraRadius, 0, 2 * Math.PI);
        this.ctx.fill();
        this.ctx.closePath();

        // ---- White rounded medkit body ----
        const boxSize = baseRadius * 1.55;
        const cornerR = 6;
        const bx = this.x - boxSize / 2;
        const by = drawY - boxSize / 2;

        this.ctx.beginPath();
        this.ctx.moveTo(bx + cornerR, by);
        this.ctx.lineTo(bx + boxSize - cornerR, by);
        this.ctx.quadraticCurveTo(bx + boxSize, by, bx + boxSize, by + cornerR);
        this.ctx.lineTo(bx + boxSize, by + boxSize - cornerR);
        this.ctx.quadraticCurveTo(bx + boxSize, by + boxSize, bx + boxSize - cornerR, by + boxSize);
        this.ctx.lineTo(bx + cornerR, by + boxSize);
        this.ctx.quadraticCurveTo(bx, by + boxSize, bx, by + boxSize - cornerR);
        this.ctx.lineTo(bx, by + cornerR);
        this.ctx.quadraticCurveTo(bx, by, bx + cornerR, by);
        this.ctx.closePath();

        // Slight vertical highlight gradient for depth
        const bodyGrad = this.ctx.createLinearGradient(0, by, 0, by + boxSize);
        bodyGrad.addColorStop(0, "rgba(255,255,255,0.99)");
        bodyGrad.addColorStop(1, "rgba(230,230,230,0.97)");
        this.ctx.fillStyle = bodyGrad;
        this.ctx.fill();

        this.ctx.strokeStyle = "rgba(120,120,120,0.85)";
        this.ctx.lineWidth = 1.5;
        this.ctx.stroke();

        // Subtle inner outline
        this.ctx.beginPath();
        this.ctx.strokeStyle = "rgba(0,0,0,0.08)";
        this.ctx.lineWidth = 1;
        this.ctx.rect(bx + 3, by + 3, boxSize - 6, boxSize - 6);
        this.ctx.stroke();
        this.ctx.closePath();

        // ---- Bold red cross ----
        const crossThickness = boxSize * 0.24;
        const crossLength = boxSize * 0.68;
        this.ctx.fillStyle = "#d32f2f";
        // Vertical bar
        this.ctx.fillRect(
            this.x - crossThickness / 2,
            drawY - crossLength / 2,
            crossThickness,
            crossLength
        );
        // Horizontal bar
        this.ctx.fillRect(
            this.x - crossLength / 2,
            drawY - crossThickness / 2,
            crossLength,
            crossThickness
        );

        // Soft highlight on the cross for a clean medical feel
        this.ctx.fillStyle = "rgba(255,255,255,0.18)";
        this.ctx.fillRect(
            this.x - crossThickness / 2,
            drawY - crossLength / 2,
            crossThickness,
            2
        );
        this.ctx.fillRect(
            this.x - crossLength / 2,
            drawY - crossThickness / 2,
            2,
            crossThickness
        );

        this.ctx.restore();
    }
}
