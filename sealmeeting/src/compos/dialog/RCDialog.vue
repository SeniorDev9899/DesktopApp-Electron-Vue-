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
import { defineComponent, PropType, ref } from 'vue';
import { meetingAction } from '@/store/meeting';
import MeetingIndex from '@/compos/setting/Index.vue';

export default defineComponent({
  props: {},
  components: { MeetingIndex },
  setup() {
    const handleClose = () => {
      // meetingAction.settingUpdate({ isSettingShow: false });
    };
    const visible = ref(true);
    return {
      title: '设置',
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