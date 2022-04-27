import getLocaleMixins from '../../utils/getLocaleMixins';
import groupNoticeFormat from '../../common/groupNoticeFormat';
import highlight from '../../common/highlight';

const name = 'group-notice-notify-message';

export default {
    name,
    props: ['message', 'keyword'],
    data() {
        return {
            sentStatus: RongIMLib.SentStatus,
        };
    },
    computed: {
        content() {
            let content = this.message.content.content;
            content = this.RongIM.common.textMessageFormat(content);
            content = groupNoticeFormat(content, this.locale);
            if(this.message.conversationType === 3)
                content = content.replace(/@所有人/i, '<span class="rong-at-click rong-at-onlyblue">@所有人</span>');
            else
                content = content.replace(/@所有人 /i, '');
            return highlight(content, this.keyword);
        },
    },
    mixins: [getLocaleMixins(name)],
};
