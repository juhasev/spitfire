<template>
    <div class="d-flex mt-2">

        <div class="text-h6 text-grey-darken-4 pl-2 pr-2 text-no-wrap">
            {{ name.toUpperCase() }}
        </div>

        <v-progress-linear
            :color="color"
            :model-value="value"
            class="ma-3"
            height="10"
            striped
        ></v-progress-linear>

        <v-sheet :color="color" class="text-white pl-2 pr-2 pt-1">
            {{ value }}
        </v-sheet>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
    name: 'HealthBar',

    props: {
        value: {
            required: true,
            type: Number,
        },
        name: {
            required: true,
            type: String,
        },
    },

    computed: {
        color(): string {
            if (this.value > 90) return 'green'
            if (this.value > 70) return 'lime-darken-1'
            if (this.value > 55) return 'yellow-darken-1'
            if (this.value > 40) return 'amber'
            if (this.value > 20) return 'orange'
            return 'red'
        },
    },
})
</script>
