<template>
    <div>
        <keypress :key-code="37" event="keydown" @pressed="leftPressed"/>
        <keypress :key-code="39" event="keydown" @pressed="rightPressed"/>
        <keypress :key-code="36" event="keydown" @pressed="downPressed"/>
        <keypress :key-code="38" event="keydown" @pressed="upPressed"/>

        <div class="debug">
            <v-btn color="primary" @click="audio.play()">Sounds</v-btn>
        </div>
        <canvas class="sky" ref="sky"></canvas>
    </div>
</template>

<script>

    import Greeter from "@/ts/Greeter";

    export default {
        name: "Spitfire",
        props: {
            msg: String
        },

        components: {
            Keypress: () => import("vue-keypress")
        },

        data() {
            return {
                cloudsGrowing: true,
                volume: 0,
                audio: null,
                ctx: null,
                canvas: null,
                speed: 5,
                image: null,
                x: null,
                y: null,
                dx: null,
                dy: null,
                rotation: null,
                angle: null,

                plane: {
                    w: 100,
                    h: 100
                },

                scale: 0.25,

                clouds: [],

                currentDirection: null,

                directions: [
                    {name: "west", dx: 1.5, dy: 0, rotation: 45},
                    {name: "northwest", dx: 1, dy: 1, rotation: 45},
                    {name: "north", dx: 0, dy: 1.5, rotation: 0},
                    {name: "northeast", dx: -1, dy: 1, rotation: -45},
                    {name: "east", dx: -1.5, dy: 0, rotation: -90},
                    {name: "southeast", dx: -1, dy: -1, rotation: -135},
                    {name: "south", dx: -0, dy: -1.5, rotation: -180},
                    {name: "southwest", dx: 1, dy: -1, rotation: 135}
                ]
            };
        },

        mounted() {

            let note = new Greeter("HELLO");
            note.greet();

            this.volume = 0;
            this.audio = new Audio("spitfire.mp3");
            this.audio.play();

            this.ctx = this.$refs.sky.getContext("2d");
            this.canvas = this.$refs.sky;

            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;

            this.x = this.canvas.width / 2;
            this.y = this.canvas.height / 2;
            this.dx = 2;
            this.dy = 0;

            this.currentDirection = 0;
            this.angle = 90;
            this.updateDirection();
            this.designClouds();

            this.image = new Image(); // Using optional size for image

            this.image.src = "/plane.png";
            this.image.onload = () => {
                this.draw();
            };
        },

        methods: {
            downPressed() {
                if (this.speed > 1) this.speed -= 1;
            },

            upPressed() {
                if (this.speed < 10) this.speed += 1;
            },

            rightPressed() {
                if (this.currentDirection === 7) {
                    this.currentDirection = 0;
                } else {
                    this.currentDirection += 1;
                }
                this.angle += 45;
                this.updateDirection();
            },

            leftPressed() {
                if (this.currentDirection === 0) {
                    this.currentDirection = 7;
                } else {
                    this.currentDirection -= 1;
                }
                this.angle -= 45;
                this.updateDirection();
            },

            updateDirection() {
                this.dx = this.directions[this.currentDirection].dx * this.speed;
                this.dy = this.directions[this.currentDirection].dy * this.speed;
                this.rotation = (this.angle * Math.PI) / 180;
            },

            draw() {
                this.ctx.setTransform(1, 0, 0, 1, 0, 0);
                //this.ctx.fillStyle = "blue";
                //this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

                this.ctx.beginPath();
                this.ctx.setTransform(this.scale, 0, 0, this.scale, this.x, this.y); // sets scale and origin
                this.ctx.rotate(this.rotation);
                this.ctx.drawImage(
                    this.image,
                    -this.image.width / 2,
                    -this.image.height / 2
                );
                this.ctx.closePath();

                // Going right
                if (this.dx > 0 && this.x > this.canvas.width + this.plane.w / 2) {
                    this.x = -this.plane.w / 2;
                    if (this.audio) {
                        this.audio.currentTime = 0;
                    }
                }

                // Going left
                if (this.dx < 0 && this.x < -this.plane.w / 2) {
                    this.x = this.canvas.width + this.plane.w / 2;
                    if (this.audio) this.audio.currentTime = 0;
                }

                // Going down
                if (this.dy > 0 && this.y > this.canvas.height + this.plane.h / 2) {
                    this.y = -this.plane.h / 2;
                    if (this.audio) this.audio.currentTime = 0;
                }

                // Going up
                if (this.dy < 0 && this.y < -this.plane.h / 2) {
                    this.y = this.canvas.height + this.plane.h / 2;
                    if (this.audio) this.audio.currentTime = 0;
                }

                this.x += this.dx;
                this.y += this.dy;

                this.drawClouds();

                this.calculateVolume();

                requestAnimationFrame(this.draw);
            },

            designClouds() {
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
            },

            drawClouds() {

                let maxCloudSize = null;

                this.clouds.forEach(cloud => {
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

                if (maxCloudSize > 150) this.cloudsGrowing=false;
                if (maxCloudSize < 100) this.cloudsGrowing=true;
            },

            drawCloud(size, x, y, startAngle, endAngle) {
                this.ctx.setTransform(1, 0, 0, 1, 0, 0);
                this.ctx.beginPath();
                this.ctx.arc(x, y, size, startAngle, endAngle, true); // Outer circle
                this.ctx.fillStyle = "white";
                this.ctx.fill();
                this.ctx.fill();
                //this.ctx.stroke();
                this.ctx.closePath();
            },

            calculateVolume() {
                if (this.audio) {
                    let volume = 0;

                    if (this.x < this.canvas.width / 2) {
                        volume = this.x / this.canvas.width / 2;
                    }

                    if (this.x > this.canvas.width / 2) {
                        volume = (this.canvas.width - this.x) / this.canvas.width / 2;
                    }

                    volume += 0.2;

                    this.volume = volume;

                    if (volume > 1) volume = 1;
                    if (volume < 0) volume = 0;

                    this.audio.volume = volume;
                }
            }
        }
    };
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
    .debug {
        position: fixed;
        top: 0;
    }

    .sky {
        background-color: #BBDEFB;
    }

    html {
        overflow-y: auto;
    }
</style>
