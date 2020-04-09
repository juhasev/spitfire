import PositionCalculator from "@/ts/PositionCalculator";

export default class Bullet {

    static BULLET_SPEED = 25;

    private x: number;
    private y: number;
    private rotation: number;
    private ctx: CanvasRenderingContext2D | null;
    private canvas: HTMLCanvasElement | null;
    private hitTarget: boolean;

    /**
     * Bullet constructor
     *
     * @param canvas
     * @param x
     * @param y
     * @param rotation
     */
    constructor(canvas: HTMLCanvasElement, x: number, y: number, rotation: number) {
        this.x = x;
        this.y = y;
        this.rotation = rotation;
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.hitTarget = false;
    }

    public render()
    {
        this.move();

        if (this.ctx !== null && this.canvas !== null) {

            this.ctx!.setTransform(1, 0, 0, 1, 0, 0);
            this.ctx.beginPath();
            this.ctx.arc(this.x, this.y, 5, 0, 2 * Math.PI, false);
            this.ctx.fillStyle = 'black';
            this.ctx.fill();
            this.ctx.closePath();
        }
    }

    public hit()
    {
        this.hitTarget = true;
    }

    protected move()
    {
        let pos = new PositionCalculator(this.x, this.y, Bullet.BULLET_SPEED, this.rotation);
        this.x = pos.getNewX();
        this.y = pos.getNewY();
    }

    public isFlying()
    {
        if (this.x > this.canvas!.width) return false;
        if (this.x <0) return false;
        if (this.y > this.canvas!.height) return false;
        if (this.y < 0) return false;
        if (this.hitTarget) return false;

        return true;
    }

    public getX()
    {
        return this.x;
    }

    public getY()
    {
        return this.y;
    }
}