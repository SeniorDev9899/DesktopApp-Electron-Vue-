import { IMessage } from '@/store/msg'
import { watch, ref, nextTick } from 'vue'
export default (msgList: IMessage[]) => {
  const msgListEleRef = ref(null)
  watch(
    () => msgList.length,
    (value, preValue) => {
      if (value > preValue) {
        let msgListEle = msgListEleRef.value! as HTMLElement
        nextTick(() => {
          msgListEle.scrollTop = msgListEle.scrollHeight
        })
      }
    }
  )
  return {
    msgListEleRef
  }
}
