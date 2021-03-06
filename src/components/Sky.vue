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

        <!-- MOBILE DEVICES -->
        <v-dialog fullscreen persistent v-if="isMobileDevice" v-model="welcomeDialogModel">
            <v-img src="logo.png"></v-img>
            <v-card-text class="pt-6 display-4 text-center" v-if="isMobileDevice">
                <v-alert class="subtitle-1" prominent type="error">Sorry no mobile support! Please play on your PC or Mac</v-alert>
            </v-card-text>
        </v-dialog>

        <!-- DESKTOP WELCOME DIALOG -->
        <v-dialog persistent v-if="!isMobileDevice" v-model="welcomeDialogModel" width="700">

            <v-card>
                <v-img src="logo.png"></v-img>

                <v-tabs v-model="tabModel">
                    <v-tab key="local">
                        Local duel
                    </v-tab>
                    <v-tab key="network" v-if="false">
                        Network duel
                    </v-tab>

                </v-tabs>

                <!-- LOCAL TAB -->
                <v-tabs-items v-model="tabModel">

                    <!-- LOCAL GAME TAB -->
                    <v-tab-item key="local">

                        <v-card-text class="text-center" v-if="!isMobileDevice">

                            <v-container class="pa-0">
                                <v-row dense>

                                    <v-col cols="6">
                                        <v-switch v-model="sounds" class="mt-0" @change="soundsToggled"
                                                  label="Enable sounds"></v-switch>
                                    </v-col>
                                    <v-col cols="6">
                                        <v-btn color="primary" small @click="helpClicked">
                                            <v-icon left>mdi-information-outline</v-icon>
                                            TIPS
                                        </v-btn>
                                        <v-btn small class="ml-2" @click="githubClicked">
                                            <v-icon left>mdi-github</v-icon>
                                            GITHUB
                                        </v-btn>
                                    </v-col>

                                    <v-col cols="6">
                                        <v-text-field
                                                :rules=[rules.required]
                                                autofocus
                                                hint="Player one name"
                                                persistent-hint
                                                dense
                                                v-model="playerOne"
                                        ></v-text-field>
                                    </v-col>
                                    <v-col class="pt-3">
                                        <code class="mr-2">&#x2190; Left</code>
                                        <code class="mr-2">&#x2192; Right</code>
                                        <code class="mr-2">&#x2191; Shoot</code>
                                    </v-col>

                                    <v-col cols="6">
                                        <v-text-field
                                                v-model="playerTwo"
                                                persistent-hint hint="Player two name"
                                                :rules=[rules.required]
                                                dense
                                                @keydown.enter="startGame"
                                        ></v-text-field>
                                    </v-col>

                                    <v-col class="pt-3">
                                        <code class="mr-2">A Left</code>
                                        <code class="mr-2">D Right</code>
                                        <code class="mr-2">W Shoot</code>
                                    </v-col>

                                </v-row>
                            </v-container>

                            <v-btn color="primary" class="body-1" @click="startGameClicked">START GAME</v-btn>

                        </v-card-text>
                    </v-tab-item>

                    <!-- NETWORK TAB -->
                    <v-tab-item key="network">
                        <v-card>
                            <v-card-text>
                                <v-text-field
                                        v-model="gameNameModel"
                                        persistent-hint hint="Please enter name of the game"
                                        :rules=[rules.required]
                                        dense
                                        @keydown.enter="createNetworkGame"
                                ></v-text-field>

                            </v-card-text>
                            <v-card-actions>
                                <v-btn color="primary" @click="createNetworkGame">Create new network game</v-btn>
                            </v-card-actions>
                        </v-card>
                    </v-tab-item>

                </v-tabs-items>

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

        <v-dialog v-model="tipsDialogModel" width="600">

            <v-card>
                <v-alert type="info">Tips and tricks for winners</v-alert>
                <v-card-text class="text-left">
                    <ul>
                        <li>Damage varies from 1 to 40 per hit depending on how close to the center of the fuselage you
                            hit
                        </li>
                        <li>If you go up in an extreme angle your plane will slow down</li>
                        <li>If you do down in an extreme angle your plane's speed will increase</li>
                        <li>Damage will decrease your plane's speed</li>
                        <li>Planes emit smoke based on their damage level</li>
                        <li>Clouds start getting ticker at the beginning of the game (hint: hide) and cycle back and
                            forth after that
                        </li>
                        <li>Firing only when needed can make you more accurate</li>
                        <li>Pro players don't turn around but instead re-appear on the opposite side by going through the boundaries</li>
                    </ul>
                    <v-btn color="primary" small class="mt-4" @click="tipsDialogModel=false">GOT IT</v-btn>
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
    import {isMobile} from 'mobile-device-detect';
    import io from 'socket.io-client';

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
                tipsDialogModel: false,
                gameNameModel: null,
                tabModel: null,
                playerOne: 'Player One',
                playerTwo: 'Player Two',

                messages: [],
                rules: {
                    required: value => !!value || 'Name is required.',
                },
                socket: io('localhost:3001')
            };
        },

        mounted() {

            this.socket.on('MESSAGE', (data) => {
                this.messages.push(data);
            });

            this.socket.emit('SEND_MESSAGE', {
                user: 'Juha',
                message: 'Some message here'
            });
        },

        computed: {
            isMobileDevice() {
                return isMobile;
            },
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

           createNetworkGame() {
               this.socket.emit('CREATE_GAME', {
                   name: this.gameNameModel,
               });
           },

            helpClicked() {
                this.tipsDialogModel = true;
            },

            githubClicked() {
                window.open('https://github.com/juhasev/spitfire', '_blank');
            },

            createGame() {

                this.welcomeDialogModel = false;
                this.gameOverDialogModel = false;

                this.sky = new Sky(this.$refs.sky, this.socket);
                this.sky.gameOverHandler = this.gameOver;

                this.planeOne = new Plane('spitfire', {
                    speed: 7,
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
                    speed: 7,
                    health: 100,
                    directionDegrees: 180,
                    width: 100,
                    height: 100,
                    scale: 0.25,
                    x: this.$refs.sky.width,
                    y: this.$refs.sky.height / 3 + 50,
                    keyFire: 'w',
                    keyLeft: 'a',
                    keyRight: 'd'
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
