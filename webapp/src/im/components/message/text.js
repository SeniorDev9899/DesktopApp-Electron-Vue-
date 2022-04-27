import htmlLang from '../../utils/htmlLang';
import highlight from '../../common/highlight';

export default {
    name: 'text-message',
    props: ['message', 'keyword', 'height', 'detail', 'conversation_type'],
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
        let content = this.message.content.content;
        content = htmlLang.check(content);
        content = this.RongIM.common.textMessageFormat(content);
        this.RongIM.common.checkAt(this.message, content, (resContent) => {
            context.content = highlight(resContent, context.keyword);
        }, this.$im().auth.id);
    },
    methods: {
        clickAtUser(event) {
            // 43192 - 【逐条转发】逐条转发群组中@人消息至单人对话框，可以点击@人消息查看人员资料
            if ( this.conversation_type === 3) {
                const context = this;
                if (event.target.className.indexOf('rong-at-click') > -1) {
                    const userId = event.target.dataset.id;
                    if (userId) {
                        context.RongIM.dialog.user(userId);
                    }
                }
            }
        },
    },
};
