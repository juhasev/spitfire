<template>
    <div>
        <keypress :key-code="37" event="keydown" @pressed="planeOneLeft"/>
        <keypress :key-code="39" event="keydown" @pressed="planeOneRight"/>
        <keypress :key-code="36" event="keydown" @pressed="downPressed"/>
        <keypress :key-code="38" event="keydown" @pressed="upPressed"/>

        <div class="debug">
            <v-switch v-model="sounds" dense class="ml-3" @change="soundsToggled" label="Sounds"></v-switch>
        </div>

        <canvas class="sky" ref="sky"></canvas>
    </div>
</template>

<script>

    import Sky from "../ts/Sky.ts";
    import Plane from "../ts/Plane.ts";

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
                sky: null,
                sounds: false,
                planeOne: null,
                planeTwo: null,
                clouds: [],
            };
        },

        mounted() {

            this.sky = new Sky(this.$refs.sky);
            this.planeOne = new Plane('mustang');
            this.planeTwo = new Plane('spitfire');
            this.sky.addPlane(this.planeOne);
            this.sky.addPlane(this.planeTwo);
            this.sky.animate();
        },

        methods: {

            soundsToggled() {
                this.planeOne.toggleSounds(this.sounds);
            },

            downPressed() {
                if (this.speed > 1) this.speed -= 1;
            },

            upPressed() {
                if (this.speed < 10) this.speed += 1;
            },

            planeOneRight() {
                this.planeOne.steerRight();
            },

            planeOneLeft() {
               this.planeOne.steerLeft();
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
