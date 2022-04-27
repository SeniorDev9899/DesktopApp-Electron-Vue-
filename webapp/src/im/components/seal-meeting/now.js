/* eslint-disable no-param-reassign */
import getLocaleMixins from '../../utils/getLocaleMixins';
import validate from '../mixins/validate';
import browserWindow from '../../browserWindow';
import cache from '../../utils/cache';
import setMeetingPassword from '../../dialog/seal-meeting/password';

export default {
    name: 'meetingNow',
    data() {
        return {
            meetingInfo: {
                subject: '',
                number: this.$route.params.number || '',
                id: this.$route.params.id || '',
                password: '',
            },
            openAudio: false, // 是否开启音频
            openVideo: false, // 是否开启视频
            isSending: false,
            isEdit: false,
        };
    },
    mixins: [getLocaleMixins('meetingNow'), validate()],
    mounted() {
        const context = this;
        initData(context);
    },
    methods: {
        upPage() {
            this.$router.push({
                name: 'seal-meeting',
            });
        },
        joinMeet() {
            const context = this;
            if (!context.valid()) {
                return;
            }
            // 41358 -  【在线会议】音视频通话中，创建会议或者加入参与过的会议，仍可加入
            if (window.localStorage.getItem('videoCall') === 'isOn') {
                context.$im().RongIM.common.messagebox({
                    message: context.locale.voip.videoTip,
                });
                return;
            }
            context.isSending = true;
            const meetingApi = context.$im().dataModel.Meeting;
            const params = {
                subject: context.meetingInfo.subject,
                meetingNumber: context.meetingInfo.number,
                meetingId: context.meetingInfo.id,
                password: context.meetingInfo.password,
            };
            meetingApi.joinMeet(params).then((res) => {
                context.isSending = false;
                browserWindow.openSealMeeting(res.id, context.$im().auth, context.openVideo, context.openAudio);
            }, (errorCode) => {
                if (errorCode === meetingApi.NEED_PASSWORD || errorCode === meetingApi.PASSWORD_ERROR) {
                    if (errorCode === meetingApi.PASSWORD_ERROR) {
                        context.$im().RongIM.common.toastError(errorCode);
                    }
                    setMeetingPassword().done((password) => {
                        context.meetingInfo.password = password;
                        context.joinMeet();
                    });
                    return;
                }
                // 同一个账号在多端加入同一个会议。
                if (errorCode === meetingApi.MULTI_PLATFORM_JOIN_MEETING || errorCode === meetingApi.SINGLE_PLATFORM_JOIN_MEETING) {
                    context.isSending = false;
                    context.$im().RongIM.common.messagebox({
                        message: context.locale[errorCode],
                    });
                    return;
                }
                context.isSending = false;
                context.$im().RongIM.common.toastError(errorCode);
            });
        },
    },
};

function initData(context) {
    context.isEdit = !!context.meetingInfo.id;
    if (context.isEdit) {
        context.$im().dataModel.Meeting.getMeetInfoById(context.meetingInfo.id).then((res) => {
            context.meetingInfo = res;
        });
    } else {
        context.meetingInfo.subject = cache.get('auth').name + context.locale.subjectTip1;
    }
}
