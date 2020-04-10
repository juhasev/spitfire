import PositionCalculator from "@/ts/PositionCalculator";

export default class Bullet {

    static BULLET_SPEED = 25;

    public x: number;
    public y: number;

    private directionDegrees: number;
    private ctx: CanvasRenderingContext2D | null;
    private canvas: HTMLCanvasElement | null;
    private hitTarget: boolean;

    private invisible: boolean;

    /**
     * Bullet constructor
     *
     * @param canvas
     * @param x
     * @param y
     * @param directionDegrees
     */
    constructor(canvas: HTMLCanvasElement, x: number, y: number, directionDegrees: number) {
        this.x = x;
        this.y = y;
        this.directionDegrees = directionDegrees;
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.hitTarget = false;

    }

    /**
     * Render bullet
     */
    public render()
    {
        this.move();

        if (this.ctx !== null && this.canvas !== null) {

            this.ctx!.setTransform(1, 0, 0, 1, 0, 0);
            this.ctx.beginPath();
            this.ctx.arc(this.x, this.y, 3, 0, 2 * Math.PI, false);
            this.ctx.fillStyle = 'black';
            this.ctx.fill();
            this.ctx.closePath();
        }
    }

    /**
     * Collision
     */
    public hit()
    {
        this.hitTarget = true;
    }

    /**
     * Move bullet
     */
    protected move()
    {
        let pos = new PositionCalculator(this.x, this.y, Bullet.BULLET_SPEED, this.directionDegrees);
        this.x = pos.getNewX();
        this.y = pos.getNewY();
    }

    /**
     * Is bullet still flying
     */
    public isFlying()
    {
        if (this.x > this.canvas!.width) return false;
        if (this.x <0) return false;
        if (this.y > this.canvas!.height) return false;
        if (this.y < 0) return false;
        if (this.hitTarget) return false;

        return true;
    }

    /**
     * Get X coordinate
     */
    public getX()
    {
        return this.x;
    }

    /**
     * Get Y Coordinate
     */
    public getY()
    {
        return this.y;
    }

    /**
     * Get rotation angle
     */
    public getDirection()
    {
        return this.directionDegrees;
    }
}