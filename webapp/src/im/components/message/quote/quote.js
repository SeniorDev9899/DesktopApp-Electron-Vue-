import TextMessage from './quote-text.vue';
import FileMessage from './quote-file.vue';
import ImageMessage from './quote-image.vue';
import RichContentMessage from './quote-imagetext.vue';

import htmlLang from '../../../utils/htmlLang';
import highlight from '../../../common/highlight';

export default {
    name: 'quote-message',
    props: ['message'],
    data() {
        return {
            user: null,
            text: '',
        };
    },
    components: {
        TextMessage,
        ImageMessage,
        FileMessage,
        RichContentMessage,
    },
    created() {
        const context = this;
        let content = this.message.content.text;
        content = htmlLang.check(content);
        content = this.RongIM.common.textMessageFormat(content);
        this.RongIM.common.checkAt(this.message, content, (resContent) => {
            context.text = highlight(resContent, context.keyword);
        }, this.$im().auth.id);
    },
    mounted() {
        const context = this;
        const userId = this.message.content.userId;
        this.RongIM.dataModel.User.get(userId, (error, userInfo) => {
            context.user = userInfo;
        });
    },
    computed: {
        type() {
            const typeMaping = {
                'RC:TxtMsg': 'TextMessage',
                'RC:ImgMsg': 'ImageMessage',
                'RC:GIFMsg': 'ImageMessage',
                'RC:ImgTextMsg': 'RichContentMessage',
                'RC:FileMsg': 'FileMessage',
            };
            return typeMaping[this.message.content.objName];
        },
        isGroup() {
            return this.message.conversationType === RongIMLib.ConversationType.GROUP;
        },
    },
    methods: {
        getGroupUsername(user) {
            const groupId = this.message.targetId;
            return this.RongIM.common.getGroupUsername(user, groupId);
        },
        getUsername(user) {
            return this.RongIM.common.getUsername(user);
        },
        showImage() {
            this.$emit('showImage', this.message);
        },
        clickAtUser(event) {
            const context = this;
            if (event.target.className === 'rong-at-click') {
                const userId = event.target.dataset.id;
                if (userId) {
                    context.RongIM.dialog.user(userId);
                }
            }
        },
    },
};
