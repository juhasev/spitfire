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
     * Render pickup. Pickup gently bobs and pulses; flashes when about
     * to expire.
     */
    public render() {
        if (this.ctx === null || this.canvas === null) return;
        if (!this.isActive()) return;

        const elapsed = Date.now() - this.spawnedAt;
        const remaining = MissilePickup.LIFETIME_MS - elapsed;

        // Flash near end of life
        if (remaining < 3000) {
            const flash = Math.floor(remaining / 150) % 2;
            if (flash === 0) return;
        }

        const bob = Math.sin(this.bobPhase + elapsed / 250) * 3;
        const drawY = this.y + bob;

        this.ctx.setTransform(1, 0, 0, 1, 0, 0);

        // Glow ring
        const grad = this.ctx.createRadialGradient(this.x, drawY, 4, this.x, drawY, MissilePickup.PICKUP_RADIUS + 8);
        grad.addColorStop(0, 'rgba(255,235,59,0.7)');
        grad.addColorStop(1, 'rgba(255,235,59,0)');
        this.ctx.beginPath();
        this.ctx.fillStyle = grad;
        this.ctx.arc(this.x, drawY, MissilePickup.PICKUP_RADIUS + 8, 0, 2 * Math.PI);
        this.ctx.fill();
        this.ctx.closePath();

        // Crate-like background
        this.ctx.beginPath();
        this.ctx.fillStyle = 'rgba(33,33,33,0.85)';
        this.ctx.strokeStyle = '#ffeb3b';
        this.ctx.lineWidth = 2;
        this.ctx.arc(this.x, drawY, MissilePickup.PICKUP_RADIUS, 0, 2 * Math.PI);
        this.ctx.fill();
        this.ctx.stroke();
        this.ctx.closePath();

        // Mini missile icon (pointing up-right)
        this.ctx.save();
        this.ctx.translate(this.x, drawY);
        this.ctx.rotate(-Math.PI / 4);

        this.ctx.beginPath();
        this.ctx.fillStyle = '#eeeeee';
        this.ctx.fillRect(-9, -2, 14, 4);

        this.ctx.beginPath();
        this.ctx.moveTo(5, -2);
        this.ctx.lineTo(11, 0);
        this.ctx.lineTo(5, 2);
        this.ctx.closePath();
        this.ctx.fillStyle = '#e53935';
        this.ctx.fill();

        this.ctx.beginPath();
        this.ctx.moveTo(-9, -2);
        this.ctx.lineTo(-13, -5);
        this.ctx.lineTo(-7, -2);
        this.ctx.closePath();
        this.ctx.fillStyle = '#424242';
        this.ctx.fill();

        this.ctx.beginPath();
        this.ctx.moveTo(-9, 2);
        this.ctx.lineTo(-13, 5);
        this.ctx.lineTo(-7, 2);
        this.ctx.closePath();
        this.ctx.fillStyle = '#424242';
        this.ctx.fill();

        this.ctx.restore();
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
