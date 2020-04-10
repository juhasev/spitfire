export default class SmokeCloud {

    public x: number;
    public y: number;

    private readonly ctx: CanvasRenderingContext2D | null;
    private readonly canvas: HTMLCanvasElement | null;

    private visible: boolean;
    private radius: number;
    private opacity: number;
    private intensity: number;

    /**
     * Bullet constructor
     *
     * @param canvas
     * @param x
     * @param y
     * @param directionDegrees
     */
    constructor(canvas: HTMLCanvasElement, x: number, y: number, intensity: number) {

        const xVariation = Math.round(Math.random() * 10);
        const yVariation = Math.round(Math.random() * 10);

        this.x = x + xVariation;
        this.y = y + yVariation;

        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");

        this.visible = true;

        this.radius = 30 * intensity / 100;
        this.opacity = intensity / 100;
        this.intensity = intensity;

        setInterval(() => {
            this.fadeCloud();
        }, 75);
    }

    /**
     * Is cloud visible
     */

    public isVisible() {
        return this.visible;
    }

    /**
     * Fade cloud
     */
    protected fadeCloud()
    {
        this.radius -= 1;
        this.opacity -= 0.04;

        if (this.opacity < 0) {
            this.visible = false;
            this.opacity = 0;
        }

        if (this.radius < 1) {
            this.visible = false;
            this.radius = 1;
        }
    }

    /**
     * Render smoke cloud
     */
    public render() {
        if (this.ctx !== null && this.canvas !== null && this.visible) {

            this.ctx!.setTransform(1, 0, 0, 1, 0, 0);
            this.ctx.beginPath();

            const gradient = this.ctx.createRadialGradient(this.x, this.y, 1, this.x, this.y, this.radius);
            gradient.addColorStop(1, this.intensityColor(0));
            gradient.addColorStop(0, this.intensityColor(this.opacity));

            this.ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);

            this.ctx.fillStyle = gradient;
            this.ctx.fill();

            this.ctx.closePath();
        }
    }

    /**
     * Calculate intensity color
     */
    protected intensityColor(opacity: number)
    {
        return 'rgba(' +
            (150 - this.intensity) + ',' +
            (150 - this.intensity) + ',' +
            (150 - this.intensity) + ',' +
            opacity + ')';
    }
}