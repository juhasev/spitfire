export default class MissilePickup {

    static PICKUP_RADIUS = 22;
    static LIFETIME_MS = 12000;

    public x: number;
    public y: number;

    private ctx: CanvasRenderingContext2D | null;
    private canvas: HTMLCanvasElement | null;
    private spawnedAt: number;
    private collected: boolean;
    private bobPhase: number;

    /**
     * MissilePickup constructor
     *
     * @param canvas
     * @param x
     * @param y
     */
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
     * Render pickup with a layered, "stylish" look:
     *   1. Sine-pulsing aura (the steady blink)
     *   2. Two expanding radar-pulse rings on a rolling cycle (radar ping)
     *   3. Rotating lock-on corner brackets
     *   4. Dark crate-disc with a yellow rim
     *   5. Refined metallic missile icon (gradient body, red nose, fins)
     *
     * Near end of life it flashes faster and faster as a warning.
     */
    public render() {
        if (this.ctx === null || this.canvas === null) return;
        if (!this.isActive()) return;

        const elapsed = Date.now() - this.spawnedAt;
        const remaining = MissilePickup.LIFETIME_MS - elapsed;

        // Final-warning fade: smoothly fade alpha from 1.0 to 0 across the
        // last 3 seconds of life instead of strobing on/off.
        const FADE_MS = 3000;
        const fadeAlpha = remaining >= FADE_MS
            ? 1
            : Math.max(0, remaining / FADE_MS);

        const bob = Math.sin(this.bobPhase + elapsed / 250) * 3;
        const drawY = this.y + bob;
        const baseRadius = MissilePickup.PICKUP_RADIUS;

        this.ctx.setTransform(1, 0, 0, 1, 0, 0);

        // Apply the fade to every draw call below via globalAlpha; restored
        // at the bottom of the method.
        this.ctx.save();
        this.ctx.globalAlpha = fadeAlpha;

        // ---- 1. Pulsing aura (sine wave for steady blink) ----
        const pulse = 0.5 + 0.5 * Math.sin(elapsed / 220); // 0..1
        const auraRadius = baseRadius + 12 + pulse * 6;
        const auraAlpha = 0.35 + pulse * 0.45;
        const aura = this.ctx.createRadialGradient(this.x, drawY, 4, this.x, drawY, auraRadius);
        aura.addColorStop(0, `rgba(255,235,90,${auraAlpha})`);
        aura.addColorStop(0.55, `rgba(255,180,30,${auraAlpha * 0.55})`);
        aura.addColorStop(1, "rgba(255,140,0,0)");
        this.ctx.beginPath();
        this.ctx.fillStyle = aura;
        this.ctx.arc(this.x, drawY, auraRadius, 0, 2 * Math.PI);
        this.ctx.fill();
        this.ctx.closePath();

        // ---- 2. Two expanding radar pulses (offset by half a cycle) ----
        const pulseCycleMs = 1100;
        for (let i = 0; i < 2; i++) {
            const phase = ((elapsed + i * pulseCycleMs / 2) % pulseCycleMs) / pulseCycleMs;
            const ringR = baseRadius + 4 + phase * 28;
            const ringA = (1 - phase) * 0.55;
            this.ctx.beginPath();
            this.ctx.strokeStyle = `rgba(255,235,90,${ringA})`;
            this.ctx.lineWidth = 1.5;
            this.ctx.arc(this.x, drawY, ringR, 0, 2 * Math.PI);
            this.ctx.stroke();
            this.ctx.closePath();
        }

        // ---- 3. Rotating lock-on corner brackets ----
        const bracketRotation = elapsed / 1500; // slow spin
        const bracketRadius = baseRadius + 5;
        const bracketArmLen = 7;
        this.ctx.save();
        this.ctx.translate(this.x, drawY);
        this.ctx.rotate(bracketRotation);
        this.ctx.strokeStyle = "rgba(255,235,90,0.85)";
        this.ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
            const angle = (Math.PI / 2) * i + Math.PI / 4;
            const cx = Math.cos(angle) * bracketRadius;
            const cy = Math.sin(angle) * bracketRadius;
            // Two short perpendicular strokes forming an "L" at each quadrant
            const tx = -Math.sin(angle);
            const ty = Math.cos(angle);
            const rx = Math.cos(angle);
            const ry = Math.sin(angle);
            this.ctx.beginPath();
            this.ctx.moveTo(cx, cy);
            this.ctx.lineTo(cx + tx * bracketArmLen, cy + ty * bracketArmLen);
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.moveTo(cx, cy);
            this.ctx.lineTo(cx - rx * bracketArmLen, cy - ry * bracketArmLen);
            this.ctx.stroke();
        }
        this.ctx.restore();

        // ---- 4. Crate-disc background ----
        this.ctx.beginPath();
        this.ctx.fillStyle = "rgba(28,28,28,0.9)";
        this.ctx.strokeStyle = "#ffeb3b";
        this.ctx.lineWidth = 2;
        this.ctx.arc(this.x, drawY, baseRadius, 0, 2 * Math.PI);
        this.ctx.fill();
        this.ctx.stroke();
        this.ctx.closePath();

        // Inner highlight ring for a metallic feel
        this.ctx.beginPath();
        this.ctx.strokeStyle = "rgba(255,235,90,0.35)";
        this.ctx.lineWidth = 1;
        this.ctx.arc(this.x, drawY, baseRadius - 4, 0, 2 * Math.PI);
        this.ctx.stroke();
        this.ctx.closePath();

        // ---- 5. Refined missile icon ----
        this.ctx.save();
        this.ctx.translate(this.x, drawY);
        this.ctx.rotate(-Math.PI / 4); // points up-right

        // Body with a soft vertical metallic gradient
        const bodyGrad = this.ctx.createLinearGradient(0, -3, 0, 3);
        bodyGrad.addColorStop(0, "#fafafa");
        bodyGrad.addColorStop(0.5, "#bdbdbd");
        bodyGrad.addColorStop(1, "#757575");

        // Body outline
        this.ctx.beginPath();
        this.ctx.fillStyle = bodyGrad;
        this.ctx.strokeStyle = "rgba(0,0,0,0.4)";
        this.ctx.lineWidth = 0.5;
        this.ctx.fillRect(-10, -3, 16, 6);
        this.ctx.strokeRect(-10, -3, 16, 6);
        this.ctx.closePath();

        // Single warning stripe on body
        this.ctx.fillStyle = "rgba(229,57,53,0.85)";
        this.ctx.fillRect(-3, -3, 1.5, 6);

        // Nose cone (pointed red tip)
        this.ctx.beginPath();
        this.ctx.moveTo(6, -3);
        this.ctx.lineTo(12, 0);
        this.ctx.lineTo(6, 3);
        this.ctx.closePath();
        const noseGrad = this.ctx.createLinearGradient(6, 0, 12, 0);
        noseGrad.addColorStop(0, "#ef5350");
        noseGrad.addColorStop(1, "#b71c1c");
        this.ctx.fillStyle = noseGrad;
        this.ctx.fill();

        // Top fin
        this.ctx.beginPath();
        this.ctx.moveTo(-10, -3);
        this.ctx.lineTo(-14, -6);
        this.ctx.lineTo(-7, -3);
        this.ctx.closePath();
        this.ctx.fillStyle = "#212121";
        this.ctx.fill();

        // Bottom fin
        this.ctx.beginPath();
        this.ctx.moveTo(-10, 3);
        this.ctx.lineTo(-14, 6);
        this.ctx.lineTo(-7, 3);
        this.ctx.closePath();
        this.ctx.fillStyle = "#212121";
        this.ctx.fill();

        // Exhaust glow (small pulsing flame at tail)
        const flameR = 2 + pulse * 1.5;
        const flameGrad = this.ctx.createRadialGradient(-13, 0, 0, -13, 0, flameR + 2);
        flameGrad.addColorStop(0, "rgba(255,236,179,0.95)");
        flameGrad.addColorStop(0.5, "rgba(255,152,0,0.8)");
        flameGrad.addColorStop(1, "rgba(255,87,34,0)");
        this.ctx.beginPath();
        this.ctx.fillStyle = flameGrad;
        this.ctx.arc(-13, 0, flameR + 2, 0, 2 * Math.PI);
        this.ctx.fill();
        this.ctx.closePath();

        this.ctx.restore(); // closes icon save() above
        this.ctx.restore(); // closes the top-level globalAlpha fade save()
    }

    /**
     * Mark this pickup collected
     */
    public collect() {
        this.collected = true;
    }

    /**
     * Whether the pickup should still exist (not collected and not expired)
     */
    public isActive() {
        if (this.collected) return false;
        if (Date.now() - this.spawnedAt > MissilePickup.LIFETIME_MS) return false;
        return true;
    }

    public getX() {
        return this.x;
    }

    public getY() {
        return this.y;
    }

    public getRadius() {
        return MissilePickup.PICKUP_RADIUS;
    }
}
