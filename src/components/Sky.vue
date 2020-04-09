<template>
    <div>
        <keypress :key-code="37" event="keydown" @pressed="planeOne.left()"/>
        <keypress :key-code="39" event="keydown" @pressed="planeOne.right()"/>
        <keypress :key-code="38" event="keydown" @pressed="planeOne.fire()"/>

        <keypress :key-code="65" event="keydown" @pressed="planeTwo.left()"/>
        <keypress :key-code="68" event="keydown" @pressed="planeTwo.right()"/>
        <keypress :key-code="87" event="keydown" @pressed="planeTwo.fire()"/>

        <keypress :key-code="32" event="keydown" @pressed="startGame"/>

        <div class="controlBar">
            <v-container fluid class="pa-0">
                <v-row dense>
                    <v-col>

                    </v-col>
                    <v-col cols="4">
                        <health-bar v-if="planeOneHealth && planeOneHealth>=0" :value="planeOneHealth"
                                    :name="playerA"></health-bar>
                    </v-col>
                    <v-col cols="2" class="text-center">

                    </v-col>
                    <v-col cols="4">
                        <health-bar v-if="planeTwoHealth && planeTwoHealth>=0" :value="planeTwoHealth"
                                    :name="playerB"></health-bar>
                    </v-col>
                    <v-col>

                    </v-col>
                </v-row>
            </v-container>
        </div>

        <!-- WELCOME DIALOG -->
        <v-dialog v-model="welcomeDialogModel" persistent width="1000">

            <v-card>
                <v-img src="logo.png"></v-img>
                <v-card-text class="pt-6 display-4 text-center">
                    <v-switch v-model="sounds" class="mt-5" @change="soundsToggled" label="Enable sounds"></v-switch>
                    <v-text-field v-model="playerA" persistent-hint hint="Player one name" autofocus></v-text-field>
                    <v-text-field v-model="playerB" persistent-hint hint="Player two name"
                                  @keydown.enter="startGame"></v-text-field>
                    <v-btn color="primary" class="body-1" @click="startGame">START GAME</v-btn>
                </v-card-text>

            </v-card>
        </v-dialog>

        <!-- GAME OVER DIALOG -->
        <v-dialog v-model="gameOverDialogModel" width="600">

            <v-card>
                <v-card-text class="pt-6 display-4 text-center">
                    GAME OVER
                    <div class="caption">Restarting....</div>
                </v-card-text>
            </v-card>
        </v-dialog>

        <!-- 2D Canvas -->
        <canvas v-show="!welcomeDialogModel" class="sky" ref="sky"></canvas>
    </div>
</template>

<script>

    import Sky from "../ts/Sky.ts";
    import Plane from "../ts/Plane.ts";
    import HealthBar from "@/components/HealthBar";
    import PointToLineDistanceCalculator from "@/ts/PointToLineDistanceCalculator";

    export default {
        name: "Spitfire",

        props: {
            msg: String
        },

        components: {
            HealthBar,
            Keypress: () => import("vue-keypress")
        },

        data() {
            return {
                sky: null,
                sounds: true,
                planeOne: null,
                planeTwo: null,
                clouds: [],
                welcomeDialogModel: true,
                gameOverDialogModel: false,
                playerA: '',
                playerB: ''
            };
        },

        computed: {
            planeOneHealth() {
                if (this.planeOne) return this.planeOne.health;
                return null;
            },
            planeTwoHealth() {
                if (this.planeTwo) return this.planeTwo.health;
                return null;
            }
        },

        mounted() {

            // Known point
            const x1 = -6;
            const y1 = 0;

            // Second known point
            const x2 = 6;
            const y2 = 0;

            const x = 2;
            const y = 3;

            const distance = new PointToLineDistanceCalculator(x,y,x1,y1,x2,y2).getDistance();

            console.log(distance);
        },

        methods: {

            createGame() {

                this.welcomeDialogModel = false;
                this.gameOverDialogModel = false;

                this.sky = new Sky(this.$refs.sky);
                this.sky.gameOverHandler = this.gameOver;

                this.planeOne = new Plane('spitfire', {
                    speed: 5,
                    health: 100,
                    directionDegrees: 0,
                    width: 100,
                    height: 100,
                    scale: 0.25,
                    x: 0,
                    y: this.$refs.sky.height / 2 + 50
                });

                this.planeTwo = new Plane('mustang', {
                    speed: 5,
                    health: 100,
                    directionDegrees: 180,
                    width: 100,
                    height: 100,
                    scale: 0.25,
                    x: this.$refs.sky.width,
                    y: this.$refs.sky.height / 3 + 50
                });

                this.planeOne.toggleSounds(this.sounds);
                this.planeTwo.toggleSounds(this.sounds);

                this.sky.addPlane(this.planeOne);
                this.sky.addPlane(this.planeTwo);
                this.sky.animate();
            },

            settingsClicked() {
                this.settingsModel = true;
            },

            soundsToggled() {
                this.planeOne.toggleSounds(this.sounds);
            },

            gameOver() {
                this.gameOverDialogModel = true;
                setTimeout(() => {
                    this.gameOverDialogModel = false;
                    this.createGame();
                }, 3000);
            },

            startGame() {
                if (this.welcomeDialogModel === true) {
                    this.welcomeDialogModel = false;
                    this.createGame();
                }
            }
        }
    };
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

    .controlBar {
        position: fixed;
        top: 0;
        width: 100%;
    }

    .sky {
        background-color: #BBDEFB;
    }

    html {
        overflow-y: auto;
    }
</style>
