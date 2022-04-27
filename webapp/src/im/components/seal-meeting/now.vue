<template>
  <div class="main-container">
    <div class="content-container">
      <div class="title">{{ locale.title }}</div>
      <div class="up-page" @click="upPage"></div>
      <form>
        <div class="line-item">
          <label>{{ locale.subjectTitle }}：</label>
          <input
            name="subject"
            data-rule-required="true"
            :data-message-required="locale.subjectPlaceholder"
            class="rong-field"
            v-model="meetingInfo.subject"
            :class="{'input-error': errors.subject}"
            :placeholder="locale.subjectPlaceholder"
            disabled="true"
          />
          <div v-if="errors.subject" class="input-message-error">{{errors.subject}}</div>
        </div>
        <div class="line-item">
          <label>{{ locale.number }}：</label>
          <input
            name="number"
            data-rule-required="true"
            :data-message-required="locale.numberPlaceholder"
            data-rule-number="true"
            :data-message-number="locale.numberRule"
            class="rong-field"
            v-model="meetingInfo.number"
            :class="{'input-error': errors.number}"
            :placeholder="locale.numberPlaceholder"
            :disabled="isEdit"
          />
          <div v-if="errors.number" class="input-message-error">{{errors.number}}</div>
        </div>
        <div class="join-meeting">
           {{ locale.whenJoinMeeting }}
        </div>
        <div class="open-audio-item">
          <label style="vertical-align: middle;">
             <label class="rong-checkbox">
               <input v-model="openAudio"  type="checkbox" style="display:none;"><i></i>
               <span style="padding-left: 7px;">{{locale.enableAudio}}</span>
             </label>
          </label>
        </div>
        <div class="open-video-item">
          <label style="vertical-align: middle;">
             <label class="rong-checkbox">
               <input v-model="openVideo" type="checkbox" style="display:none;"><i></i>
               <span style="padding-left: 7px;">{{locale.enableVideo}}</span>
             </label>
          </label>
        </div>
         <div class="form-buttons">
          <button
            type="button"
            class="rong-button"
            @click="joinMeet"
          >{{ locale.joinMeetingButton }}</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script src="./now.js"></script>

<style lang="scss" >
  .join-meeting {
    margin-bottom: 15px;
  }
  .open-audio-item {
    margin-bottom: 12px;
    font-size: 13px;
    color: #333333;
  }
  .open-video-item {
    margin-bottom: 12px;
    font-size: 13px;
    color: #333333;
  }
  .meeting-now-buttons {
      margin-top: 48px;
      text-align: center;
      .meeting-button {
          border-radius: 4px;
          width: 116px;
          height: 40px;
          cursor: pointer;
          background-color: #3499ff;
          color: #ffffff;
          border: 1px solid #E3E3E3;
          &:hover {
            background-color: lighten(#3499ff, 8%);
          }
          &:active {
            background-color: lighten(#3499ff, 0%);
          }
      }
      .meeting-button[disabled] {
          background-color: #cccccc;
          color: #ffffff;
      }
  }
</style>
