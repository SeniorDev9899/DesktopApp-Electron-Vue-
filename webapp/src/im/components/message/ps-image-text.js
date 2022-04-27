import getLocaleMixins from '../../utils/getLocaleMixins';
import browserWindow from '../../browserWindow';
import buildMessage from '../../common/buildMessage';
import getContextMenuMixins from '../mixins/context-menu';

const name = 'ps-image-text-message';

export default {
    name,
    props: ['message'],
    mixins: [getContextMenuMixins(), getLocaleMixins(name)],
    computed: {
        content() {
            const content = this.message.content;
            let articles = content.articles;
            // Web SDK 与 C++ SDK 定义消息结构不一致导致
            if (content.richContentMessage && content.richContentMessage.articles) {
                articles = content.richContentMessage.articles;
            }
            return articles && articles.length > 0 ? articles[0] : {};
        },
    },
    created() {
        window.addEventListener('resize', this.handleResize);
    },
    beforeDestroy() {
        window.removeEventListener('resize', this.handleResize);
    },
    methods: {
        preview() {
            const url = this.content.url;
            browserWindow.openPSArticle(url);
        },
        forward(item) {
            const msgContent = buildMessage.RichContentMessage({
                title: item.title,
                imageUri: item.picurl,
                content: item.digest,
                url: item.url,
            });
            this.$emit('forward', { content: msgContent });
        },
        remove() {
            this.$emit('remove', this.message);
        },
        collect() {
            const message = this.message;
            const item = message.content.articles[0];
            let sourceType;
            if (+message.conversationType === 7) {
                sourceType = 3;
            }
            const params = {
                scope: 'message',
                type: 'RC:ImgTextMsg',
                search_content: item.title,
                fav_content: {
                    sender_id: message.senderUserId,
                    source_type: sourceType,
                    target_id: message.targetId,
                    content_id: message.messageUId,
                    url: '',
                    content: JSON.stringify({
                        title: item.title,
                        imageUri: item.picurl,
                        content: item.digest,
                        url: item.url,
                        messageName: 'RichContentMessage',
                    }),
                },
            };
            this.$emit('collect', params);
            this.closeContextmenu();
        },
        handleResize() {
            this.closeContextmenu();
        },
    },
};
