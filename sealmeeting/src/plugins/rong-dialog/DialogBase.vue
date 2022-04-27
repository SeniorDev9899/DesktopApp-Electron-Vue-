<template>
  <div>
    <el-dialog
      v-bind="dialogAttrs"
      v-model="dialogVisible"
      @close="dialogVisible = false"
      @closed="onDialogClosed"
    >
      <component :is="compo" v-bind="compoProps" @done="onCompoDone" />
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, defineAsyncComponent, PropType } from 'vue'
import { ElDialog } from 'element-plus'
import { IDialogResult, IDialogAttrs } from './types'
export default defineComponent({
  name: 'rong-dialog',
  props: {
    compoName: {
      type: String
    },
    compoProps: {
      type: Object
    },
    dialogAttrs: {
      type: Object
    },
    resolve: {
      type: Function
    }
  },
  components: {
    ElDialog
  },
  setup({ compoName, resolve }) {
    const dialogVisible = ref(true)
    let compoResult: IDialogResult = {
      action: 'cancel',
      data: {}
    }
    const compo = defineAsyncComponent(
      () => import(`@/compos/dialogs/${compoName}.vue`)
    )
    const onCompoDone = (result: IDialogResult) => {
      Object.assign(compoResult, result)
      dialogVisible.value = false
    }
    const onDialogClosed = () => {
      resolve && resolve(compoResult)
    }
    return {
      compo,
      dialogVisible,
      onDialogClosed,
      onCompoDone
    }
  }
})
</script>
