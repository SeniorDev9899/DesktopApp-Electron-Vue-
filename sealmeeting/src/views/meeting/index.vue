<template>
  <RceTitleCompo></RceTitleCompo>
  <div class="meeting">
    <div class="header-pannel">
      <header-compo></header-compo>
    </div>
    <div class="content-pannel" :class="isRce ? 'content-pannel-rce' : ''">
      <div class="speak-pannel">
        <SpeakingUserCompo></SpeakingUserCompo>
      </div>
      <media-list-compo></media-list-compo>
      <media-pager-compo></media-pager-compo>
    </div>
    <div class="bottom-pannel">
      <bottom-compo></bottom-compo>
    </div>
    <transition name="rong-setting-slide" style="width: 100px">
      <div>
        <component
          is="InfoListCompo"
          v-show="drawerCompoName === 'InfoListCompo'"
          class="right-panel"
        ></component>
        <component
          is="ChatCompo"
          v-show="drawerCompoName === 'ChatCompo'"
          class="right-panel"
        ></component>
      </div>
    </transition>
    <Setting v-if="isSettingShow" />
    <InviteDialog v-model="isInviteShow" :detialInfo="meetingInfo" />
  </div>
</template>
<script lang="ts">
import {
  defineComponent,
  ref,
  reactive,
  computed,
  watchEffect,
  watch
} from 'vue'
import RceTitle from '@/compos/RceTitleCompo.vue'
import HeaderCompo from './compos/header-compo/index.vue'
import MediaListCompo from './compos/media-list-compo/index.vue'
import BottomCompo from './compos/bottom-compo/index.vue'
import InfoListCompo from './compos/info-list-compo/index.vue'
import MediaPagerCompo from './compos/media-pager-compo/index.vue'
import ChatCompo from './compos/chat-compo/index.vue'
import usePopup from './hooks/usePopup'
import Setting from '@/compos/setting/SettingDialog.vue'
import useRoleChange from './hooks/useRoleChange'
import useMeetingStart from './hooks/useMeetingStart'
import InviteDialog from '@/compos/dialog/InviteDialog.vue'
import { meetingInfo } from '@/store/meeting'
import RceTitleCompo from '@/compos/RceTitleCompo.vue'
import { appConfig } from '@/appConfig'
import SpeakingUserCompo from './compos/SpeakingUserCompo.vue'
export default defineComponent({
  components: {
    RceTitle,
    HeaderCompo,
    MediaListCompo,
    BottomCompo,
    InfoListCompo,
    Setting,
    ChatCompo,
    MediaPagerCompo,
    InviteDialog,
    RceTitleCompo,
    SpeakingUserCompo
  },
  setup() {
    const { drawerCompoName, isSettingShow, isInviteShow } = usePopup()
    const xx = useRoleChange()
    const xy = useMeetingStart()
    const isRce = computed(() => {
      if (appConfig.launchFrom === 'rce') {
        return true
      } else {
        return false
      }
    })

    return {
      drawerCompoName,
      isSettingShow,
      isInviteShow,
      meetingInfo,
      isRce
    }
  }
})
</script>

<style lang="scss" scoped>
.right-panel {
  position: absolute;
  right: 0px;
  top: 0px;
  width: 380px;
  height: 100%;
  padding-top: 40px;
  z-index: 1101;
}

.rong-setting-slide-enter-active,
.rong-setting-slide-leave-active {
  transition: 0.5s all;
}

.rong-setting-slide-enter,
.rong-setting-slide-leave-active {
  transform: translateX(100%);
}

.meeting {
  width: 100%;
  height: 100%;
  overflow: hidden;
  min-width: 200px;

  .header-pannel {
    position: relative;
    height: 40px;
  }

  .content-pannel {
    height: calc(100vh - 110px);
    min-height: 300px;
    min-width: 450px;
    background-color: rgba(74, 74, 74, 1);
  }

  .content-pannel-rce {
    height: calc(100vh - 150px);
  }

  .bottom-pannel {
    width: 100%;
    height: 70px;
    background-color: rgba(74, 74, 74, 1);
    overflow: hidden;
  }
  .speak-pannel {
    position: absolute;
    width: 80%;
    height: 30px;
    top: 40px;
    left: 0;
    right: 0;
    margin: auto;
    text-align: center;
    z-index: 1001;
  }
}
</style>
