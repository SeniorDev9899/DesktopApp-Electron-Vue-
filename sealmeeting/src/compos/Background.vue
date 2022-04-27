<template>
  <div class="background">
    <div class="main-box" :class="{ 'box-position': data.show }">
      <slot></slot>
    </div>
  </div>
</template>

<script lang="ts">
  import { defineComponent, reactive, onMounted, onUnmounted } from 'vue';
  export default defineComponent({
    name: 'Background',
    setup() {
      const data = reactive({
        show: true,
      });
      const winResize = () => {
        const height = document.body.offsetHeight;
        if (height < 700) {
          data.show = false;
        } else {
          data.show = true;
        }
      };
      onMounted(() => {
        winResize();
        window.addEventListener('resize', winResize, false);
      });
      onUnmounted(() => {
        window.removeEventListener('resize', winResize, false);
      });
      return { data };
    },
  });
</script>

<style lang="scss" scoped>
  .background {
    width: 100%;
    height: 100%;
    min-width: 1000px;
    background-color: #f9fafb;
    background-image: url(~@/assets/images/bg.png);
    background-repeat: no-repeat;
    background-position-y: bottom;
    background-size: 100% 100%;
    border-top: 1px solid #ccc;
    overflow: auto;
  }

  .main-box {
    width: 378px;
    height: 100%;
    margin: auto;
    background: rgba(255, 255, 255, 1);
    background: rgba(255, 255, 255, 1);
    box-shadow: 0px 2px 4px 0px rgba(41, 107, 207, 0.22);
    border-radius: 5px;
    padding-left: 40px;
    padding-right: 40px;
    box-sizing: border-box;
    min-height: 650px;
    max-height: 670px;
    overflow: hidden;
  }

  .box-position {
    position: absolute;
    top: calc(50% - 335px);
    left: calc(50% - 189px);
  }
</style>