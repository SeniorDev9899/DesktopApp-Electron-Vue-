<template>
  <el-dialog
    :title="title"
    v-model="visible"
    width="600px"
    :before-close="handleClose"
    custom-class="meeting-setting-dialog"
  >
    <MeetingIndex />
  </el-dialog>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { meetingAction } from '@/store/meeting';
import MeetingIndex from '@/compos/setting/Index.vue';

const title = '设置';
const useDialog = () => {
  const handleClose = () => {
    meetingAction.settingUpdate({ isSettingShow: false });
  };
  return {
    visible: true,
    handleClose,
  };
};
export default defineComponent({
  name: 'Setting',
  props: {
    modelValue: {
      type: Boolean as PropType<boolean>,
      default: false,
    },
  },
  components: { MeetingIndex },
  setup() {
    let { handleClose, visible } = useDialog();
    return {
      title,
      visible,
      handleClose,
    };
  },
});
</script>
<style lang="scss">
.meeting-setting-dialog {
  .el-dialog__body {
    height: 450px;
  }
}
</style>