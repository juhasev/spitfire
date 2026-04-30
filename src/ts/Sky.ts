import CloudInterface from "@/ts/Interfaces/CloudInterface";
import Plane from "@/ts/Plane";
import Bullet from "@/ts/Bullet";
import Missile from "@/ts/Missile";
import MissilePickup from "@/ts/MissilePickup";
import HealthKitPickup from "@/ts/HealthKitPickup";
import Explosion from "@/ts/Explosion";
import DistanceCalculator from "@/ts/DistanceCalculator";
import PointToLineDistanceCalculator from "@/ts/PointToLineDistanceCalculator";
import PositionCalculator from "@/ts/PositionCalculator";
import {Socket} from "socket.io";

export default class Sky {

    public gameOverHandler: () => void;

    /**
     * Min/max delay (ms) between random missile pickup spawns
     */
    static PICKUP_MIN_DELAY = 6000;
    static PICKUP_MAX_DELAY = 14000;

    /**
     * Health threshold below which health kits become eligible to spawn,
     * and the cooldown between successive kit spawns.
     */
    static HEALTH_KIT_HEALTH_THRESHOLD = 50;
    static HEALTH_KIT_COOLDOWN_MS = 8000;

    private readonly canvas: HTMLCanvasElement;
    private readonly ctx: CanvasRenderingContext2D | null;
    private clouds: Array<CloudInterface>;
    private cloudsGrowing: boolean;
    private planes: Array<Plane>;
    private gameOver: boolean;
    private socket: Socket;
    private missilePickups: Array<MissilePickup>;
    private nextPickupAt: number;
    private healthKitPickups: Array<HealthKitPickup>;
    private nextHealthKitAt: number;
    private explosions: Array<Explosion>;

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
        this.missilePickups = [];
        this.nextPickupAt = Date.now() + this.randomPickupDelay();
        this.healthKitPickups = [];
        this.nextHealthKitAt = 0; // armed immediately; health gate decides
        this.explosions = [];
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
        this.planes.push(plane);

        // Refresh each plane's enemy list so missiles fired by any plane
        // know who to home in on.
        this.planes.forEach((p) => {
            p.setEnemies(this.planes.filter((other) => other !== p));
        });
    }

    /**
     * Animation loop. This is where
     * everything gets drawn
     *
     */
    public animate() {

        if (this.gameOver) return;

        this.clearSky();

        // Maybe spawn pickups, then render existing ones (under planes/clouds).
        // Health kits only spawn when at least one plane is below the threshold.
        this.maybeSpawnMissilePickup();
        this.maybeSpawnHealthKit();
        this.renderMissilePickups();
        this.renderHealthKits();

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

                let enemyMissiles = this.getEnemyMissiles(plane.name);

                enemyMissiles.forEach((missile: Missile) => {
                    this.detectMissileCollision(plane, missile);
                });

                // Plane collects any pickup it touches
                this.detectMissilePickupCollection(plane);
                this.detectHealthKitCollection(plane);
            }
        });

        // Drop pickups that were collected or expired
        this.missilePickups = this.missilePickups.filter(p => p.isActive());

        // Health kits: when a kit just left the field, arm a cooldown so the
        // next one doesn't appear instantly the moment health is still low.
        const kitsBefore = this.healthKitPickups.length;
        this.healthKitPickups = this.healthKitPickups.filter(p => p.isActive());
        if (kitsBefore > 0 && this.healthKitPickups.length === 0) {
            this.nextHealthKitAt = Date.now() + Sky.HEALTH_KIT_COOLDOWN_MS;
        }

        // Render explosions on top of planes/projectiles, then prune the dead ones
        this.explosions.forEach(e => e.render());
        this.explosions = this.explosions.filter(e => e.isVisible());

        this.drawClouds();

        requestAnimationFrame(this.animate.bind(this));
    }

    /**
     * Random delay before next pickup spawn
     */
    protected randomPickupDelay() {
        return Sky.PICKUP_MIN_DELAY + Math.random() * (Sky.PICKUP_MAX_DELAY - Sky.PICKUP_MIN_DELAY);
    }

    /**
     * Spawn a new missile pickup if it's time. Pickups spawn inside the
     * central 50% of the screen (25% margin on each axis) so they stay
     * clear of the cloud bands that hug the four edges of the canvas.
     */
    protected maybeSpawnMissilePickup() {
        if (Date.now() < this.nextPickupAt) return;

        // Cap concurrent pickups so the screen doesn't get cluttered
        if (this.missilePickups.length >= 3) {
            this.nextPickupAt = Date.now() + this.randomPickupDelay();
            return;
        }

        const marginX = this.canvas.width * 0.25;
        const marginY = this.canvas.height * 0.25;
        const x = marginX + Math.random() * (this.canvas.width - marginX * 2);
        const y = marginY + Math.random() * (this.canvas.height - marginY * 2);
        this.missilePickups.push(new MissilePickup(this.canvas, x, y));
        this.nextPickupAt = Date.now() + this.randomPickupDelay();
    }

    /**
     * Render all active missile pickups
     */
    protected renderMissilePickups() {
        this.missilePickups.forEach(p => p.render());
    }

    /**
     * Detect plane touching a missile pickup and award a missile
     */
    protected detectMissilePickupCollection(plane: Plane) {
        this.missilePickups.forEach((pickup: MissilePickup) => {
            if (!pickup.isActive()) return;
            const distance = new DistanceCalculator(plane.getX(), plane.getY(), pickup.getX(), pickup.getY()).getDistance();
            if (distance < pickup.getRadius() + 25) {
                pickup.collect();
                plane.collectMissile();
            }
        });
    }

    /**
     * Spawn a health kit if (a) no kit is currently on screen, (b) the
     * spawn cooldown has elapsed, and (c) at least one alive plane has
     * dropped below the health threshold. Kits spawn in the central 50%
     * of the canvas, away from the cloud bands.
     */
    protected maybeSpawnHealthKit() {
        if (this.healthKitPickups.length > 0) return;
        if (Date.now() < this.nextHealthKitAt) return;

        const anyHurt = this.planes.some(p =>
            p.health > 0 && p.health < Sky.HEALTH_KIT_HEALTH_THRESHOLD
        );
        if (!anyHurt) return;

        const marginX = this.canvas.width * 0.25;
        const marginY = this.canvas.height * 0.25;
        const x = marginX + Math.random() * (this.canvas.width - marginX * 2);
        const y = marginY + Math.random() * (this.canvas.height - marginY * 2);
        this.healthKitPickups.push(new HealthKitPickup(this.canvas, x, y));
    }

    /**
     * Render all active health kits.
     */
    protected renderHealthKits() {
        this.healthKitPickups.forEach(p => p.render());
    }

    /**
     * Detect plane touching a health kit and award the heal.
     */
    protected detectHealthKitCollection(plane: Plane) {
        this.healthKitPickups.forEach((pickup: HealthKitPickup) => {
            if (!pickup.isActive()) return;
            const distance = new DistanceCalculator(
                plane.getX(), plane.getY(),
                pickup.getX(), pickup.getY()
            ).getDistance();
            if (distance < pickup.getRadius() + 25) {
                pickup.collect();
                plane.collectHealthKit(HealthKitPickup.HEAL_AMOUNT);
            }
        });
    }

    /**
     * Get missiles fired by enemy planes (anyone other than `name`)
     */
    protected getEnemyMissiles(name: string) {
        let missiles: Array<Missile> = [];

        this.planes.forEach((planeOther: Plane) => {
            if (planeOther.name !== name) {
                missiles = [...missiles, ...planeOther.getMissiles()];
            }
        });

        return missiles;
    }

    /**
     * Detect missile hitting a plane. Missiles do area damage based on
     * how close the plane is to the missile center.
     */
    protected detectMissileCollision(plane: Plane, missile: Missile) {
        const distance = new DistanceCalculator(plane.getX(), plane.getY(), missile.getX(), missile.getY()).getDistance();
        if (distance >= Missile.MISSILE_DAMAGE_RADIUS) return;

        // Damage scales from 80 (direct hit) to ~30 at the edge of the radius
        const damage = Math.round(80 - (distance / Missile.MISSILE_DAMAGE_RADIUS) * 50);
        plane.addDamage(damage);
        missile.hit();

        // Spawn an explosion animation centered on the missile impact point.
        // Direct hits get a slightly bigger blast.
        const intensity = 0.85 + (1 - distance / Missile.MISSILE_DAMAGE_RADIUS) * 0.5;
        this.explosions.push(new Explosion(this.canvas, missile.getX(), missile.getY(), intensity));

        console.log("Missile damage (" + damage + ") to plane " + plane.name);
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

