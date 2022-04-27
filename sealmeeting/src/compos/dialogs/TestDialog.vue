<template>
  <span class="dialog-footer">
    <span>a:{{ a }} b:{{ b }}</span>
    <el-button @click="cancel">取 消</el-button>
    <el-button type="primary" @click="confirm">确 定</el-button>
  </span>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import { ElButton } from 'element-plus'
import { IDialogResult } from '@/plugins/rong-dialog/types'
export default defineComponent({
  props: {
    a: Number,
    b: Number
  },
  components: {
    ElButton
  },
  setup(props, { emit }) {
    const confirm = () => {
      const result: IDialogResult = {
        action: 'confirm',
        data: {
          r: 33333
        }
      }
      emit('done', result)
    }
    const cancel = () => {
      emit('done')
    }

    return {
      confirm,
      cancel
    }
  }
})
</script>
