<template>
  <div class="main-container">
    <div class="content-container">
      <div class="title">{{ locale.title }}</div>
      <div class="up-page" @click="upPage"></div>
      <div class="meet-detail-user">{{meetInfo.creatorName}}{{locale.subjectTip1}}</div>
      <div class="meet-detail-item">
         <span class="label-title">{{locale.sender}}</span>
         {{meetInfo.creatorName}}
      </div>
      <div class="meet-detail-item">
        <span class="label-title">{{locale.time}}</span>
        {{ startTime }}<span v-if="endTime"> -    {{ endTime }}</span>
      </div>
      <div class="meet-detail-item">
         <span class="label-title">{{locale.number}}</span>
         {{meetInfo.number}}
      </div>
      <div class="meet-detail-item" v-if="meetInfo.password">
         <span class="label-title">{{locale.meetingPassword}}</span>
         {{meetInfo.password}}
      </div>
      <div class="video-content" v-rong-scroll-bar-y v-if="meetInfo.recordFileUrls && meetInfo.recordFileUrls.length > 0">
        <div class="meet-detail-item videotape" v-for="(item, index) in meetInfo.recordFileUrls"  :index="index.toString()"  :key="item.id">
          <span>{{locale.recordFile}}</span>
          <a :href="item" style="float: right;"  target="_blank">{{locale.video}}{{index + 1}}</a>
        </div>
      </div>
       <div class="form-buttons">
          <button v-if="meetInfo.status === 0"
            type="button"
            class="rong-button"
            @click="joinMeet"
          >{{ locale.joinMeetingButton }}</button>
          <button
            type="button"  v-if="meetInfo.status === 0"
            @click="shareMeet"
            class="rong-button plain"
          >{{ locale.shareMeeting }}</button>
          <button
            type="button"
            @click="deleteMeet"
            class="rong-button plain"
          >{{ locale.deleteMeeting }}</button>
        </div>
    </div>
  </div>
</template>

<script src="./detail.js"></script>

<style lang="scss" >
$meet-item-lh: 50px;
  .meet-detail-user {
    margin-bottom: 15px;
    border-bottom: 1px solid #E3E3E3;
    padding: 10px 5px 15px 10px;
    margin-top: 20px;
    font-weight: 500;
    font-size: 14px;
  }
  .meet-detail-item {
    height: $meet-item-lh;
    text-align: right;
    position: relative;
    line-height: $meet-item-lh;
    .label-title {
      position: absolute;
      left: 0;
      top: 0;
      height: 100%;
      line-height: $meet-item-lh;
    }
  }
  .video-content {
    position: relative;
    overflow-y: auto;
    height: 200px;
    padding-right: 6px;
    .videotape{
      text-align: left;
      height: 40px;
      position: relative;
      a {
        position: absolute;
        right: 0px;
        color: #5daeff;
        cursor: pointer;
        font-weight: 500;
      }
    }
  }
 .rong-scroll-bar-y {
   width: 3px;
 }

  .form-buttons {
      margin-top: 48px;
      text-align: center;
      .rong-button {
          width: 116px;
          height: 40px;
          margin-right: 10px;
          background-color: #3499ff;
          color: #ffffff;
          cursor: pointer;
          &:hover {
            background-color: lighten(#3499ff, 8%);
          }
          &:active {
            background-color: lighten(#3499ff, 0%);
          }

          &.plain {
            background-color: #fff;
            color: #3499ff;
          }
      }
      .meeting-button[disabled] {
          background-color: #cccccc;
          color: #ffffff;
      }
  }
</style>
