<template>
  <div id="input">
    <div class="input-title">{{ tip }}</div>
    <el-form
      ref="inputForm"
      :model="inputData"
      :rules="inputRules"
      class="input-form"
    >
      <el-form-item prop="value">
        <el-input
          type="text"
          v-model="inputData.value"
          :maxlength="maxlength"
          :placeholder="placeholder"
          show-word-limit
          clearable
        ></el-input>
      </el-form-item>
    </el-form>
    <span class="dialog-footer">
      <el-button size="medium" @click="cancel">取 消</el-button>
      <el-button size="medium" type="primary" @click="confirm">确 定</el-button>
    </span>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive, ref } from 'vue'
import validators, { regs } from '@/utils/validators'
import { ElButton, ElInput, ElFormItem, ElForm } from 'element-plus'
import { IDialogResult } from '@/plugins/rong-dialog/types'

const useInputDialog = (props: any) => {
  const inputData = reactive({
    value: props.value
  })

  const inputRules = reactive({
    value: props.inputRules
  })
  const inputForm = ref(null)

  return {
    inputData,
    inputRules,
    inputForm
  }
}

export default defineComponent({
  name: 'inputDialog',
  components: {
    ElButton,
    ElForm,
    ElFormItem,
    ElInput
  },
  props: {
    tip: { type: String, default: '提示' },
    placeholder: { type: String, default: '请输入内容' },
    value: { type: String, default: '' },
    maxlength: { type: String, default: '' },
    inputRules: {
      type: Object,
      default: [
        { trigger: 'blur', message: '请输入正确内容', required: true },
        {
          trigger: 'blur',
          message: '仅支持1-10位纯数字',
          pattern: regs.smsCode
        }
      ]
    }
  },
  setup(props, { emit }) {
    const { inputData, inputForm, inputRules } = useInputDialog(props)
    const confirm = async () => {
      const isValid = await validators.validateForm(inputForm)
      if (!isValid) {
        return
      }
      const result: IDialogResult = {
        action: 'confirm',
        data: {
          value: inputData.value
        }
      }
      emit('done', result)
    }
    const cancel = () => {
      emit('done')
    }

    return {
      inputData,
      inputForm,
      inputRules,
      useInputDialog,
      confirm,
      cancel
    }
  }
})
</script>

<style lang="scss" scoped>
#input {
  overflow: hidden;
  padding: 0 20px;
}
.input-title {
  color: #606266;
  line-height: 24px;
  font-size: 14px;
  padding-bottom: 15px;
}
.input-form {
  .block {
    width: 100%;
    display: block;
  }
}
.dialog-footer {
  float: right;
  text-align: center;
}
</style>

function value(value: any): { inputData: any; inputForm: any; inputRules: any } {
  throw new Error('Function not implemented.')
}

function value(value: any): { inputData: any; inputForm: any; inputRules: any } {
  throw new Error('Function not implemented.')
}
