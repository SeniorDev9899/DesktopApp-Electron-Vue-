<template>
  <div class="avatar" :class="['rong-avatar-theme-' + themeIndex]">
    <em v-if="!user.portrait" :style="{ 'font-size': fontSize + 'px' }">{{
      userName
    }}</em>
    <el-avatar v-else :src="userPortrait"></el-avatar>
    <input
      v-if="upload"
      type="file"
      ref="fileInputRef"
      @change="fileSelected($event)"
      accept="image/*"
      title="上传头像"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive, ref, computed, watch } from 'vue'
import { qiniuUpload, rcxUpload } from '@/utils/uploadUtil'
import { loginService } from '@/core/services'
import { EnumErrorCode } from '@/types/Enums'
import { loginAuth } from '@/store/login'
import { appConfig } from '@/appConfig'
import meetingApi from '@/core/api/meetingApi'
import { IResponse } from '@/core/api/base'
import { urlUtil } from '@/utils/urlUtil'
import { meetingLogger } from '@/core/ipc/logger/logger.render'
export default defineComponent({
  props: {
    user: Object,
    fontSize: Number,
    upload: Boolean
  },
  setup({ user }, { attrs, slots, emit }) {
    const fileSelected = async (event: MouseEvent) => {
      const ele = event.target as any
      const file = ele.files[0]
      if (!file) {
        return
      }
      const token = await loginService.GetUploadToken()
      if (!token) {
        return
      }
      let rst: any = null
      if (appConfig.mediaType === 1) {
        rst = await qiniuUpload(file, token)
      } else if (appConfig.mediaType === 2) {
        rst = await rcxUpload(appConfig.mediaUpServer, file, token)
      }
      if (rst?.code === EnumErrorCode.OK) {
        const url = urlUtil.replaceOrigin(
          rst.data.path,
          appConfig.mediaDownServer
        )
        meetingLogger.info('头像上传成功', url)
        emit('changeAvatar', {
          portrait: url
        })
      }
    }

    const themeIndex = computed(() => {
      // 根据id返回固定数字，用于显示头像背景色，共6种颜色
      const LENGTH = 6
      return user?.userId ? user?.userId.slice(-1).charCodeAt(0) % LENGTH : 0
    })

    const userName = computed(() => {
      let userName = user?.userName || ''
      if (userName) {
        const isChinese = /^[^\x20-\xff]+$/.test(userName)
        userName = isChinese ? userName.slice(-1) : userName[0].toUpperCase()
        return userName
      }
      return null
    })

    const userPortrait = computed(() => {
      return urlUtil.replaceOrigin(user?.portrait, appConfig.mediaDownServer)
    })

    return { themeIndex, userName, fileSelected, userPortrait }
  }
})
</script>

<style lang="scss" scoped>
.avatar {
  width: 100%;
  height: 100%;
  color: #ffffff;
  text-align: center;
  border-radius: 50%;
  position: relative;
  .el-avatar {
    width: 100%;
    height: 100%;
  }
  input {
    font-size: 100px;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    left: 0;
    position: absolute;
    opacity: 0;
  }
  em {
    top: 50%;
    right: 50%;
    position: absolute;
    transform: translate(50%, -50%);
  }
}
</style>
