<template>
    <div>
        <keypress :key-code="37" event="keydown" @pressed="planeOneLeft"/>
        <keypress :key-code="39" event="keydown" @pressed="planeOneRight"/>
        <keypress :key-code="65" event="keydown" @pressed="planeTwoLeft"/>
        <keypress :key-code="68" event="keydown" @pressed="planeTwoRight"/>

        <div class="debug">
            <v-container fluid class="pa-0">
                <v-row dense>
                    <v-col>

                    </v-col>
                    <v-col cols="3">
                        <health-bar :value="planeOneHealth"></health-bar>
                    </v-col>
                    <v-col cols="4" class="text-center">
                        <v-btn class="mt-1" small @click="settingsClicked" color="primary">SETTINGS</v-btn>
                    </v-col>
                    <v-col cols="3">
                        <health-bar :value="planeTwoHealth"></health-bar>
                    </v-col>
                    <v-col>

                    </v-col>
                </v-row>
            </v-container>
        </div>

        <v-dialog v-model="settingsModel" width="500">

            <v-card class="mx-auto">
                <v-toolbar dark color="primary">

                    <v-toolbar-title>
                        Settings
                    </v-toolbar-title>

                    <v-spacer></v-spacer>

                    <v-btn icon flat @click="settingsModel=false">
                        <v-icon>mdi-close</v-icon>
                    </v-btn>

                </v-toolbar>
                <v-card-text>
                    <v-switch v-model="sounds" class="mt-5" @change="soundsToggled" label="Enable sounds"></v-switch>
                </v-card-text>
            </v-card>
        </v-dialog>

        <canvas class="sky" ref="sky"></canvas>
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
                sounds: false,
                planeOne: null,
                planeTwo: null,
                clouds: [],
                planeOneHealth: 100,
                planeTwoHealth: 100,
                settingsModel: false,
            };
        },

        mounted() {

            this.sky = new Sky(this.$refs.sky);

            this.planeOne = new Plane('spitfire', {
                speed: 5,
                rotationDegrees: 90,
                directionIndex: 0,
                width: 100,
                height: 100,
                scale: 0.25,
                x: 0,
                y: this.$refs.sky.height / 2 + 50
            });

            this.planeTwo = new Plane('mustang', {
                speed: 5,
                rotationDegrees: -90,
                directionIndex: 4,
                width: 100,
                height: 100,
                scale: 0.25,
                x: this.$refs.sky.width,
                y: this.$refs.sky.height / 3 + 50
            });

            this.sky.addPlane(this.planeOne);
            this.sky.addPlane(this.planeTwo);
            this.sky.animate();
        },

        methods: {

            settingsClicked() {
                this.settingsModel = true;
            },

            soundsToggled() {
                this.planeOne.toggleSounds(this.sounds);
            },

            planeOneRight() {
                this.planeOne.steerRight();
            },

            planeOneLeft() {
                this.planeOne.steerLeft();
            },

            planeTwoRight() {
                this.planeTwo.steerRight();
            },

            planeTwoLeft() {
                this.planeTwo.steerLeft();
            }
        }
    };
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
    .debug {
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
