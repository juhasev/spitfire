import PlaneTypeInterface from "@/ts/Interfaces/PlaneTypeInterface";
import PlaneSettingsInterface from "@/ts/Interfaces/PlaneSettingsInterface";
import PositionCalculator from "@/ts/PositionCalculator";

export default class Plane {

    /**
     * Rotate image degrees to set it to rotation 0 in the sky
     */
    static IMAGE_ROTATION_DEGREES: number = 90;

    public static planeTypes: Array<PlaneTypeInterface> = [
        {name: "mustang", image: '/plane.png', audio: "spitfire.mp3"},
        {name: "spitfire", image: '/spitfire.png', audio: "spitfire.mp3"},
        {name: "junker", image: '/junker.png', audio: "spitfire.mp3"},
    ];

    public health: number;

    private speed: number;
    private x: number;
    private y: number;
    private audio: HTMLAudioElement;
    private image: HTMLImageElement;

    private width: number;
    private height: number;
    private scale: number;

    private rotationDegrees: number;

    private ctx: CanvasRenderingContext2D | null;
    private canvas: HTMLCanvasElement | null;

    /**
     * Plane constructor
     *
     * @param type
     */
    constructor(type: string, settings: PlaneSettingsInterface) {

        const specs = Plane.planeTypes.find((planeType: PlaneTypeInterface) => {
            return planeType.name === type;
        });

        this.image = new Image(); // Using optional size for image
        this.image.src = specs!.image;

        this.speed = settings.speed;

        this.x = settings.x;
        this.y = settings.y;

        this.width = settings.width;
        this.height = settings.height;
        this.scale = settings.scale;

        this.rotationDegrees = settings.rotationDegrees;
        this.audio = new Audio(specs!.audio);

        this.ctx = null;
        this.canvas = null;

        this.health = settings.health;
    }

    /**
     * Set canvas where the plane will be drawn to
     *
     * @param canvas
     */
    public setCanvas(canvas: HTMLCanvasElement) {

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
     * Fire a bullet
     */
    public fire() {
        console.log('Firing');
    }

    /**
     * Steer plane to right
     */
    public right() {
        if (this.rotationDegrees === 360) {
            this.rotationDegrees = 0;
        }

        this.rotationDegrees += 45;
    }

    /**
     * Steer plane to left
     */
    public left() {
        if (this.rotationDegrees === 0) {
            this.rotationDegrees = 360;
        }
        this.rotationDegrees -= 45;
    }

    /**
     * Draw the place
     */
    public draw() {
        if (this.ctx !== null && this.canvas !== null) {

            this.ctx.beginPath();
            this.ctx.setTransform(this.scale, 0, 0, this.scale, this.x, this.y); // sets scale and origin
            this.ctx.rotate(this.getImageRotation());
            this.ctx.drawImage(
                this.image,
                -this.image.width / 2,
                -this.image.height / 2
            );
            this.ctx.closePath();
        }

        this.move();
        this.calculateVolume();
    }

    /**
     * Move the plane
     *
     */

    protected move() {

        let pos = new PositionCalculator(this.x, this.y, this.speed, this.rotationDegrees);

        this.x = pos.getNewX();
        this.y = pos.getNewY();

        this.detectBoundaries();

    }

    /**
     * Detect boundary collisions
     * TODO: Refactor in its own class
     */
    protected detectBoundaries()
    {
        // Right boundary
        if (this.x > this.canvas!.width + this.width / 2) {
            this.x = -this.width / 2;
            this.restartAudio();
        }

        // Left boundary
        if (this.x < -this.width / 2) {
            this.x = this.canvas!.width + this.width / 2;
            this.restartAudio();
        }

        // Going down
        if (this.y > this.canvas!.height + this.height / 2) {
            this.y = -this.height / 2;
            this.restartAudio();
        }

        // Going up
        if (this.y < -this.height / 2) {
            this.y = this.canvas!.height + this.height / 2;
            this.restartAudio();
        }
    }


    /**
     * Restart audio when plane appears again
     */
    protected restartAudio()
    {
        if (this.audio) this.audio.currentTime = 0;
    }

    /**
     * Calculate volume for th plane
     *
     */
    protected calculateVolume() {

        if (this.audio) {

            let volume = 0;

            if (this.x < this.canvas!.width / 2) {
                volume = this.x / this.canvas!.width / 2;
            }

            if (this.x > this.canvas!.width / 2) {
                volume = (this.canvas!.width - this.x) / this.canvas!.width / 2;
            }

            volume += 0.2;

            if (volume > 1) volume = 1;
            if (volume < 0) volume = 0;

            this.audio.volume = volume;
        }
    }

    /**
     * Get plane image rotation
     */
    protected getImageRotation() {
        return ((this.rotationDegrees + Plane.IMAGE_ROTATION_DEGREES) * Math.PI) / 180;
    }
}