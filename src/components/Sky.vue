<template>
    <div>
        <keypress :key-code="32" event="keydown" @pressed="startGame"/>

        <div class="controlBar">
            <v-container fluid class="pa-0">
                <v-row dense>
                    <v-col cols="1"></v-col>
                    <v-col cols="4">
                        <health-bar v-if="planeOneHealth!==null && planeOneHealth>=0"
                                    :value="planeOneHealth"
                                    :name="playerOne"></health-bar>
                    </v-col>
                    <v-col cols="2"></v-col>
                    <v-col cols="4">
                        <health-bar v-if="planeTwoHealth!==null && planeTwoHealth>=0"
                                    :value="planeTwoHealth"
                                    :name="playerTwo"></health-bar>
                    </v-col>
                    <v-col cols="1"></v-col>
                </v-row>
            </v-container>
        </div>

        <!-- WELCOME DIALOG -->
        <v-dialog v-model="welcomeDialogModel" persistent width="1000">

            <v-card>
                <v-img src="logo.png"></v-img>
                <v-card-text class="pt-6 display-4 text-center">
                    <v-switch v-model="sounds" class="mt-5" @change="soundsToggled" label="Enable sounds"></v-switch>

                    <v-text-field
                            v-model="playerOne"
                            persistent-hint
                            hint="Player one name"
                            autofocus
                            :rules=[rules.required]
                    ></v-text-field>

                    <v-text-field
                            v-model="playerTwo"
                            persistent-hint hint="Player two name"
                            :rules=[rules.required]
                            @keydown.enter="startGame"
                    ></v-text-field>

                    <v-btn color="primary" class="body-1" @click="startGameClicked">START GAME</v-btn>

                </v-card-text>

            </v-card>
        </v-dialog>

        <!-- GAME OVER DIALOG -->
        <v-dialog v-model="gameOverDialogModel" width="600">

            <v-card>
                <v-card-text class="pt-6 display-4 text-center">
                    {{winningPlayerName}} WINS!
                    <div class="caption">Get ready dual continues....</div>
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
                listenKeys: [
                    'ArrowRight',
                    'ArrowLeft',
                    'ArrowUp',
                    'a',
                    'd',
                    'w'
                ],
                keysPressed: [],
                planeOne: null,
                planeTwo: null,
                clouds: [],
                welcomeDialogModel: true,
                gameOverDialogModel: false,
                playerOne: 'Player One',
                playerTwo: 'Player Two',
                rules: {
                    required: value => !!value || 'Name is required.',
                }
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
            },
            winningPlayerName() {
                if (this.planeOne && this.planeOne.health <= 0) {
                    return this.playerTwo;
                }
                if (this.planeTwo && this.planeTwo.health <= 0) {
                    return this.playerOne;
                }

                return null;
            }
        },

        methods: {

            startGameClicked() {
                if (this.playerOne.length >= 1 && this.playerTwo.length >= 1) {
                    this.createGame();
                }
            },

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
                    y: this.$refs.sky.height / 2 + 50,
                    keyFire: 'ArrowUp',
                    keyLeft: 'ArrowLeft',
                    keyRight: 'ArrowRight'
                });

                this.planeTwo = new Plane('mustang', {
                    speed: 5,
                    health: 100,
                    directionDegrees: 180,
                    width: 100,
                    height: 100,
                    scale: 0.25,
                    x: this.$refs.sky.width,
                    y: this.$refs.sky.height / 3 + 50,
                    keyFire: 'a',
                    keyLeft: 'd',
                    keyRight: 'w'
                });

                this.planeOne.toggleSounds(this.sounds);
                this.planeTwo.toggleSounds(this.sounds);

                this.sky.addPlane(this.planeOne);
                this.sky.addPlane(this.planeTwo);
                this.sky.animate();
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
