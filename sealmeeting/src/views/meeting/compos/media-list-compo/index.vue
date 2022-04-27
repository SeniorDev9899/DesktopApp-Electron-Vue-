<template>
  <div :class="listMode">
    <UserMediaItemCompo
      v-for="(item, index) in userMediaList"
      :key="item.userId"
      :user="item"
    ></UserMediaItemCompo>
  </div>
</template>
<script lang="ts">
import { computed, defineComponent, reactive, ref, watch } from 'vue'
import UserMediaItemCompo from './MediaItemCompo.vue'
import { IUserModel } from '@/types/meeting'
import SpeakingUserCompo from '../SpeakingUserCompo.vue'
import {
  meetingSetting,
  meetingAction,
  userAction,
  userInfoList
} from '@/store/meeting'
import {
  meetingRoomService,
  meetingOperateService,
  meetingControlService
} from '@/core/services'
export default defineComponent({
  components: {
    UserMediaItemCompo,
    SpeakingUserCompo
  },

  setup(props, { attrs, slots, emit }) {
    const listMode = computed((): string => {
      return meetingSetting.foucsUserId ||
        meetingSetting.shareUserId ||
        meetingSetting.speakerId
        ? 'list-focus-mode'
        : 'list-normal-mode'
    })
    const userMediaList = computed(() => {
      const start = 9 * (meetingSetting.userMediaPage - 1)
      const list = userInfoList.slice(start, start + 9)
      const stickUserId =
        meetingSetting.shareUserId ||
        meetingSetting.speakerId ||
        meetingSetting.foucsUserId
      const stickUser = !!stickUserId
        ? userAction.userGet(stickUserId)
        : undefined
      if (stickUser) {
        list.indexOf(stickUser) == -1 && list.unshift(stickUser)
      }
      return list
    })
    return {
      userMediaList,
      listMode
    }
  }
})
</script>
<style lang="scss" scoped>
.list-focus-mode {
  float: right;
  height: 100%;
  width: 250px;
  overflow-y: auto;
}
.list-focus-mode::-webkit-scrollbar {
  /*隐藏滚轮*/
  display: none;
}
.list-normal-mode {
  width: 100%;
  height: 100%;
  overflow: hidden;
  padding: 20px;
}
</style>