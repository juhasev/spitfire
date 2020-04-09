<template>
    <div class="d-flex">

        <div class="title grey--text text-darken-4 pl-2 pr-2">
            {{name.toUpperCase()}}
        </div>

        <v-progress-linear
                striped
                class="ma-3"
                height="10"
                :value="value"
                :color="color"
        ></v-progress-linear>

        <v-sheet :color="color" class="white--text pl-2 pr-2 pt-1">
            {{value}}
        </v-sheet>
    </div>
</template>

<script>
    export default {
        name: "HealthBar",

        props: {
            value: {
                required: true,
                type: Number,
            },
            name: {
                required: true,
                type: String
            }
        },

        computed: {
            color() {
                if (this.value > 90) return 'green';
                if (this.value > 70) return 'lime darken-1';
                if (this.value > 55) return 'yellow darken-1';
                if (this.value > 40) return 'amber';
                if (this.value > 20) return 'orange';

                return 'red';
            }
        }
    }
</script>
