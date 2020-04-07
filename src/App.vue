<template>
  <v-app>
    <v-content>
      <sky/>
    </v-content>
  </v-app>
</template>

<script lang="ts">

import Vue from 'vue';
import Sky from './components/Sky.vue';

export default Vue.extend({
  name: 'App',

  components: {
    Sky
  },

  data: () => ({
    //
  }),
});
</script>
