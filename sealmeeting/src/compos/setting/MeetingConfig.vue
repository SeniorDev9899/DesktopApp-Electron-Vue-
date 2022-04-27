<template>
  <div class="account-setting">
    <div class="item-line">
      <span>{{ locale.meetingConfigCode }}</span>
      <span class="content">{{ privateRoomNum }}</span>
    </div>
    <!-- <div class="item-line">
      <span>{{ locale.meetingPassword }}</span>
      <el-form :rules="pwdRules" :model="pwdData" ref="pwdForm" label-width="0px">
        <div class="content" style="margin-top: -25px;">
          <el-form-item prop="meetingPwd">
            <el-input
              class="edit-input"
              v-model="pwdData.meetingPwd"
              v-on:blur="doModify"
              size="small"
            ></el-input>
          </el-form-item>
        </div>
      </el-form>
    </div>-->
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, reactive, ref, watch } from 'vue'
import Avatar from '@/compos/Avatar.vue'
import { loginAuth } from '@/store/login'
import localeStore from '@/store/localeStore'
import { loginService } from '@/core/services'
import validators, { regs } from '@/utils/validators'
const usePrivateRoom = () => {
  const privateRoomNum = ref('')
  const pwdForm = ref(null)
  const pwdData = reactive({
    meetingPwd: ''
  })
  const pwdRules = reactive({
    meetingPwd: [
      {
        trigger: 'blur',
        message: '密码仅支持1-4位纯数字',
        pattern: regs.meetingPwd
      }
    ]
  })
  const doModify = async () => {
    const isValid = await validators.validateForm(pwdForm)
    if (!isValid) {
      return
    }
    loginService.modifyUser({ joinMeetingPassword: pwdData.meetingPwd })
  }
  onMounted(() => {
    console.log(loginAuth, 'loginAuth')
    privateRoomNum.value = loginAuth.personalMeetingNumber
    pwdData.meetingPwd = loginAuth.joinMeetingPassword
  })
  return {
    privateRoomNum,
    doModify,
    pwdForm,
    pwdData,
    pwdRules
  }
}
export default defineComponent({
  components: {
    Avatar
  },
  setup() {
    const locale = localeStore('setting')
    const { privateRoomNum, doModify, pwdForm, pwdData, pwdRules } =
      usePrivateRoom()
    return {
      privateRoomNum,
      doModify,
      pwdForm,
      pwdData,
      pwdRules,
      locale
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
      line-height: 18px;
      // margin-top: -14px;
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
        padding-right: 0px;
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
