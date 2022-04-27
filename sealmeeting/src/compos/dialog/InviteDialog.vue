<template>
  <el-dialog
    :title="locale.title"
    v-model="visible"
    width="420px"
    @close="close"
    custom-class="invite-dialog"
    center
  >
    <div class="content" ref="copyRef">
      <div class="name-tip">{{ meName }} {{ locale.inviteTip }}</div>
      <div>
        <span>{{ locale.subject }}:</span>
        {{ detialInfo.subject }}
      </div>
      <div>
        <span>{{ locale.time }}:</span>
        {{ date }}
      </div>
      <div>
        <span>{{ locale.id }}:</span>
        {{ detialInfo.number }}
      </div>
      <div>
        <span>{{ locale.password }}:</span>
        {{ detialInfo.password }}
      </div>
      <div style="margin-top: 15px">{{ locale.clickLink }}</div>
      <div>
        <a href="javascript:void(0);">{{ meetingURL }}</a>
      </div>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button type="primary" @click="copy">{{ locale.copy }}</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script lang="ts">
import localeStore from '@/store/localeStore'
const locale = localeStore('home.invite')
import { meName } from '@/session'
import { defineComponent, ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import moment from 'moment'
import { appConfig } from '@/appConfig'
const format = (dateTime: number, format: string = 'YYYY/MM/DD HH:mm') => {
  return moment(dateTime).format(format)
}
export default defineComponent({
  name: 'invite-dialog',
  props: {
    modelValue: {
      type: Boolean
    },
    detialInfo: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['update:modelValue', 'close'],
  setup(props, { emit }) {
    // 显示和隐藏
    const visible = computed({
      get() {
        return props.modelValue
      },
      set(newVal: boolean) {
        emit('update:modelValue', newVal)
      }
    })

    // close
    const close = () => {
      visible.value = false
      emit('close')
    }

    // copy
    let copyRef = ref<HTMLElement | null>(null)
    const copy = () => {
      let str = copyRef.value!.innerText
      navigator.clipboard.writeText(str)
      ElMessage.success({
        message: '复制成功',
        type: 'success'
      })
    }

    // date
    const date = computed(() => {
      if (props.detialInfo.date) {
        return props.detialInfo.date
      } else {
        return `${format(props.detialInfo.startDt)} - ${
          props.detialInfo.endDt ? format(props.detialInfo.endDt) : ''
        }`
      }
    })

    // 邀请链接地址
    const meetingURL = computed(() => {
      return `${appConfig.meetingShareUrl}?meetingId=${props.detialInfo.id}`
    })

    return {
      visible,
      locale,
      copy,
      meName,
      date,
      meetingURL,
      close,
      copyRef
    }
  }
})
</script>

<style lang="scss">
.invite-dialog {
  .content {
    margin: 0px 16px 0px 16px;
    padding: 10px;
    background: rgba(233, 240, 244, 1);
    border-radius: 2px;
    border: 1px solid rgba(202, 205, 206, 1);
    line-height: 20px;
    .name-tip {
      margin-bottom: 20px;
    }
    div > span {
      display: inline-block;
      width: 90px;
      padding-right: 15px;
      text-align: left;
    }
  }
  .el-button {
    padding: 8px 71px;
  }
}
</style>
