/* eslint-disable no-param-reassign */
import getLocaleMixins from '../../utils/getLocaleMixins';
import validate from '../mixins/validate';
import addReceivers from '../../dialog/seal-meeting/add-receiver';
import browserWindow from '../../browserWindow';
import sendPin from './share';

export default {
    name: 'meetingDetail',
    data() {
        return {
            meetInfo: {
                recordFileUrls: [],
            }, // 会议信息
            receivers: [],
            isSending: false,
        };
    },
    mixins: [getLocaleMixins('meetingDetail'), validate()],
    mounted() {
        this.getInfo();
    },
    computed: {
        currentMeetId() {
            return this.$route.params.id;
        },
        startTime() { // 开始时间
            if (this.meetInfo.startDt) {
                return moment(parseFloat(this.meetInfo.startDt)).format('YYYY/MM/DD HH:mm');
            }
            return '';
        },
        endTime() {
            if (this.meetInfo.endDt) {
                return moment(parseFloat(this.meetInfo.endDt)).format('YYYY/MM/DD HH:mm');
            }
            return '';
        },
    },
    methods: {
        getInfo() {
            const context = this;
            const meetingApi = context.$im().dataModel.Meeting;
            meetingApi.getMeetInfoById(context.currentMeetId).then((res) => {
                context.meetInfo = res;
            });
        },
        // 加入会议
        joinMeet() {
            const context = this;
            // 41358 -  【在线会议】音视频通话中，创建会议或者加入参与过的会议，仍可加入
            if (window.localStorage.getItem('videoCall') === 'isOn') {
                context.$im().RongIM.common.messagebox({
                    message: context.locale.voip.videoTip,
                });
                return;
            }
            const meetingApi = context.$im().dataModel.Meeting;
            const params = {
                meetingId: context.meetInfo.id,
                meetingNumber: context.meetInfo.number,
                subject: context.meetInfo.subject,
                password: context.meetInfo.password,
            };
            context.isSending = true;
            meetingApi.joinMeet(params).then(() => {
                context.isSending = false;
                browserWindow.openSealMeeting(context.meetInfo.id, context.$im().auth);
            }, (errorCode) => {
                context.isSending = false;
                context.$im().RongIM.common.toastError(errorCode);
            });
        },
        // 邀请
        shareMeet() {
            const context = this;
            addReceivers(this.receivers, this.receivers).done(
                (selectedReceivers) => {
                    context.meetInfo.startTime = context.startTime;
                    sendPin(context.$im(), selectedReceivers, context.meetInfo, context.locale, () => {
                        context.isSending = false;
                        context.$router.push({ name: 'pin-sent' });
                    });
                },
            );
        },
        // 删除会议
        deleteMeet() {
            const context = this;
            const meetingApi = context.$im().dataModel.Meeting;
            context.RongIM.common.messagebox(({
                message: context.locale.deleteTip,
                type: 'confirm',
                callback,
            }));
            function callback() {
                meetingApi.delete(context.meetInfo.id).then(() => {
                    context.$router.push({
                        name: 'seal-meeting',
                    });
                });
            }
        },
        upPage() {
            this.$router.push({
                name: 'seal-meeting',
            });
        },
    },
    watch: {
        $route() {
            const im = this.$im();
            im.RongIM.common.resizeNavNode(this);
        },
    },
};
