import { RCResolution } from "@rongcloud/plugin-rtc";
import { reactive, readonly } from "vue";
import { SettingAction } from './SettingAction'
export interface ISettingState {
  cameraId: string,
  cameraRes: RCResolution,
  microphoneId: string,
  speakerId: string,
  isVideoOn: boolean,// 加入会议时是否打开视频
  isAudioOn: boolean,// 加入会议时是否打开音频
}
export const settingState: ISettingState = reactive({
  cameraId: '',
  cameraRes: RCResolution.W640_H480,// 分辨率
  microphoneId: '',
  speakerId: '',
  isAudioOn: false,
  isVideoOn: false
})
export const settingAction = new SettingAction()