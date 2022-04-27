import getLocaleMixins from '../../utils/getLocaleMixins';
import { messageIfSupportView } from '../../utils/netEnvironment';

export default {
    name: 'combine-message',
    mixins: [getLocaleMixins('combine-message')],
    props: ['message'],
    data() {
        return {
            sentStatus: RongIMLib.SentStatus,
            content: '',
        };
    },
    computed: {
        style() {
            const textStyle = this.height ? `text-overflow:ellipsis;max-height:${this.height};display:block;` : '';
            return this.detail ? textStyle : `${textStyle}overflow:hidden;`;
        },
        containerStyle() {
            return this.detail ? 'overflow-y:auto;height:104px;' : '';
        },
    },
    created() {
        const context = this;
        const messageContent = this.message.content;
        const remoteUrl = messageContent.remoteUrl;
        const [url, noSupportView] = messageIfSupportView(remoteUrl);
        context.message.content.remoteUrl = url;
        context.message.noSupportView = noSupportView;
        const summaryList = messageContent.summaryList;
        const nameList = messageContent.nameList;
        const conversationType = messageContent.conversationType;
        let msg = getCombineMessageTitle(context, nameList, conversationType);
        if (summaryList) {
            for (let i = 0; i < 3; i += 1) {
                if (summaryList[i]) {
                    msg += `<p class='rong-message-item'>${summaryList[i]}</p>`;
                }
            }
        }
        msg += `<p class='rong-message-item rong-combine-bottom'>${this.locale.components.search.chatHistory}</p>`;
        context.content = msg;
    },
    methods: {
        showCombineMsg() {
            const [url, noSupportView] = messageIfSupportView(this.message.content.remoteUrl);
            if (!noSupportView) {
                this.$emit('showCombineMsg', this.message);
            } else {
                this.RongIM.common.messageToast({
                    type: 'error',
                    message: this.locale.tips.localNetError,
                });
            }
        },
    },
};

function getCombineMessageTitle(context, nameList, conversationType) {
    if (!nameList) {
        return '';
    }
    const userCount = nameList.length;
    if (conversationType === 3) {
        return `<p class="rong-combine-message-title">${context.locale.tips.combineMsgGroupTitle}</p>`;
    }
    if (userCount === 1) {
        return `<p class="rong-combine-message-title">${context.localeFormat(context.locale.tips.combineMsgOwnTitle, nameList[0])}</p>`;
    }
    return `<p class="rong-combine-message-title">${context.localeFormat(context.locale.tips.combineMsgSingleTitle, nameList[0], nameList[1])}</p>`;
}
