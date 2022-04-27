<template>
  <div class="setting-box">
    <div class="title">{{locale.title}}</div>
    <!-- <i class="setting" @click="openSet"></i> -->
    <div class="icons">
      <div class="now-icon" @click="nowMeeting">
        <div class="img"></div>
        <em style="margin-bottom: 0px">{{ locale.nowMeeting }}</em>
      </div>
      <div class="schedule-icon" @click="scheduleMeeting">
        <div class="img"></div>
        <em>{{ locale.scheduleMeeting }}</em>
      </div>
    </div>
    <div class="line"></div>
    <div class="meetings-content">
      <ul v-rong-scroll-bar-y="scroll"  @mousewheel="scroll($event)"   ref="content">
          <li
            v-for="(item, index1) in meetingInfos"
            :index="index1.toString()"
            :key="item.id"
          >
              <div class="top-time-line">
                <em class="day">{{ item[0].startDateInfo.date }}</em>
                <span class="time">
                  <em style="padding-right: 10px">{{ locale.day }}</em>
                  {{ item[0].startDateInfo.month }}{{ locale.month }}&nbsp;{{
                    item[0].startDateInfo.dateAlias
                  }}
                </span>
              </div>
              <ul class="meeting-list">
                <li
                  class="meeting-item"
                  v-for="(meeting, index2) in item"
                  :index="index2.toString()"
                  :key="meeting.id"
                >
                  <div class="content">
                    <em class="subject">{{ meeting.subject }}</em>
                    <em class="time">
                      {{ meeting.startDateInfo.time }}
                      <span v-if="meeting.endDt"
                        >- {{ meeting.endDateTime }}</span
                      >
                    </em>
                    <em class="number">{{ meeting.number }}</em>
                  </div>
                  <div class="btns">
                    <button
                        type="button"
                        class="rong-button btn"
                        @click="openMeetDetail(meeting.id)"
                      >{{ locale.view }}</button>
                      <button
                        type="button"
                        class="rong-button btn del"
                        @click="deleteMeeting(meeting.id, index1, index2)"
                      >{{ locale.delete }}</button>
                  </div>
                </li>
                <li></li>
              </ul>

          </li>
      </ul>
    </div>
  </div>
</template>
<script src="./home.js"></script>
<style lang="scss" scoped>
.setting-box {
    position: relative;
    margin-bottom: 50px;
    .setting {
        position: absolute;
        top: 3px;
        right: 19px;
        height: 32px;
        width: 32px;
        background-image: url(/css/images/meeting_setting.svg);
        cursor: pointer;
    }
  .title {
      font-size: 18px;
      font-weight: 400;
      color: #333333;
      margin-top: 32px;
      text-align: center;
  }
  .line {
      margin: 18px 74px 15px 74px;
      border-top: 1px solid rgba(228, 230, 231, 1);
  }
  .meetings-content {
      height: 100%;
      width: 100%;
      position: absolute;
      top: 0px;
      padding-top: 180px;
      padding-bottom: 30px;
      z-index: -1;
  }
  .rong-scroll-content {
      height: 100%;
      overflow-x: hidden;
      overflow-y: auto;
      padding-left: 74px;
      padding-right: 74px;
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
    margin-top: 32px;
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
      margin-right: 228px;
    }
    .now-icon .img {
      background-image: url(/css/images/now_meeting.svg);
    }
    .schedule-icon .img {
      background-image: url(/css/images/schedule_meeting.svg);
    }
  }
}
.meeting-list {
  .meeting-item {
    position: relative;
    color: #2e3538;
    height: 80px;
    padding-top: 16px;
    padding-bottom: 17px;

    margin-left: -15px;
    margin-right: -15px;
    padding-left: 15px;
    padding-right: 15px;

    .content {
      font-size: 12px;
      font-weight: 400;
      line-height: 26px;
      // margin-right: 200px;
      min-width: 900px;
      em {
        margin-right: 89px;
        display: inline-block;
      }
      .subject {
        width: 25%;
      }
      .time {
        width: 80px;
      }
      .number {
        width: 20%;
      }
    }
    .btns {
      position: absolute;
      right: 15px;
      top: 15px;
      .btn {
        width: 90px;
        height: 30px;
        border-radius: 2px;
        border: 1px solid #E3E3E3;
        font-weight: 400;
        color: #3A91F3;
        background-color: #FBFBFD;
      }

      .del {
        color: #777777;
        margin-left: 10px;
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

.top-time-line {
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
</style>
