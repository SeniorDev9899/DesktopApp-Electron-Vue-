<template>
  <div
    class="page-btn"
    v-show="isNextPageVisible || isPrePageVisible"
    @click="nextPage"
  >
    换一批
  </div>
</template>
<script lang="ts">
import { meetingAction, meetingSetting, userInfoList } from '@/store/meeting'
import { computed, defineComponent, watch } from 'vue'

export default defineComponent({
  setup(props, { attrs, slots, emit }) {
    const totalPage = computed(() => {
      return Math.ceil(userInfoList.length / 9)
    })
    const isNextPageVisible = computed(() => {
      return meetingSetting.userMediaPage < totalPage.value
    })
    const isPrePageVisible = computed(() => {
      return meetingSetting.userMediaPage > 1
    })
    const nextPage = () => {
      let nextPage = meetingSetting.userMediaPage + 1
      // nextPage > totalPage.value && (nextPage = totalPage.value);
      nextPage > totalPage.value && (nextPage = 1)
      meetingSetting.userMediaPage = nextPage
    }
    const prePage = () => {
      let prePage = meetingSetting.userMediaPage - 1
      prePage < 1 && (prePage = 1)
      meetingSetting.userMediaPage = prePage
    }
    watch(totalPage, (val, preVal) => {
      if (meetingSetting.userMediaPage > val) {
        meetingSetting.userMediaPage = val
      }
    })
    return {
      nextPage,
      isNextPageVisible,
      isPrePageVisible
    }
  }
})
</script>
<style lang="scss" scoped>
.page-btn {
  width: 88px;
  height: 40px;
  background: #2e3538;
  border-radius: 2px 2px 0px 0px;
  opacity: 0.5;
  cursor: pointer;
  position: absolute;
  right: 0px;
  bottom: 70px;
  color: #ffffff;
  line-height: 40px;
  font-size: 16px;
  text-align: center;
  user-select: none;
}
</style>