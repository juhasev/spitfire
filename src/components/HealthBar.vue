<template>
    <div class="d-flex">
        <v-progress-linear
                striped
                class="ma-3"
                height="10"
                :value="value"
                :color="color">
        </v-progress-linear>

        <div class="title">
            <v-sheet :color="color" class="white--text pl-2 pr-2">
            {{value}}
            </v-sheet>
        </div>
    </div>
</template>

<script>
    export default {
        name: "HealthBar",

        props: {
            value: {
                required: true,
                type: Number
            }
        },

        computed: {
            color() {
                if (this.value > 90) return 'green';
                if (this.value > 70) return 'lime';
                if (this.value > 55) return 'yellow';
                if (this.value > 40) return 'amber';
                if (this.value > 20) return 'orange';

                return 'red';
            }
        }
    }
</script>
