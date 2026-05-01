<template>
  <v-app>
    <v-main>
      <Sky/>
    </v-main>
  </v-app>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import Sky from './components/Sky.vue'

export default defineComponent({
  name: 'App',

  components: {
    Sky,
  },
})
</script>
