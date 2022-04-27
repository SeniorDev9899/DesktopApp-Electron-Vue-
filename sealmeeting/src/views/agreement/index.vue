<template>
  <Background>
    <div class="agreement-box">
      <div class="title">注册条款</div>
      <i class="up-page" @click="upPage"></i>
      <div class="container">
        <div ref="contentEle" class="content">
          <iframe
            src="/agreement_zh.html"
            class="agreement-box"
            frameborder="0"
          ></iframe>
        </div>
      </div>
    </div>
  </Background>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import Background from '@/compos/Background.vue'
import routerUtil from '@/utils/routerUtil'
export default defineComponent({
  components: {
    Background
  },
  setup(props, { attrs, slots, emit }) {
    const upPage = () => {
      routerUtil.toLogin()
    }
    return { upPage }
  }
})
</script>

<style lang="scss" scoped>
.agreement-box {
  width: 100%;
  height: 100%;
  position: relative;

  padding-bottom: 20px;
  .title {
    font-size: 16px;
    font-weight: 400;
    color: #2e3538;
  }
  .up-page {
    position: absolute;
    top: 24px;
    left: 0px;
    width: 16px;
    height: 16px;
    background-image: url(~@/assets/images/left_arrow.png);

    z-index: 100;
    cursor: pointer;
  }
  .container {
    overflow: hidden;
    height: 100%;
    padding-top: 65px;
    position: absolute;
    top: 0px;
    padding-bottom: 20px;
    .content {
      // padding-left: 10px;
      // padding-right: 10px;
      height: 100%;
      width: 100%;
      overflow: hidden;
    }
  }
}
</style>
