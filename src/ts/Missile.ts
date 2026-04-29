import PositionCalculator from "@/ts/PositionCalculator";
import MissileTargetInterface from "@/ts/Interfaces/MissileTargetInterface";

export default class Missile {

    static MISSILE_SPEED = 24;
    static MISSILE_DAMAGE_RADIUS = 50;

    /**
     * Max degrees the missile can turn per frame. The plane turns 2 deg/frame
     * via incrementDirection(2)/decrementDirection(2), so the missile turns
     * at half of that.
     */
    static TURN_RATE_DEGREES = 1;

    public x: number;
    public y: number;

    private directionDegrees: number;
    private ctx: CanvasRenderingContext2D | null;
    private canvas: HTMLCanvasElement | null;
    private hitTarget: boolean;
    private trail: Array<{x: number, y: number, age: number}>;
    private target: MissileTargetInterface | null;

    /**
     * Missile constructor
     *
     * @param canvas
     * @param x
     * @param y
     * @param directionDegrees
     * @param target Optional target the missile will home in on
     */
    constructor(
        canvas: HTMLCanvasElement,
        x: number,
        y: number,
        directionDegrees: number,
        target: MissileTargetInterface | null = null
    ) {
        this.x = x;
        this.y = y;
        this.directionDegrees = directionDegrees;
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.hitTarget = false;
        this.trail = [];
        this.target = target;
    }

    /**
     * Render missile
     */
    public render() {
        this.move();

        if (this.ctx !== null && this.canvas !== null) {

            this.ctx.setTransform(1, 0, 0, 1, 0, 0);

            // Draw smoke trail
            this.trail.forEach((point) => {
                const opacity = Math.max(0, 1 - point.age / 20);
                const radius = Math.max(1, 6 - point.age / 4);
                this.ctx!.beginPath();
                this.ctx!.arc(point.x, point.y, radius, 0, 2 * Math.PI, false);
                this.ctx!.fillStyle = 'rgba(120,120,120,' + opacity * 0.6 + ')';
                this.ctx!.fill();
                this.ctx!.closePath();
                point.age += 1;
            });

            // Draw missile body (rotated rectangle with a triangular tip)
            const radians = (this.directionDegrees * Math.PI) / 180;
            this.ctx.save();
            this.ctx.translate(this.x, this.y);
            this.ctx.rotate(radians);

            // Body
            this.ctx.beginPath();
            this.ctx.fillStyle = '#444';
            this.ctx.fillRect(-10, -3, 16, 6);

            // Nose cone
            this.ctx.beginPath();
            this.ctx.moveTo(6, -3);
            this.ctx.lineTo(12, 0);
            this.ctx.lineTo(6, 3);
            this.ctx.closePath();
            this.ctx.fillStyle = '#b71c1c';
            this.ctx.fill();

            // Fins
            this.ctx.beginPath();
            this.ctx.moveTo(-10, -3);
            this.ctx.lineTo(-14, -6);
            this.ctx.lineTo(-8, -3);
            this.ctx.closePath();
            this.ctx.fillStyle = '#222';
            this.ctx.fill();

            this.ctx.beginPath();
            this.ctx.moveTo(-10, 3);
            this.ctx.lineTo(-14, 6);
            this.ctx.lineTo(-8, 3);
            this.ctx.closePath();
            this.ctx.fillStyle = '#222';
            this.ctx.fill();

            this.ctx.restore();
        }

        // Trim trail
        this.trail = this.trail.filter(p => p.age < 25);
    }

    /**
     * Collision
     */
    public hit() {
        this.hitTarget = true;
    }

    /**
     * Move missile. Each frame the missile steers up to TURN_RATE_DEGREES
     * toward its target (if it has one and the target is still alive).
     */
    protected move() {
        // Add trail point at current location before moving
        this.trail.push({x: this.x, y: this.y, age: 0});

        // Home in on the target by adjusting direction toward it
        this.steerTowardTarget();

        const pos = new PositionCalculator(this.x, this.y, Missile.MISSILE_SPEED, this.directionDegrees);
        this.x = pos.getNewX();
        this.y = pos.getNewY();
    }

    /**
     * Adjust direction up to TURN_RATE_DEGREES toward the active target.
     */
    protected steerTowardTarget() {
        if (this.target === null) return;
        if (this.target.hasCrashed()) return;

        const dx = this.target.getX() - this.x;
        const dy = this.target.getY() - this.y;

        // Avoid undefined behavior when right on top of the target
        if (dx === 0 && dy === 0) return;

        // atan2 gives radians using same convention as PositionCalculator
        // (0 deg = +x, 90 deg = +y) since canvas y grows downward.
        const targetDeg = (Math.atan2(dy, dx) * 180) / Math.PI;

        // Shortest signed angle from current direction to target direction
        let delta = ((targetDeg - this.directionDegrees + 540) % 360) - 180;

        const turnRate = Missile.TURN_RATE_DEGREES;
        if (delta > turnRate) delta = turnRate;
        if (delta < -turnRate) delta = -turnRate;

        this.directionDegrees += delta;
        if (this.directionDegrees < 0) this.directionDegrees += 360;
        if (this.directionDegrees >= 360) this.directionDegrees -= 360;
    }

    /**
     * Is missile still flying
     */
    public isFlying() {
        if (this.hitTarget) return false;
        if (!this.canvas) return false;
        if (this.x > this.canvas.width + 50) return false;
        if (this.x < -50) return false;
        if (this.y > this.canvas.height + 50) return false;
        if (this.y < -50) return false;

        return true;
    }

    /**
     * Get X coordinate
     */
    public getX() {
        return this.x;
    }

    /**
     * Get Y Coordinate
     */
    public getY() {
        return this.y;
    }

    /**
     * Get rotation angle
     */
    public getDirection() {
        return this.directionDegrees;
    }
}
