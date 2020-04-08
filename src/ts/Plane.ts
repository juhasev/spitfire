import PlaneTypeInterface from "@/ts/Interfaces/PlaneTypeInterface";

export default class Plane {

    public static planeTypes: Array<PlaneTypeInterface> = [
        {name: "mustang", image: '/plane.png'},
        {name: "spitfire", image: '/spitfire.png'},
        {name: "junker", image: '/junker.png'},
    ];

    public static directions: Array<Object> = [
        {name: "west", dx: 1.5, dy: 0, rotation: 45},
        {name: "northwest", dx: 1, dy: 1, rotation: 45},
        {name: "north", dx: 0, dy: 1.5, rotation: 0},
        {name: "northeast", dx: -1, dy: 1, rotation: -45},
        {name: "east", dx: -1.5, dy: 0, rotation: -90},
        {name: "southeast", dx: -1, dy: -1, rotation: -135},
        {name: "south", dx: -0, dy: -1.5, rotation: -180},
        {name: "southwest", dx: 1, dy: -1, rotation: 135}
    ];

    private speed: number;
    private x: number;
    private y: number;
    private dx: number;
    private dy: number;
    private audio: HTMLAudioElement;
    private image: HTMLImageElement;

    private worldWidth: number;
    private worldHeight: number;

    private width: number;
    private height: number;
    private scale: number;

    private directionIndex: number;
    private rotationRadian: number;
    private rotationDegrees: number;

    private ctx: CanvasRenderingContext2D | null;
    private canvas: HTMLCanvasElement | null;

    /**
     * Plane constructor
     *
     * @param type
     */
    constructor(type: string) {

        const specs = Plane.planeTypes.find((planeType: PlaneTypeInterface) => {
            return planeType.name === type;
        });

        this.image = new Image(); // Using optional size for image
        this.image.src = specs.image;

        this.speed = 5;

        this.worldHeight = 0;
        this.worldWidth = 0;

        this.x = 0;
        this.y = 0;
        this.dx = 0
        this.dy = 0;

        this.width = 100;
        this.height = 100;
        this.scale = 0.25;

        this.directionIndex = 0;
        this.rotationDegrees = 90;
        this.rotationRadian = 0;

        this.audio = new Audio("spitfire.mp3");

        this.ctx = null;
        this.canvas = null;

        this.updateDirection();
    }

    /**
     * Set canvas where the plane will be drawn to
     *
     * @param canvas
     */
    public setCanvas(canvas: HTMLCanvasElement)
    {
        this.worldHeight = canvas.height;
        this.worldWidth = canvas.width;

        this.x = canvas.height / 3;
        this.y = canvas.width / 3;

        this.ctx = canvas.getContext("2d");
        this.canvas = canvas;

        this.image.onload = () => {
            this.draw();
        };
    }

    /**
     * Toggle place sounds on/off
     *
     * @param sounds
     */
    public toggleSounds(sounds: boolean) {
        if (sounds) {
            this.audio.play();
        } else {
            this.audio.pause();
        }
    }

    /**
     * Steer plane to right
     */
    public steerRight()
    {
        if (this.directionIndex === 7) {
            this.directionIndex = 0;
        } else {
            this.directionIndex += 1;
        }
        this.rotationDegrees += 45;
        this.updateDirection();
    }

    /**
     * Steer plane to left
     */
    public steerLeft()
    {
        if (this.directionIndex === 0) {
            this.directionIndex = 7;
        } else {
            this.directionIndex -= 1;
        }
        this.rotationDegrees -= 45;
        this.updateDirection();
    }

    /**
     * Draw the place
     */
    public draw()
    {
        if (this.ctx !== null && this.canvas !==null) {

            this.ctx.beginPath();
            this.ctx.setTransform(this.scale, 0, 0, this.scale, this.x, this.y); // sets scale and origin
            this.ctx.rotate(this.rotationRadian);
            this.ctx.drawImage(
                this.image,
                -this.image.width / 2,
                -this.image.height / 2
            );
            this.ctx.closePath();
        }

        // Going right
        if (this.dx > 0 && this.x > this.canvas.width + this.width / 2) {
            this.x = -this.width / 2;
            if (this.audio) {
                this.audio.currentTime = 0;
            }
        }

        // Going left
        if (this.dx < 0 && this.x < -this.width / 2) {
            this.x = this.canvas.width + this.width / 2;
            if (this.audio) this.audio.currentTime = 0;
        }

        // Going down
        if (this.dy > 0 && this.y > this.canvas.height + this.height / 2) {
            this.y = -this.height / 2;
            if (this.audio) this.audio.currentTime = 0;
        }

        // Going up
        if (this.dy < 0 && this.y < -this.height / 2) {
            this.y = this.canvas.height + this.height / 2;
            if (this.audio) this.audio.currentTime = 0;
        }

        this.x += this.dx;
        this.y += this.dy;

        this.calculateVolume();
    }

    /**
     * Calculate volume for th plane
     *
     */
    protected  calculateVolume() {

        if (this.audio) {

            let volume = 0;

            if (this.x < this.canvas.width / 2) {
                volume = this.x / this.canvas.width / 2;
            }

            if (this.x > this.canvas.width / 2) {
                volume = (this.canvas.width - this.x) / this.canvas.width / 2;
            }

            volume += 0.2;

            if (volume > 1) volume = 1;
            if (volume < 0) volume = 0;

            this.audio.volume = volume;
        }
    }

    /**
     * Update direction
     *
     */
    protected updateDirection() {
        this.dx = Plane.directions[this.directionIndex].dx * this.speed;
        this.dy = Plane.directions[this.directionIndex].dy * this.speed;
        this.rotationRadian = (this.rotationDegrees * Math.PI) / 180;
    }
}