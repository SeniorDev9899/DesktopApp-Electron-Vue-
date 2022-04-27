<template>
  <div class="setting-box">
    <div class="title">{{ productName }}</div>
    <div class="name-avatar">
      <span>{{ meInfo.userName }}</span>
      <div @click="showSettingDialog">
        <Avatar :user="meInfo" class="user-avatar"></Avatar>
      </div>
    </div>
    <div class="icons">
      <div class="now-icon" @click="toHomeJoin">
        <div class="img"></div>
        <em style="margin-bottom: 0px">{{ locale.meetingNow }}</em>
      </div>
      <div class="schedule-icon" @click="toHomeSchedule">
        <div class="img"></div>
        <em>{{ locale.meetingSechedule }}</em>
      </div>
    </div>
    <Setting v-if="isSettingShow" />
    <div class="meetings-content">
      <HistoryMeetingCompo />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive, ref, onMounted, computed, watch } from 'vue'
import { loginAuth } from '@/store/login'
import localeStore from '@/store/localeStore'
import router from '@/utils/routerUtil'
import Avatar from '@/compos/Avatar.vue'
import { meetingAction } from '@/store/meeting'
import Setting from '@/compos/setting/SettingDialog.vue'
import HistoryMeetingCompo from './compos/HistoryMeetingCompo.vue'
import { meetingSetting } from '@/store/meeting'
import { serviceManager } from '@/core/services'
import { appConfig } from '@/appConfig'

const useMeInfo = () => {
  const meInfo = reactive({
    userId: '',
    userName: '',
    portrait: ''
  })
  watch(
    () => [loginAuth.id, loginAuth.name, loginAuth.portrait],
    () => {
      meInfo.userId = loginAuth.id
      meInfo.userName = loginAuth.name
      meInfo.portrait = loginAuth.portrait
    },
    { immediate: true }
  )
  return { meInfo }
}
export default defineComponent({
  components: {
    Avatar,
    Setting,
    HistoryMeetingCompo
  },
  setup() {
    const locale = localeStore('home.base')
    const { productName } = appConfig
    const { meInfo } = useMeInfo()
    const showSettingDialog = () => {
      meetingAction.settingUpdate({ isSettingShow: true })
    }
    let isSettingShow = computed(() => {
      return meetingSetting.isSettingShow
    })
    serviceManager.initSDK()
    return {
      locale,
      productName,
      meInfo,
      toHomeJoin: router.toHomeJoin,
      toHomeSchedule: router.toHomeSchedule,
      showSettingDialog,
      isSettingShow
    }
    // const data = reactive({
    //   isShowSetting: false,
    // });
    // const userInfo = reactive(cache.get(Keys.USER_INFO));
    // const meetingInfos = reactive([]);
    // const locale = localeStore;
    // const getHistory = async () => {
    //   const res = await req(Route.GET_meetings_history, {
    //     headers: {
    //       Authorization: userInfo.authorization,
    //     },
    //   });
    //   if (res.code !== SUCCESS) {
    //     root.$message.error(res.msg);
    //     return;
    //   }
    //   initMeetingInfos(res.data);
    // };
    // onMounted(getHistory);

    // const nowMeeting = () => {
    //   root.$router.push('/now');
    // };
    // const scheduleMeeting = () => {
    //   root.$router.push('/schedule');
    // };
    // const showMeetingDetail = (id: string) => {
    //   root.$router.push(`/meetingDetail/${id}`);
    // };
    // const deleteMeetings = async (id: string) => {
    //   // TODO 增加删除前验证，增加错误消息提示
    //   root
    //     .$confirm(locale.removeTitle, '', {
    //       confirmButtonText: locale.btnYes,
    //       cancelButtonText: locale.btnNo,
    //     })
    //     .then(
    //       async () => {
    //         const [msg, meetingInfo] = await meetingService.deleteMeetingById(
    //           id
    //         );
    //         if (msg) {
    //           return;
    //         }
    //         getHistory();
    //       },
    //       async () => {}
    //     );
    // };
    // const showSettingDialog = () => {
    // data.isShowSetting = true;
    // };

    // const initMeetingInfos = (resData: Array<any>) => {
    //   meetingInfos.splice(0, meetingInfos.length);
    //   resData.sort(function (item1: any, item2: any) {
    //     return item1.startDt - item2.startDt;
    //   });
    //   const obj = _.groupBy(resData, (item) => {
    //     item.startDateInfo = getDateInfo(item.startDt, locale);
    //     item.startDateInfo.time = format(item.startDt, 'HH:mm');
    //     item.endDateTime = format(item.endDt, 'HH:mm');
    //     return format(item.startDt, 'YYYY/MM/DD');
    //   });
    //   for (const key in obj) {
    //     meetingInfos.push(obj[key]);
    //   }
    // };
    // return {
    //   userInfo,
    //   nowMeeting,
    //   scheduleMeeting,
    //   meetingInfos,
    //   showMeetingDetail,
    //   deleteMeetings,
    //   locale,
    //   showSettingDialog,
    //   data,
    // };
  }
})

const getDateInfo = (time: number, locale: any) => {
  const startDate = new Date(time)
  const todayDate = new Date()
  const yesterDate = new Date(Date.now() - 24 * 60 * 60 * 1000)
  let dateAlias = ''
  switch (startDate.getDate()) {
    case todayDate.getDate():
      dateAlias = locale.today
      break
    case yesterDate.getDate():
      dateAlias = locale.yesterDay
      break
  }
  return {
    year: startDate.getFullYear(),
    month: startDate.getMonth() + 1,
    date: startDate.getDate(),
    dateAlias: dateAlias
  }
}
</script>

<style lang="scss" scoped>
.setting-box {
  position: relative;
  margin-right: -40px;
  margin-left: -40px;
  .name-avatar {
    position: absolute;
    top: 52px;
    right: 10px;
    div {
      display: inline-block;
    }
    span {
      line-height: 24px;
      padding-right: 8px;
      font-size: 12px;
      color: rgba(46, 53, 56, 1);
    }
    .user-avatar {
      width: 24px;
      height: 24px;
      margin: auto;
      font-size: 12px;
      line-height: 24px;
      display: inline-block;
      cursor: pointer;
    }
  }
  .meetings-content {
    border-top: 1px solid rgba(228, 230, 231, 1);
    margin-top: 30px;
    height: 450px;
    overflow: hidden;
    .details {
      padding-left: 10px;
      padding-right: 10px;
      height: 100%;
      overflow: auto;
    }
  }

  .icons .icon {
    width: 60px;
    height: 60px;
    display: inline-block;
    background: no-repeat center center;
  }
  .icons {
    margin: auto;
    text-align: center;
    margin-top: 59px;
    .now-icon,
    .schedule-icon {
      cursor: pointer;
      display: inline-block;
      .img {
        width: 60px;
        height: 60px;
      }
      em {
        display: block;
        margin-top: 10px;
      }
    }
    .now-icon {
      margin-right: 106px;
    }
    .now-icon .img {
      background-image: url(~@/assets/images/now_meeting.svg);
    }
    .schedule-icon .img {
      background-image: url(~@/assets/images/schedule_meeting.svg);
    }
  }
}
.meeting-list {
  margin-left: -38px;
  margin-right: -10px;
  .meeting-item {
    position: relative;
    color: #2e3538;
    height: 80px;
    padding-top: 16px;
    padding-bottom: 17px;
    .content {
      padding-left: 38px;
      .subject {
        display: block;
        font-weight: 500;
        font-size: 14px;
        padding-bottom: 10px;
        line-height: 20px;
        width: 200px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .time-id {
        font-size: 12px;
        font-weight: 500;
        line-height: 17px;
        em {
          padding-left: 25px;
        }
      }
    }
    .btns {
      position: absolute;
      right: 10px;
      top: 9px;
      width: 90px;
      height: 80px;
      .el-button {
        display: none;
        padding: 4px 20px;
        border-radius: 0px;
      }
      .delete {
        color: rgba(0, 170, 255, 1);
        margin-top: 10px;
        margin-left: 0px;
      }
    }
  }
  .meeting-item:hover {
    background: rgba(233, 240, 244, 0.7);
    .btns {
      .el-button {
        display: block;
      }
    }
  }
}

.el-timeline-item {
  padding-bottom: 0px;
}

.el-timeline-item__timestamp.is-top {
  height: 60px;
  color: rgba(46, 53, 56, 1);
  font-weight: 400;
  margin-bottom: 10px;
  .day {
    font-size: 36px;
    padding-right: 7px;
    line-height: 60px;
  }
  .time {
    font-size: 14px;
    display: inline-block;
    margin-top: 32px;
  }
}

.el-timeline-item__node--normal,
.el-timeline-item__tail {
  top: 30px;
}
.el-timeline .el-timeline-item:last-child .el-timeline-item__tail {
  display: block;
}

// .details::-webkit-scrollbar-thumb {display: none;}
// .details::-webkit-scrollbar {width: 0;}
</style>
