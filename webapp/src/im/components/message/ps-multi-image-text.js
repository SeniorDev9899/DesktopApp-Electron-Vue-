import browserWindow from '../../browserWindow';
import buildMessage from '../../common/buildMessage';

export default {
    name: 'ps-multi-image-text-message',
    props: ['message'],
    computed: {
        main() {
            let articles = [];
            const content = this.message.content;
            if (!content) {
                return '';
            }
            // Web SDK 与 C++ SDK 定义消息结构不一致导致
            if (content.richContentMessages) {
                articles = content.richContentMessages.articles;
            } else {
                articles = content.articles;
            }
            return articles && articles.length > 0 ? articles[0] : {};
        },
        subList() {
            let articles = [];
            const content = this.message.content;
            if (!content) {
                return '';
            }
            // Web SDK 与 C++ SDK 定义消息结构不一致导致
            if (content.richContentMessages) {
                articles = content.richContentMessages.articles;
            } else {
                articles = content.articles;
            }
            return articles.slice(1);
        },
    },
    created() {
        window.addEventListener('resize', this.handleResize);
    },
    beforeDestroy() {
        window.removeEventListener('resize', this.handleResize);
    },
    methods: {
        preview(item) {
            const url = item.url;
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
        handleResize() {
            this.closeContextmenu();
        },
        collect(item) {
            const array = this.message.content.articles;
            let index;
            for (let i = 0; i < array.length; i += 1) {
                if (item === array[i]) {
                    index = i; break;
                }
            }
            const message = this.message;
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
                    content_id: message.messageUId + index,
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
    },
};
