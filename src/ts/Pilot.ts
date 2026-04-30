/**
 * Ejected pilot animation. Used by Sky when a plane runs out of health:
 *
 *   1. Pilot is created at the dying plane's position with an upward
 *      velocity and a small horizontal drift, tumbling end-over-end.
 *   2. Free-fall under gravity for ~1 second.
 *   3. Parachute deploys, rotation locks to vertical, and the pilot
 *      drifts straight down at a slow constant speed until off-screen.
 */
export default class Pilot {

    /** Vertical acceleration during free-fall (px/frame^2). */
    static GRAVITY = 0.4;

    /** Time after eject before the parachute opens. */
    static PARACHUTE_DEPLOY_DELAY_MS = 1000;

    /** Constant descent speed once the parachute is open (px/frame). */
    static PARACHUTE_FALL_SPEED = 1.4;

    /** Initial upward speed at eject (negative = up on canvas). */
    static EJECT_INITIAL_VY = -10;

    public x: number;
    public y: number;

    private vx: number;
    private vy: number;
    private rotation: number;
    private rotationSpeed: number;
    private spawnedAt: number;
    private parachuteDeployed: boolean;
    private ctx: CanvasRenderingContext2D | null;
    private canvas: HTMLCanvasElement | null;

    constructor(canvas: HTMLCanvasElement, x: number, y: number) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.x = x;
        this.y = y;

        // Eject straight up with a small random horizontal drift so two
        // ejections look slightly different.
        this.vx = (Math.random() - 0.5) * 3;
        this.vy = Pilot.EJECT_INITIAL_VY;

        // Tumble during free-fall
        this.rotation = 0;
        this.rotationSpeed = 0.18 + Math.random() * 0.1;

        this.spawnedAt = Date.now();
        this.parachuteDeployed = false;
    }

    /**
     * Has the pilot drifted off the bottom of the canvas?
     */
    public isOffScreen(): boolean {
        if (!this.canvas) return true;
        return this.y > this.canvas.height + 40;
    }

    /**
     * Update + draw the pilot (and parachute, once deployed).
     */
    public render() {
        if (this.ctx === null || this.canvas === null) return;

        this.update();

        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.save();
        this.ctx.translate(this.x, this.y);

        // Parachute is rendered before rotating the body so canopy stays upright.
        if (this.parachuteDeployed) {
            this.drawParachute();
        }

        this.ctx.save();
        this.ctx.rotate(this.rotation);
        this.drawPilotBody();
        this.ctx.restore();

        this.ctx.restore();
    }

    /**
     * Advance physics one frame.
     */
    protected update() {
        const elapsed = Date.now() - this.spawnedAt;

        if (!this.parachuteDeployed && elapsed >= Pilot.PARACHUTE_DEPLOY_DELAY_MS) {
            this.parachuteDeployed = true;
            this.rotation = 0;
            this.rotationSpeed = 0;
        }

        if (!this.parachuteDeployed) {
            // Free-fall: gravity accelerates downward, body tumbles.
            this.vy += Pilot.GRAVITY;
            this.rotation += this.rotationSpeed;
        } else {
            // Under canopy: lock to a slow constant descent. Horizontal
            // drift bleeds off so the pilot lands roughly under the canopy.
            this.vy = Pilot.PARACHUTE_FALL_SPEED;
            this.vx *= 0.94;
        }

        this.x += this.vx;
        this.y += this.vy;
    }

    /**
     * Stick-figure pilot in flight gear. Drawn at the local origin.
     */
    protected drawPilotBody() {
        const ctx = this.ctx!;

        // Helmet (head)
        ctx.beginPath();
        ctx.fillStyle = "#fbc02d"; // yellow flight helmet
        ctx.strokeStyle = "#212121";
        ctx.lineWidth = 1.5;
        ctx.arc(0, -8, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.closePath();

        // Visor strip
        ctx.beginPath();
        ctx.fillStyle = "rgba(33,33,33,0.85)";
        ctx.fillRect(-3.5, -9, 7, 1.5);
        ctx.closePath();

        // Torso (flight suit)
        ctx.beginPath();
        ctx.fillStyle = "#37474f";
        ctx.strokeStyle = "#1c2429";
        ctx.lineWidth = 1;
        ctx.moveTo(-4, -3);
        ctx.lineTo(4, -3);
        ctx.lineTo(3, 9);
        ctx.lineTo(-3, 9);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Harness strap on the chest
        ctx.beginPath();
        ctx.strokeStyle = "rgba(244,244,244,0.7)";
        ctx.lineWidth = 1;
        ctx.moveTo(-3, -2);
        ctx.lineTo(3, 8);
        ctx.moveTo(3, -2);
        ctx.lineTo(-3, 8);
        ctx.stroke();

        // Arms — out to the sides if hanging from a chute, otherwise down.
        ctx.beginPath();
        ctx.strokeStyle = "#37474f";
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        if (this.parachuteDeployed) {
            ctx.moveTo(-4, -2);
            ctx.lineTo(-9, 3);
            ctx.moveTo(4, -2);
            ctx.lineTo(9, 3);
        } else {
            ctx.moveTo(-4, -2);
            ctx.lineTo(-7, 5);
            ctx.moveTo(4, -2);
            ctx.lineTo(7, 5);
        }
        ctx.stroke();

        // Legs
        ctx.beginPath();
        ctx.strokeStyle = "#37474f";
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        ctx.moveTo(-2, 9);
        ctx.lineTo(-4, 17);
        ctx.moveTo(2, 9);
        ctx.lineTo(4, 17);
        ctx.stroke();

        // Boots
        ctx.beginPath();
        ctx.fillStyle = "#212121";
        ctx.fillRect(-5, 17, 3, 2);
        ctx.fillRect(2, 17, 3, 2);
        ctx.closePath();
    }

    /**
     * Red-striped parachute drawn above the pilot.
     */
    protected drawParachute() {
        const ctx = this.ctx!;
        const canopyR = 22;
        const canopyY = -22;
        const canopyTopY = canopyY - canopyR;

        // Strings from canopy edges to pilot's shoulders/hips
        ctx.strokeStyle = "rgba(50,50,50,0.85)";
        ctx.lineWidth = 1;
        const stringStarts = [-canopyR, -canopyR / 2, 0, canopyR / 2, canopyR];
        for (const sx of stringStarts) {
            // Approximate the canopy edge y-position at this x.
            const sy = canopyY + Math.sqrt(Math.max(0, canopyR * canopyR - sx * sx)) * 0; // edge along the diameter
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(sx * 0.15, -3);
            ctx.stroke();
        }

        // Canopy (red dome)
        ctx.beginPath();
        ctx.fillStyle = "#e53935";
        ctx.strokeStyle = "#b71c1c";
        ctx.lineWidth = 1.5;
        ctx.arc(0, canopyY, canopyR, Math.PI, 2 * Math.PI);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Vertical white panel stripes for that classic emergency-chute look
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        const stripeW = 4;
        for (const cx of [-canopyR / 2, canopyR / 2]) {
            // Clip stripe to dome shape via simple intersection: each stripe is
            // shorter the further from center.
            const localR = Math.sqrt(Math.max(0, canopyR * canopyR - cx * cx));
            ctx.fillRect(cx - stripeW / 2, canopyY - localR, stripeW, localR);
        }

        // Top highlight
        ctx.beginPath();
        ctx.strokeStyle = "rgba(255,255,255,0.45)";
        ctx.lineWidth = 1;
        ctx.arc(0, canopyY, canopyR - 3, Math.PI + 0.25, 2 * Math.PI - 0.25);
        ctx.stroke();

        // Tiny dome apex pinch
        ctx.beginPath();
        ctx.fillStyle = "#b71c1c";
        ctx.arc(0, canopyTopY + 1, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
    }
}
