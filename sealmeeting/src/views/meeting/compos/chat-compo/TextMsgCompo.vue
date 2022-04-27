<template>
  <div class="container-bg" :class="{ self: is_self }">
    <span class="message-text" v-html="textContent"></span>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive, ref, onMounted, watch } from 'vue'
// import { textMessageFormat } from '@/common/helpers';
export default defineComponent({
  props: {
    message: String,
    is_self: Boolean
  },
  setup({ message }, { attrs, slots, emit }) {
    // const textContent = ref(textMessageFormat(message.content.content));
    const textContent = message
    return { textContent }
  }
})
</script>

<style lang="scss" scoped>
.container-bg {
  background: #f6f6f6;
  border-radius: 2px;
  border: 1px solid #e7f6fe;
  padding: 7px 14px 8px 6px;
  max-width: 70%;
  display: inline-block;
  .message-text {
    white-space: pre-wrap;
    word-wrap: break-word;
    font-weight: 400;
    color: #2e3538;
    line-height: 17px;
    font-size: 12px;
    display: inline-block;
    text-align: left;
    max-width: 230px;
  }
}

.self {
  background: #b5e6fb7d;
}
</style>
