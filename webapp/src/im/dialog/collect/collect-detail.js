import dateFormat from '../../utils/dateFormat';
import TextMessage from '../../components/message/text.vue';
import VoiceMessage from '../../components/message/voice.vue';

/*
说明：收藏详情
*/
export default function (items) {
    const options = {
        name: 'ack',
        template: 'templates/collect/collect-detail.html',
        data() {
            return {
                show: true,
                style: '',
                item: items,
                self: '',
            };
        },
        filters: {
            dateFormat(timestamp) {
                return dateFormat(timestamp, {
                    alwaysShowTime: true,
                    showAll: true,
                });
            },
        },
        mounted() {
            const context = this;
            if (context.item.sourceType !== 1) {
                return;
            }
            const senderId = context.item.senderId;
            const userApi = this.$im().dataModel.User;
            const common = this.RongIM.common;
            userApi.get(senderId, (errorCode, result) => {
                if (errorCode) {
                    common.toastError(errorCode);
                    return;
                }
                context.self = result.name;
            });
        },
        methods: {
            close() {
                this.show = false;
            },
            getMessageType(item) {
                // var supported;// = childComponents[item.messageType];
                const map = {
                    LocalImageMessage: 'ImageMessage',
                    LocalFileMessage: 'FileMessage',
                };
                let messageType = item.messageType;
                messageType = map[item.messageType] || messageType;
                return messageType;
            },
        },
        components: {
            TextMessage,
            VoiceMessage,
        },
    };
    window.RongIM.common.mountDialog(options);
}
