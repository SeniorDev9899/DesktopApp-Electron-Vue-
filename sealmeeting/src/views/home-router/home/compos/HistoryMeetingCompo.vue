<template>
  <div class="history-meeting">
    <historyMeetingItem
      v-for="item in historyList"
      :key="item.id"
      :item="item"
      @viewClick="handleItemViewClick"
      @deleteClick="handleItemDeleteClick"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from 'vue'
import { useEvents, useHistoryList } from './hooks/useHistory'
import historyMeetingItem from './HistoryMeetingItemCompo.vue'
export default defineComponent({
  name: 'history-meeting-compo',
  components: {
    historyMeetingItem
  },
  setup() {
    const historyList = ref<any[]>([])

    let { handleItemViewClick, handleItemDeleteClick } = useEvents(historyList)

    // 历史会议数组
    onMounted(() => {
      useHistoryList(historyList)
    })

    return {
      historyList,
      handleItemViewClick,
      handleItemDeleteClick
    }
  }
})
</script>
<style lang="scss">
.history-meeting {
  height: 100%;
  width: 100%;
  padding-left: 10px;
  padding-right: 10px;
  height: 100%;
  overflow: auto;
}
</style>
