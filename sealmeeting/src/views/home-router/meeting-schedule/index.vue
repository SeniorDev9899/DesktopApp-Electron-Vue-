<template>
  <div class="meeting-schedule-container">
    <div class="title">{{ locale.title }}</div>
    <i class="up-page" @click="upPage"></i>
    <el-form labelPosition="top" :model="data" :rules="rules" ref="formRef">
      <el-form-item prop="subject" :label="locale.subject">
        <el-input clearable v-model="data.subject" :maxlength="20" />
      </el-form-item>
      <el-form-item prop="startDt" :label="locale.startTime">
        <el-date-picker
          v-model="data.startDt"
          type="datetime"
          format="YYYY-MM-DD HH:mm"
          :placeholder="locale.timeTip"
          popper-class="data-picker"
          :disabledDate="pickerOptions"
          clearable
          :style="{ width: '100%' }"
        >
        </el-date-picker>
      </el-form-item>
      <el-form-item prop="duration" :label="locale.duration">
        <el-select v-model="data.duration" :style="{ width: '100%' }">
          <el-option
            v-for="item in durationTimes"
            :key="item"
            :value="item"
          ></el-option>
        </el-select>
      </el-form-item>
      <el-form-item prop="password" :label="locale.password">
        <el-row>
          <el-col :span="6">
            <el-checkbox v-model="data.passwordMode">{{
              locale.startPassword
            }}</el-checkbox>
          </el-col>
          <el-col :span="18">
            <el-input
              clearable
              :style="{ width: '100%' }"
              :maxlength="6"
              :minlength="4"
              :disabled="!data.passwordMode"
              v-model="data.password"
            />
          </el-col>
        </el-row>
      </el-form-item>
      <el-form-item class="btn-item">
        <el-button type="primary" :loading="loading" @click="submit">
          {{ locale.schedule }}
        </el-button>
      </el-form-item>
    </el-form>
    <InviteDialog
      @close="upPage"
      v-model="isInviteShow"
      :detialInfo="meetingInfo"
    ></InviteDialog>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, reactive, toRefs } from 'vue'
import localeStore from '@/store/localeStore'
import InviteDialog from '@/compos/dialog/InviteDialog.vue'
import { useCommon, useForm, useDialog } from './hooks/useMeetingSchedule'
const locale = localeStore('home.schedule')

export default defineComponent({
  components: {
    InviteDialog
  },
  methods: {},
  setup() {
    const { upPage, loading, durationTimes, pickerOptions } = useCommon()
    console.log(useCommon())
    const { data, rules, formRef, submit, meetingInfo } = useForm()

    const isInviteShow = computed(() => {
      return !!meetingInfo.id
    })

    return {
      locale,
      upPage,
      data,
      rules,
      loading,
      submit,
      formRef,
      durationTimes,
      pickerOptions,
      meetingInfo,
      isInviteShow
    }
  }
})
</script>

<style lang="scss" scoped>
.meeting-schedule-container {
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

    .btn-item {
      position: absolute;
      bottom: 40px;
      margin-bottom: 0px;
      width: 100%;

      .el-button {
        width: 100%;
      }
    }

    .radio-auto,
    .radio-self {
      height: 18px;
      display: block;
    }

    .radio-auto {
      margin-bottom: 10px;
    }

    .date-unit {
      font-size: 14px;
      font-weight: 400;
      padding-left: 10px;
    }

    .el-form-item {
      margin-bottom: 28px;
    }
  }
}
</style>