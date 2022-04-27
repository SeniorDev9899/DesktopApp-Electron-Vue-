import CallType from '../../common/CallType';
import secondToMinute from '../../utils/secondToMinute';
import getLocaleMixins from '../../utils/getLocaleMixins';
import { getServerConfig } from '../../cache/helper';

const mediaTypeMap = {
    1: 'audio',
    2: 'video',
};

const name = 'summary-message';

export default {
    name,
    props: ['message', 'isMultiSelected'],
    mixins: [getLocaleMixins(name)],
    computed: {
        type() {
            const mediaType = this.message.content.mediaType;
            return mediaTypeMap[mediaType];
        },
        isActive() {
            const status = this.message.content.status;
            return ([3, 13].indexOf(status) !== -1);
        },
        status() {
            const status = this.message.content.status;
            return this.locale.voip.summaryCodeMap[status];
        },
        content() {
            const duration = this.message.content.duration;
            let str = this.status;
            // 已接通 显示通话时间
            if (this.isActive) {
                str += secondToMinute(duration / 1000);
            }
            return str;
        },
        isUnread() {
            const status = this.message.content.status;
            // 5 未接听 11 对方取消
            const isCancel = [5, 11].indexOf(status) !== -1;
            const receivedStatus = this.message.receivedStatus;
            return receivedStatus !== RongIMLib.ReceivedStatus.LISTENED && isCancel;
        },
        isReceiver() {
            const messageDirection = this.message.messageDirection;
            return messageDirection === RongIMLib.MessageDirection.RECEIVE;
        },
    },
    methods: {
        invite() {
            if (this.isMultiSelected) {
                return;
            }
            const voipConf = getServerConfig().voip;
            const common = this.RongIM.common;
            if (!voipConf.audio_enable) {
                return;
            }
            const conversation = {
                conversationType: this.message.conversationType,
                targetId: this.message.targetId,
            };
            const userApi = this.RongIM.dataModel.User;
            const friendApi = this.RongIM.dataModel.Friend;
            const messageApi = this.RongIM.dataModel.Message;
            const isPrivate = Number(conversation.conversationType) === 1;
            if (isPrivate) {
                const canNotChat = !userApi.validateCanChat(conversation.targetId);
                if (canNotChat) {
                    friendApi.insertRFVMsg(conversation.targetId);
                    return;
                }
            }
            const mediaType = this.message.content.mediaType;
            const params = {
                conversation,
                type: mediaType,
                isPrivate: true,
            };
            const voipTip = {};
            voipTip[CallType.MEDIA_VEDIO] = this.locale.voip.videoTip;
            voipTip[CallType.MEDIA_AUDIO] = this.locale.voip.audioTip;

            RCCall.start(params, (errorCode, data) => {
                if (errorCode) {
                    common.messageToast({
                        type: 'error',
                        message: voipTip[data.type],
                    });
                }
            });

            const messageId = this.message.messageId;
            if (messageId && this.isUnread && this.isReceiver) {
                const LISTENED = RongIMLib.ReceivedStatus.LISTENED;
                this.message.receivedStatus = LISTENED;
                messageApi.setMessageReceivedStatus({
                    messageId,
                    status: LISTENED,
                });
            }
        },
    },
};
