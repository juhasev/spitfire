import PlaneTypeInterface from "@/ts/Interfaces/PlaneTypeInterface";
import PlaneSettingsInterface from "@/ts/Interfaces/PlaneSettingsInterface";
import PositionCalculator from "@/ts/PositionCalculator";
import Bullet from "@/ts/Bullet";

export default class Plane {

    /**
     * Rotate image degrees to set it to rotation 0 in the sky
     */
    static IMAGE_ROTATION_DEGREES: number = 90;

    public static planeTypes: Array<PlaneTypeInterface> = [
        {name: "mustang", image: '/plane.png', audio: "spitfire.mp3"},
        {name: "spitfire", image: '/spitfire.png', audio: "spitfire2.mp3"},
        {name: "junker", image: '/junker.png', audio: "spitfire2.mp3"},
    ];

    public name: string;

    public health: number;
    public crashed: boolean;

    private fallingOutOfSky: boolean;

    private speed: number;
    private x: number;
    private y: number;
    private audio: HTMLAudioElement;
    private crashAudio: HTMLAudioElement;
    private hitAudio: HTMLAudioElement;
    private gunAudio: HTMLAudioElement;

    private image: HTMLImageElement;

    private width: number;
    private height: number;
    private scale: number;

    private bullets: Array<Bullet>;
    private canFire: boolean;

    private rotationDegrees: number;

    private ctx: CanvasRenderingContext2D | null;
    private canvas: HTMLCanvasElement | null;

    /**
     * Plane constructor
     *
     * @param type
     * @param settings
     */
    constructor(type: string, settings: PlaneSettingsInterface) {

        const specs = Plane.planeTypes.find((planeType: PlaneTypeInterface) => {
            return planeType.name === type;
        });

        this.name = specs!.name;

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
        this.crashAudio = new Audio('./plane_crash.wav');
        this.hitAudio = new Audio('./bullet_hit.wav');
        this.hitAudio.volume = 0.3;
        this.gunAudio = new Audio('./gun_fire.wav');
        this.gunAudio.volume = 0.3;

        this.ctx = null;
        this.canvas = null;

        this.health = settings.health;
        this.bullets = [];

        this.fallingOutOfSky = false;
        this.crashed = false;

        this.canFire = true;
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

        if (this.canFire) {

            this.canFire = false;

            setTimeout(() => {
                this.canFire = true;
            }, 500);

            this.gunAudio.currentTime = 0;
            this.gunAudio.play();

            if (this.canvas) {
                this.bullets.push(new Bullet(this.canvas, this.x, this.y, this.rotationDegrees));
            }
        }
    }

    /**
     * Steer plane to right
     */
    public right() {

        if (this.fallingOutOfSky) return;

        if (this.rotationDegrees === 360) {
            this.rotationDegrees = 0;
        }

        this.rotationDegrees += 3;
    }

    /**
     * Steer plane to left
     */
    public left() {

        if (this.fallingOutOfSky) return;

        if (this.rotationDegrees === 0) {
            this.rotationDegrees = 360;
        }
        this.rotationDegrees -= 3;
    }

    public addDamage(damage: number) {

        this.hitAudio.currentTime = 0;
        this.hitAudio.play();

        if (damage > this.health) {
            this.health = 0;
        } else {
            this.health -= damage;
        }

        if (this.health === 0) {
            this.fallingOutOfSky = true;
            this.audio.pause();
            this.crashAudio.play();
        }
    }

    public getBullets() {
        return this.bullets;
    }

    public hasCrashed() {
        return this.crashed;
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

        this.bullets.forEach((bullet) => {
            bullet.render();
        });

        // Remove bullets no longer flying
        this.bullets = this.bullets.filter(bullet => {
            return bullet.isFlying();
        });

        if (this.fallingOutOfSky) {
            if (this.rotationDegrees !== 90) {
                if (this.rotationDegrees < 90) {
                    this.rotationDegrees += 1;
                    this.speed = this.speed + 0.1;
                }

                if (this.rotationDegrees > 90) {
                    this.rotationDegrees -= 1;
                    this.speed = this.speed + 0.1;
                }
            }

            setTimeout(() => {
                this.crashed = true;
            }, 8000);
        }

        this.move();
        this.calculateVolume();
    }

    public getX() {
        return this.x;
    }

    public getY() {
        return this.y;
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
    protected detectBoundaries() {
        if (this.fallingOutOfSky) {
            if (this.audio.playbackRate < 2) {
                this.audio.playbackRate += 0.1;
            }
            return;
        }

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
    protected restartAudio() {
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