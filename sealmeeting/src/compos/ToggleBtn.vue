<template>
  <div class="icon-text">
    <i
      class="icon"
      ref="iconEle"
      :style="{ backgroundImage: 'url(\'' + imageStr + '\')' }"
    ></i>
    <span>{{ label }}</span>
    <slot></slot>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive, ref, onMounted, watch } from 'vue'

export default defineComponent({
  props: {
    img1: String,
    img2: String,
    label: String,
    isNomalState: Boolean,
    size: Number,
    otherStyle: Object //  遵循Dom Style JS 语法即可
  },
  setup(props, { attrs, slots, emit }) {
    const imageStr = ref('')
    const iconEle = ref('')
    const contextRequire = require.context('@/assets/images', true, /\.svg$/)

    onMounted(() => {
      const size = props.size ? props.size : 40
      ;(iconEle.value as any).style.width = `${size}px`
      ;(iconEle.value as any).style.height = `${size}px`
      //  遵循Dom Style JS 语法即可
      if (props.otherStyle) {
        Object.keys(props.otherStyle).map((key) => {
          ;(iconEle.value as any).style[key] = props.otherStyle![key]
        })
      }
    })

    watch(
      () => {
        return props.isNomalState
      },
      (isNomalState) => {
        imageStr.value = isNomalState
          ? contextRequire(`./${props.img1}`)
          : contextRequire(`./${props.img2}`)
      },
      {
        immediate: true
      }
    )
    return { imageStr, iconEle }
  }
})
</script>

<style lang="scss" scoped>
i {
  display: inline-block;
  background-repeat: no-repeat;
  background-position: center center;
}
.icon-text {
  display: inline-block;
  cursor: pointer;
  span {
    display: block;
    text-align: center;
    font-size: 10px;
    line-height: 14px;
    font-weight: 400;
  }
  .icon {
    // width: 40px;
    // height: 40px;
    font-size: 0px;
  }
}
</style>
