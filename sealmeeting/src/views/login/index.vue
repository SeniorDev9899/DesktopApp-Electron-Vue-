<template>
  <Background>
    <div class="login-box">
      <div class="head">
        <div class="logo"></div>
        <div class="textImage"></div>
      </div>
      <el-form
        labelPosition="top"
        :model="loginData"
        :rules="loginRules"
        ref="loginForm"
        :disabled="isLogining"
      >
        <el-form-item prop="mobile" :label="locale.mobile">
          <el-input
            prefix-icon="el-icon-user"
            clearable
            :maxlength="11"
            v-model="loginData.mobile"
          />
        </el-form-item>
        <el-form-item prop="smsCode" :label="locale.smsCode">
          <el-input
            prefix-icon="el-icon-lock"
            class="verify-code-input"
            clearable
            v-model="loginData.smsCode"
          />
          <el-button
            type="primary"
            v-if="smsData.smsSendable"
            class="verify-code-btn"
            @click="sendSmsCode(loginData.mobile)"
            >{{ locale.sendSmsCode }}</el-button
          >
          <div v-else class="time">{{ smsData.timeBackCount }}'s</div>
        </el-form-item>
        <el-form-item class="btn-item">
          <el-button type="primary" :loading="isLogining" @click="login">
            {{ locale.login }}
          </el-button>
        </el-form-item>
      </el-form>
      <div class="bottom">
        <div class="tip">
          {{ locale.agreementTip }}
          <a @click="toAgreement">{{ locale.agreement }}</a>
        </div>
        <div>{{ productName }} {{ version }}</div>
      </div>
    </div>
  </Background>
</template>

<script lang="ts">
import Background from '@/compos/Background.vue'
import { defineComponent, onMounted } from 'vue'
import useLogin from './hooks/useLogin'
import useSmsCode from './hooks/useSms'
import localeStore from '@/store/localeStore'
import router from '@/utils/routerUtil'
import { loginService } from '@/core/services'
import { appConfig } from '@/appConfig'

export default defineComponent({
  components: {
    Background
  },
  setup() {
    const locale = localeStore('login')
    const { loginForm, loginData, loginRules, login, isLogining } = useLogin()
    const { smsData, sendSmsCode } = useSmsCode(loginForm)
    const { productName, version } = appConfig
    onMounted(() => {
      loginService.logout()
      loginService.getNavConfig()
    })
    return {
      loginData,
      loginRules,
      login,
      isLogining,
      smsData,
      sendSmsCode,
      locale,
      toAgreement: router.toAgreement,
      loginForm,
      productName,
      version
    }
  }
})
</script>

<style lang="scss" scoped>
.login-box {
  width: 100%;
  height: 100%;
  position: relative;
  .head {
    padding-top: 60px;
    .logo {
      margin: auto;
      margin-bottom: 10px;
      width: 80px;
      height: 80px;
      background: no-repeat center center;
      background-image: url(~@/assets/images/logo.svg);
    }
    .textImage {
      margin: auto;
      width: 95px;
      height: 24px;
      background: no-repeat center center;
      background-image: url(~@/assets/images/sealMeeting.svg);
    }
  }
  .el-form {
    margin-top: 41px;
    .btn-item {
      margin-top: 40px;
      .el-button {
        width: 100%;
      }
    }
    .verify-code-input {
      width: 178px;
    }
    .verify-code-btn {
      width: 110px;
      margin-left: 10px;
    }
  }
  .bottom {
    position: absolute;
    bottom: 30px;
    width: 100%;
    text-align: center;
    font-size: 12px;
    font-family: PingFangSC-Regular, PingFang SC;
    font-weight: 400;
    color: rgba(92, 105, 112, 1);
    line-height: 17px;
    .tip {
      width: 70%;
      margin: auto;
      margin-bottom: 6px;
      a {
        color: rgba(0, 170, 255, 1);
        // display: block;
        cursor: pointer;
      }
    }
  }

  .time {
    width: 110px;
    height: 40px;
    /* color: bisque; */
    color: #409eff;
    border: 1px solid #409eff;
    margin-left: 10px;
    border-radius: 4px;
    display: inline-block;
    text-align: center;
    text-align: center;
    position: absolute;
    top: 3px;
    line-height: 37px;
  }
}
</style>
