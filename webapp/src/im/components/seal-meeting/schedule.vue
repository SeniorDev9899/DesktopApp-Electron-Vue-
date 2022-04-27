<template>
  <div class="main-container" @click="closeSelectTime($event)">
    <div class="content-container">
      <div class="title">{{ locale.title }}</div>
      <div class="up-page" @click="upPage"></div>
      <form>
        <div class="line-item">
          <label>{{ locale.subject }}</label>
          <input
            name="subject"
            data-rule-required="true"
            :data-message-required="locale.subjectPlaceholder"
            data-rule-subject="true"
            :data-message-subject="locale.subjectRule"
            class="rong-field"
            v-model.trim="formData.subject"
            :class="{'input-error': errors.subject}"
            :placeholder="locale.subjectPlaceholder"
          />
          <div v-if="errors.subject" class="input-message-error">{{errors.subject}}</div>
        </div>
        <div class="line-item">
          <label>{{ locale.startTime }}</label>
          <input
            name="startTime"
            data-rule-required="true"
            :data-message-required="locale.timePlaceholder"
            class="rong-field"
            v-model="formData.startTime"
            :placeholder="locale.timeTip"
            @click.stop="selectSpecificTime"
            readonly
          />
          <div v-if="errors.startTime" class="input-message-error">{{errors.startTime}}</div>
           <div class="time-select">
            <div
              class="rong-pin-select-sepcific-time"  v-if="isSpecificTimeSelecting"
            >
              <div
                class="rong-pin-sepcific-time-content"
                v-for="(item, index) in getDateItems()"
                :key="index"
                :id="index"
              >
                <div
                  class="rong-pin-specific-t"
                  :class="{
                      'rong-pin-specific-year': index == 0
                  }"
                >
                  <a href @click.prevent="calcDate(index, 1)">﹢</a>
                  <p>{{ getFormatDate(index) }}</p>
                  <a href @click.prevent="calcDate(index, -1)">﹣</a>
                </div>
                <p class="rong-pin-specific-mark">{{ item }}</p>
              </div>
            </div>
           </div>

        </div>
        <div class="line-item">
          <label>{{ locale.duration }}</label>
          <customSelect v-model="formData.duration"  :nameKey="'label'"
                :valueKey="'value'"
              :list="durationList">
          </customSelect>
          <!-- <span style="padding-left: 10px;">{{ locale.hour }}</span> -->
        </div>
        <div class="line-item">
          <label style="vertical-align: middle;">
            <div>{{ locale.password }}</div>
             <label class="rong-checkbox">
               <input  type="checkbox" v-model="formData.enablePassword" style="display:none;"><i></i>
               <span style="padding-left: 7px;">{{ locale.enablePassword }}</span>
             </label>
          </label>

           <input
            name="meetingpassword"
            class="rong-field"
            v-model="password"
            :class="{'input-error': formData.enablePassword && errors.password}"
            :disabled="!formData.enablePassword"
          />
            <div v-if="formData.enablePassword && errors.password" class="input-message-error">{{errors.password}}</div>
        </div>
        <div class="line-item relative-line" style="height: 25px;">
          <label>{{ locale.inviteUsers }}</label>
          <span class="position-right">
            {{
            localeFormat(locale.invitedUsers, receivers.length)
            }}
          </span>
        </div>
        <div class="rong-members">
          <ul class="rong-clearfix" v-rong-scroll-bar-y>

            <li
              v-for="(user, index) in receivers"
              :key="user.id"
              :id="user.id"
              style="position: relative;"
            >
              <a href="javascript:;" @click.prevent="userProfile(user.id)">
                <avatar :user="user" class="rong-avatar-small"></avatar>
                <div class="rong-members-username" :title="user.adivas">
                  <em v-html="user.name"></em>
                </div>
              </a>
              <i class="rong-item-remove" @click="removeReceiver(index)"></i>
            </li>
            <li>
              <a
                href="javascript:;"
                class="rong-conversation-add"
                :title="locale.btns.add"
                @click.prevent="addMembers"
              ></a>
            </li>
          </ul>
        </div>
        <div class="form-buttons" style="margin-top: 20px;">
          <button
            type="button"
            class="rong-button"
            :disabled="receivers.length === 0"
            @click="sendPinMeeting"
          >{{ locale.schedule }}</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script src="./schedule.js"></script>
