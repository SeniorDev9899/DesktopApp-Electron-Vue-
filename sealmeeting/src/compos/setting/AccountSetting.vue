<template>
  <div class="account-setting">
    <div align="center">
      <div>
        <Avatar
          class="avatar"
          :user="profileData"
          @changeAvatar="changeAvatar"
          :upload="true"
          :fontSize="40"
        ></Avatar>
      </div>
    </div>
    <div class="item-line">
      <span>{{ locale.account }}</span>
      <span class="content">{{ profileData.mobile }}</span>
    </div>
    <div class="item-line">
      <span>{{ locale.showName }}</span>
      <el-form
        :rules="profileRules"
        :model="profileData"
        ref="profileForm"
        label-width="0px"
        class="content"
      >
        <div>
          <!-- v-if="!data.showInput" -->
          <!-- <span class="username" >{{data.userName}}</span> -->
          <!-- v-if="data.showInput" -->
          <el-form-item prop="userName">
            <el-input
              class="edit-input"
              :maxlength="20"
              v-model="profileData.userName"
              v-on:blur="submit"
              ref="inputEle"
              size="small"
            ></el-input>
          </el-form-item>
        </div>
      </el-form>
      <el-button class="logout" @click.stop="logout">{{
        locale.logout
      }}</el-button>
    </div>
  </div>
</template>

<script lang="ts">
import Avatar from '@/compos/Avatar.vue'
import { defineComponent, reactive, ref } from 'vue'
import { loginAuth } from '@/store/login'
import validators, { regs } from '@/utils/validators'
import { loginService } from '@/core/services'
import { EnumErrorCode } from '@/types/Enums'
import { ElMessage } from 'element-plus'
import router from '@/utils/routerUtil'
import parseErrorCode from '@/utils/errorUtil'
import Background from '@/compos/Background.vue'
import localeStore from '@/store/localeStore'
import { meetingRoomService, serviceManager } from '@/core/services'
const useProfileSetting = () => {
  const profileData = reactive({
    userId: loginAuth.name,
    userName: loginAuth.name,
    portrait: loginAuth.portrait,
    mobile: loginAuth.mobile
  })
  const profileRules = reactive({
    userName: [
      { trigger: 'blur', message: '请输入姓名或昵称', required: true },
      {
        trigger: 'blur',
        message: '姓名/昵称最多支持40个数字、字母、汉字、空格组合',
        pattern: regs.userName
      }
    ]
  })
  const profileForm = ref(null)
  const isLoading = ref(false)
  const submit = async () => {
    isLoading.value = true
    const isValid = await validators.validateForm(profileForm)
    if (!isValid) {
      isLoading.value = false
      return
    }
    const rst = await loginService.modifyUser({
      name: profileData.userName,
      portrait: profileData.portrait
    })
    isLoading.value = false
    if (rst !== EnumErrorCode.OK) {
      const msg = parseErrorCode(rst)
      ElMessage.error(msg)
    } else {
    }
  }
  const changeAvatar = async (user: any) => {
    profileData.portrait = user.portrait
    const rst = await loginService.modifyUser({
      portrait: profileData.portrait
    })
    if (rst !== EnumErrorCode.OK) {
      const msg = parseErrorCode(rst)
      ElMessage.error(msg)
    } else {
    }
  }
  return {
    profileData,
    profileRules,
    profileForm,
    isLoading,
    submit,
    changeAvatar
  }
}
export default defineComponent({
  components: {
    Avatar
  },
  setup() {
    const locale = localeStore('setting')
    const useProfile = useProfileSetting()
    const logout = () => {
      meetingRoomService.leaveMeeting()
      serviceManager.onLogout()
      loginService.logout()
      router.toLogin()
    }
    return {
      locale,
      logout,
      ...useProfile
    }
  }
})
</script>

<style lang="scss" scoped>
.account-setting {
  padding: 21px 37px;
  height: 100%;
  .avatar {
    width: 80px;
    height: 80px;
    margin-bottom: 40px;
  }
  .item-line {
    margin-bottom: 21px;
    .content {
      float: right;
      line-height: 20px;

      img {
        cursor: pointer;
      }
      .username {
        padding-right: 10px;
        position: relative;
        top: -2px;
      }
      .edit-input {
        width: 150px;
        padding-right: 15px;
      }
    }
  }
  .logout {
    display: block;
    margin: auto;
    margin-top: 70px;
    padding: 9px 28px;
    border-radius: 0px;
    color: rgba(255, 86, 79, 1);
    border: 1px solid rgba(255, 86, 79, 1);
  }
}

.el-form-item {
  display: inline-block;
  margin-bottom: 22px;
}
</style>
