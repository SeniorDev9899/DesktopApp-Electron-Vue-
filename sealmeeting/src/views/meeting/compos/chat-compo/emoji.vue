<template>
  <div class="emoji-panel">
    <span
      class="emoji-content"
      v-for="(item, index) in emojiList"
      :index="index.toString()"
      :key="index"
      :title="item.symbol"
      v-html="item.node.outerHTML"
      @click="setEmoji(item.emoji)"
    ></span>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive, ref, onMounted, watch } from 'vue'
import { imEmoji } from '@/core/services/msg/MsgService'
export default defineComponent({
  props: {
    setEmoji: Function,
    hide: Function
  },
  setup({ setEmoji, hide }, { attrs, slots, emit }) {
    const emojiList1 = imEmoji.list
    const emojiList = reactive(emojiList1)
    return { emojiList }
  }
})
</script>

<style lang="scss" scoped>
.emoji-panel {
  position: absolute;
  top: -222px;
}
</style>
