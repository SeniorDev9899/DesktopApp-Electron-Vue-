<template>
  <Background>
    <router-view />
  </Background>
</template>
<script lang="ts">
import { defineComponent } from 'vue';
import Background from '@/compos/Background.vue';
export default defineComponent({
  components: {
    Background,
  },
  setup(props, { attrs, slots, emit }) {
    return {};
  },
});
</script>
