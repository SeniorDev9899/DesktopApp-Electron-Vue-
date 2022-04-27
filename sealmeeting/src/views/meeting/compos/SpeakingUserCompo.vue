<template>
  <div class="icon info" v-if="speakingUsers">
    <i class="mic-icon"></i>
    <span class="user-show-name">{{ speakingUsers }}</span>
  </div>
</template>
<script lang="ts">
import { meetingSetting } from '@/store/meeting'
import { computed, defineComponent } from 'vue'
export default defineComponent({
  setup() {
    const speakingUsers = computed(() => {
      return meetingSetting.speakingUsers
    })
    return {
      speakingUsers
    }
  }
})
</script>
<style lang="scss" scoped>
.icon {
  background: rgba(46, 53, 56, 1);
  border-radius: 0px 0px 0px 2px;
  opacity: 0.5;
  display: inline-block;
  font-size: 0px;
  i {
    width: 24px;
    height: 24px;
    display: inline-block;
    background-repeat: no-repeat;
    background-position: center center;
  }
  .mic-icon {
    background-image: url(~@/assets/images/mic_user.svg);
  }
}
.info {
  height: 30px;
  max-width: 450px;
  display: inline-block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  font-weight: 400;
  color: rgba(255, 255, 255, 1);
  padding: 3px 9px 3px 4px;
  z-index: 1000;
  .user-show-name {
    position: relative;
    top: -2px;
    height: 15px;
    line-height: 1;
    max-width: 390px;
    display: inline-block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .host-speaker {
    display: inline-block;
    i {
      position: relative;
      top: 7px;
    }
  }
}
</style>





