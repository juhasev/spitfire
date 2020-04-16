import CloudInterface from "@/ts/Interfaces/CloudInterface";
import Plane from "@/ts/Plane";
import Bullet from "@/ts/Bullet";
import DistanceCalculator from "@/ts/DistanceCalculator";
import PointToLineDistanceCalculator from "@/ts/PointToLineDistanceCalculator";
import PositionCalculator from "@/ts/PositionCalculator";
import {Socket} from "socket.io";

export default class Sky {

    public gameOverHandler: () => void;

    private readonly canvas: HTMLCanvasElement;
    private readonly ctx: CanvasRenderingContext2D | null;
    private clouds: Array<CloudInterface>;
    private cloudsGrowing: boolean;
    private planes: Array<Plane>;
    private gameOver: boolean;
    private socket: Socket;

    /**
     * Sky constructor
     *
     * @param canvas
     */
    constructor(canvas: HTMLCanvasElement, socket: Socket) {

        this.ctx = canvas.getContext("2d");
        this.canvas = canvas;

        this.socket = socket;

        this.clouds = [];
        this.planes = [];
        this.cloudsGrowing = true;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.gameOver = false;
        this.gameOverHandler = () => {
        };
        this.designClouds();

        console.log("SKY INITIALIZED");
    }

    /**
     * Add plane
     *
     * @param plane
     */
    public addPlane(plane: Plane) {
        plane.setCanvas(this.canvas);
        this.planes.push(plane)
    }

    /**
     * Animation loop. This is where
     * everything gets drawn
     *
     */
    public animate() {

        if (this.gameOver) return;

        this.clearSky();

        this.planes.forEach((plane: Plane) => {

            if (plane.hasCrashed()) {
                plane.toggleSounds(false);
                if (this.gameOverHandler) this.gameOverHandler();
                this.gameOver = true;
            }

            if (!this.gameOver) {
                plane.draw();

                let enemyBullets = this.getEnemyBullets(plane.name);

                enemyBullets.forEach((bullet: Bullet) => {
                    this.detectBulletCollision(plane, bullet);
                });
            }
        });

        this.drawClouds();

        requestAnimationFrame(this.animate.bind(this));
    }

    /**
     * Get enemy bullets
     *
     * @param name
     */
    protected getEnemyBullets(name: string) {
        let bullets: Array<Bullet> = [];

        this.planes.forEach((planeOther: Plane) => {

            // Filter out friendly fire
            if (planeOther.name !== name) {
                bullets = [...bullets, ...planeOther.getBullets()];
            }
        });

        return bullets;
    }

    /**
     * Detect bullet hitting plane
     *
     * @param plane
     * @param bullet
     */
    protected detectBulletCollision(plane: Plane, bullet: Bullet) {
        const distance = new DistanceCalculator(plane.getX(), plane.getY(), bullet.getX(), bullet.getY()).getDistance();

        if (distance >= 40) return;

        // Calculate coordinates why past the place
        const position = new PositionCalculator(bullet.getX(), bullet.getY(), 100, bullet.getDirection());

        // Figure out how close the bullet is hitting from plane's center point
        const closestDistance = new PointToLineDistanceCalculator(plane.getX(), plane.getY(), bullet.getX(), bullet.getY(), position.getNewX(), position.getNewY()).getDistance();

        // More damage the closer the plane centerpoint
        const damage = Math.round(40 - closestDistance);

        plane.addDamage(damage);
        bullet.hit();

        console.log("Damage (" + damage + ") to plane " + plane.name);
    }

    /**
     * Clear canvas
     */
    public clearSky() {
        this.ctx!.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx!.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Draw all the clouds
     *
     */
    public drawClouds() {

        let maxCloudSize: number = 0;

        this.clouds.forEach((cloud: CloudInterface) => {

            this.drawCloud(
                cloud.size,
                cloud.x,
                cloud.y,
                cloud.startAngle,
                cloud.endAngle
            );

            if (cloud.size > maxCloudSize) maxCloudSize = cloud.size;

            if (this.cloudsGrowing) {
                cloud.size += 0.02;
            } else {
                cloud.size -= 0.04;
            }
        });

        if (maxCloudSize > 150) this.cloudsGrowing = false;
        if (maxCloudSize < 100) this.cloudsGrowing = true;
    }

    /**
     * Draw single cloud
     *
     * @param size
     * @param x
     * @param y
     * @param startAngle
     * @param endAngle
     */

    protected drawCloud(size: number, x: number, y: number, startAngle: number, endAngle: number) {
        if (this.ctx) {
            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, startAngle, endAngle, true); // Outer circle
            this.ctx.fillStyle = "white";
            this.ctx.fill();
            this.ctx.fill();
            this.ctx.closePath();
        }
    }

    /**
     * Design clouds
     * TODO: Break in its own class
     */
    protected designClouds() {
        let horizontalPixelsRemaining = this.canvas.width;

        let y = 0;
        let x = 0;

        while (horizontalPixelsRemaining > 0) {
            const size = Math.floor(Math.random() * 100);
            horizontalPixelsRemaining -= size;

            x += size;

            this.clouds.push({
                size: size,
                x: x,
                y: y,
                startAngle: Math.PI,
                endAngle: Math.PI * 2
            });
            this.clouds.push({
                size: size,
                x: this.canvas.width - x,
                y: this.canvas.height,
                startAngle: Math.PI * 2,
                endAngle: Math.PI
            });
        }

        let verticalPixelsRemaining = this.canvas.height;

        y = 0;
        x = 0;

        while (verticalPixelsRemaining > 0) {
            const size = Math.floor(Math.random() * 100);
            verticalPixelsRemaining -= size;

            y += size;

            this.clouds.push({
                size: size,
                x: x,
                y: y,
                startAngle: 0,
                endAngle: Math.PI * 2
            });

            this.clouds.push({
                size: size,
                x: this.canvas.width,
                y: this.canvas.height - y,
                startAngle: 0,
                endAngle: -Math.PI * 2
            });
        }
    }
}

