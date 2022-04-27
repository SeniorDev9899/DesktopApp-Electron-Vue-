export enum EnumPlatform {
  Mac = 'Mac',
  Windows = 'Windows',
  Web = 'Web'
}

export enum EnumErrorCode {
  OK = 10000, // 一切正常
  UnKnown = 99999, // 一切异常
  //-- 通用
  ParamsError = 1001,
  //-- 登录
  NewUser = 2001, // 登录成功，但是没有姓名，需要进行用户名补充
  //--IM  1100-1199
  IMOK = 1100,
  IMTokenError = 1101,
  IMError = 1199,
  //--RTC 1200-1299
  RTCOK = 1200,
  RTCClientError = 1201,
  RTCRoomError = 1202,
  RTCError = 1299,
  //--Operation--
  RecordNoVideo = 1301, // 录制时自己的视频没有打开
  //--Meeting--
  MeetingPwdRequired = 1401,
  MeetingPwdError = 1402,
  MeetingJoinCanceled = 1403 // 用户取消加入
}
