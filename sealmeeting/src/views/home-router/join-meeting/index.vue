<template>
  <div class="now-meeting-box">
    <div class="title">{{ locale.meetingNow }}</div>
    <i class="up-page" @click="upPage"></i>
    <el-form
      labelPosition="top"
      :model="joinData"
      :rules="joinRules"
      ref="joinForm"
    >
      <el-form-item prop="meetingNumber" :label="locale.meetingNumber">
        <el-input clearable v-model="joinData.meetingNumber" :maxlength="12" />
      </el-form-item>
      <el-checkbox
        class="self-number-check"
        v-model="joinData.isPrivateNumberUsed"
        >{{ locale.privateNumberTip }}{{ userInfo.privateNumber }}</el-checkbox
      >
      <el-form-item
        prop="displayName"
        :label="locale.displayName"
        class="name-item"
      >
        <el-input clearable v-model="joinData.displayName" :maxlength="20" />
      </el-form-item>
      <el-form-item :label="locale.whenEnter">
        <!-- <el-checkbox-group v-model="data.mode"> -->
        <el-checkbox
          :label="locale.audioOn"
          v-model="joinData.isAudioOn"
          class="video-check"
        ></el-checkbox>
        <el-checkbox
          :label="locale.videoOn"
          v-model="joinData.isVideoOn"
          class="audio-check"
        ></el-checkbox>
        <!-- </el-checkbox-group> -->
      </el-form-item>
      <el-form-item class="btn-item">
        <el-button type="primary" @click="joinMeeting">{{
          locale.submit
        }}</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive, ref, watch } from 'vue'
import localeStore from '@/store/localeStore'
import { loginAuth } from '@/store/login'
import validators, { regs } from '@/utils/validators'
import {
  meetingRoomService,
  meetingOperateService,
  meetingControlService
} from '@/core/services'
import { EnumErrorCode } from '@/types/Enums'
import { ElMessage } from 'element-plus'
import router from '@/utils/routerUtil'
import parseErrorCode from '@/utils/errorUtil'
import { settingAction, settingState } from '@/store/setting'
import routerUtil from '@/utils/routerUtil'
const locale = localeStore('home.join')

const useMeetingJoin = () => {
  const userInfo = reactive({
    userName: loginAuth.name,
    privateNumber: loginAuth.personalMeetingNumber
  })
  let dialogShow = ref(true)
  const joinForm = ref(null)
  const isJoinFormLoading = ref(false)
  const joinData = reactive({
    meetingNumber: '',
    displayName: loginAuth.name,
    isPrivateNumberUsed: false,
    isVideoOn: false,
    isAudioOn: false
  })
  const joinRules = reactive({
    meetingNumber: [
      {
        trigger: 'blur',
        message: locale.meetingNumberRequired,
        required: true
      },
      {
        trigger: 'blur',
        message: locale.meetingNumberInvalid,
        pattern: regs.meetingNumber
      }
    ],
    displayName: [
      { trigger: 'blur', message: locale.displayNameRequired, required: true },
      {
        trigger: 'blur',
        message: locale.displayNameInvalid,
        pattern: regs.userName
      }
    ]
  })

  //监听是否使用个人手机号
  watch(
    () => {
      return joinData.isPrivateNumberUsed
    },
    (state: boolean, preState) => {
      joinData.meetingNumber = state ? userInfo.privateNumber : ''
      validators.validateForm(joinForm)
    }
  )

  // 监听会议号
  watch(
    () => {
      return joinData.meetingNumber
    },
    (state: string, preState) => {
      if (joinData.isPrivateNumberUsed) {
        joinData.isPrivateNumberUsed = state === userInfo.privateNumber
      }
    }
  )

  const joinMeeting = async () => {
    const isValid = await validators.validateForm(joinForm)
    if (!isValid) {
      isJoinFormLoading.value = false
      return
    }
    const { errorCode, meetingId } = await meetingRoomService.joinMeeting({
      meetingNumber: joinData.meetingNumber,
      userName: joinData.displayName
    })
    if (errorCode === EnumErrorCode.OK && !!meetingId) {
      settingAction.updateSettig({
        isVideoOn: joinData.isVideoOn,
        isAudioOn: joinData.isAudioOn
      })
      router.toMeeting({ meetingId, from: 'meeting' })
    } else if (errorCode === EnumErrorCode.MeetingJoinCanceled) {
      // 用户取消
    } else {
      const msg = parseErrorCode(errorCode)
      ElMessage.error(msg)
      return
    }
  }

  return {
    userInfo,
    joinForm,
    joinData,
    joinRules,
    dialogShow,
    joinMeeting
  }
}

export default defineComponent({
  setup(props, { attrs, slots, emit }) {
    const { userInfo, joinForm, joinData, joinRules, dialogShow, joinMeeting } =
      useMeetingJoin()
    const upPage = () => {
      routerUtil.toHome()
    }
    return {
      locale,
      userInfo,
      joinForm,
      joinData,
      joinRules,
      dialogShow,
      joinMeeting,
      upPage
    }
    // const userInfo = cache.get(Keys.USER_INFO);
    // const locale = reactive(localeMixins('now') as any);
    // const data = reactive({
    //   meetingNumber: root.$route.params.number || '',
    //   userName: userInfo.name,
    //   usePersonalNumber: false,
    //   personalMeetingNumber: userInfo.personalMeetingNumber,
    //   audioEnable: false,
    //   videoEnable: false,
    //   password: '',
    //   dialogVisible: false,
    // });
    // const rules = reactive({
    //   meetingNumber: [required(locale.numberRequireTip), meetingId()],
    //   userName: [required(locale.nameRequireTip), verifyName()],
    // });
    // const loading = ref(false);
    // const formRef = ref(null);
    // watch(
    //   () => data.usePersonalNumber,
    //   (newValue: boolean) => {
    //     if (newValue) {
    //       data.meetingNumber = data.personalMeetingNumber;
    //     } else {
    //       data.meetingNumber = '';
    //     }
    //     if ((formRef as any).value) {
    //       (formRef as any).value.clearValidate(['meetingNumber']);
    //     }
    //   }
    // );
    // watch(
    //   () => data.meetingNumber,
    //   (newValue: string, oldValue: string) => {
    //     if (newValue !== oldValue && newValue !== data.personalMeetingNumber) {
    //       data.usePersonalNumber = false;
    //     }
    //   }
    // );
    // loading.value = true;
    // const joinMeeting = () => {
    //   validate(formRef, async (valid: boolean) => {
    //     if (!valid) {
    //       return;
    //     }
    //     // 58659573
    //     // await meetingService.getMeetingById(data.meetingNumber);
    //     commit();
    //   });
    // };
    // const upPage = () => {
    //   root.$router.push('/home');
    // };
    // const handleClose = () => {
    //   data.dialogVisible = false;
    // };
    // const commit = async () => {
    //   const password = data.password;
    //   const res = await req(Route.POST_meetings_join, {
    //     body: {
    //       userName: data.userName,
    //       meetingNumber: data.meetingNumber,
    //       subject: `${data.userName}${locale.meeting}`,
    //       password,
    //     },
    //   });
    //   if (res.code !== SUCCESS) {
    //     loading.value = false;
    //     let msg = locale.passwordNeed;
    //     if (res.code === PASSWORD_ERROR) {
    //       msg = locale.passwordError;
    //       data.dialogVisible = true;
    //     } else if (res.code === PASSWORD_NEED) {
    //       msg = locale.passwordNeed;
    //       data.dialogVisible = true;
    //     } else if (res.code === 30009) {
    //       msg = locale.noJoin;
    //     } else if (res.code === 30002) {
    //       msg = locale.meetingLock;
    //     }
    //     root.$message.error(msg);
    //     return;
    //   }
    //   userInfo.audioEnable = data.audioEnable;
    //   userInfo.videoEnable = data.videoEnable;
    //   cache.set(Keys.USER_INFO, userInfo);
    //   console.warn(userInfo.videoEnable);
    //   root.$router.push(`/meetingHome/${res.data.id}/true`);
    //   // root.$router.push({path:`/meetingHome/${res.data.id}`, query: {isJoin:true} as any} );
    //   handleClose();
    // };
    // return {
    //   data,
    //   rules,
    //   loading,
    //   formRef,
    //   joinMeeting,
    //   upPage,
    //   locale,
    //   handleClose,
    //   commit,
    // };
  }
})
</script>

<style lang="scss" scoped>
.now-meeting-box {
  width: 100%;
  height: 100%;
  position: relative;
  .up-page {
    position: absolute;
    top: 24px;
    left: 0px;
    width: 16px;
    height: 16px;
    background-image: url(~@/assets/images/left_arrow.png);
    cursor: pointer;
  }
  .el-form {
    margin-top: 41px;
    .self-number-check {
      margin-bottom: 20px;
    }
    .el-form-item {
      margin-bottom: 20px;
    }
    .name-item {
      margin-bottom: 30px;
    }
    .btn-item {
      position: absolute;
      bottom: 40px;
      margin-bottom: 0px;
      width: 100%;
      .el-button {
        width: 100%;
      }
    }
    .el-checkbox {
      display: block;
    }
    .audio-check,
    .video-check {
      height: 18px;
    }
    .video-check {
      margin-bottom: 10px;
    }
  }
  .join-meeting-password {
    .password-input {
      width: 100%;
      padding: 0 60px;
    }
  }
}
</style>
