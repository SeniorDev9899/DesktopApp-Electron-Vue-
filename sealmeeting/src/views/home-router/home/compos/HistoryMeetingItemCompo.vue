<template>
  <div class="history-meeting-item">
    <div class="el-timeline-item__tail"></div>
    <div
      class="
        el-timeline-item__node
        el-timeline-item__node--normal
        el-timeline-item__node--
      "
    ></div>
    <div class="el-timeline-item__wrapper">
      <div class="el-timeline-item__timestamp is-top">
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
          v-for="(meeting, index) in item"
          :index="index.toString()"
          :key="meeting.id"
        >
          <div class="content">
            <em class="subject">{{ meeting.subject }}</em>
            <em class="time-id">
              {{ meeting.startDateInfo.time }}
              <span v-if="meeting.endDt">- {{ meeting.endDateTime }}</span>
              <em>{{ meeting.number }}</em>
            </em>
          </div>
          <div class="btns">
            <el-button
              type="primary"
              @click="showMeetingDetail(meeting.id)"
              size="mini"
              >{{ locale.view }}</el-button
            >
            <el-button
              class="delete"
              @click="deleteMeetings(meeting.id)"
              plain
              size="mini"
              >{{ locale.delete }}</el-button
            >
          </div>
        </li>
        <li></li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import localeStore from '@/store/localeStore'
export default defineComponent({
  props: {
    item: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['viewClick', 'deleteClick'],
  setup(props, { emit }) {
    const locale = localeStore('home.base')
    const showMeetingDetail = (id: string | number) => {
      emit('viewClick', id)
    }
    const deleteMeetings = (id: string | number) => {
      emit('deleteClick', id)
    }
    return {
      locale,
      showMeetingDetail,
      deleteMeetings
    }
  }
})
</script>

<style lang="scss">
.history-meeting-item {
  width: 100%;
  // min-height: 100%;
  box-sizing: border-box;
  position: relative;
  .el-timeline-item__tail {
    position: absolute;
    height: 100%;
  }
  .el-timeline-item__node--normal,
  .el-timeline-item__tail {
    top: 30px;
  }
  .el-timeline-item__wrapper {
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
    .meeting-list {
      margin-left: -38px;
      margin-right: -10px;
      .meeting-item {
        position: relative;
        color: #2e3538;
        height: 80px;
        padding-top: 16px;
        padding-bottom: 17px;
        box-sizing: border-box;
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
          right: 5px;
          top: 0;
          width: 90px;
          height: 100%;
          .el-button {
            display: none;
            border-radius: 0px;
            margin-top: 8px;
            padding: 0px 20px !important;
          }
          .delete {
            color: rgba(0, 170, 255, 1);
            margin-top: 8px;
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
  }
}
</style>
