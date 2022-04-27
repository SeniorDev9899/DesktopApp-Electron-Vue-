import encodeUrl from '../../common/encodeUrl';
import encodeHtmlStr from '../../utils/encodeHtmlStr';
import userProfile from '../../dialog/contact/user';
import imageLoader from '../image-loader.vue';

export default {
    name: 'rich-content-message',
    props: ['message', 'collect', 'sendCollect'],
    data() {
        return {
            showUrl: '',
        };
    },
    computed: {
        user() {
            return this.message.user;
        },
        content() {
            const content = $.extend({}, this.message.content);
            content.id = content.userId;
            content.avatar = content.imageUri;
            content.content = encodeHtmlStr(content.content);
            return content;
        },
        contentUrl() {
            return encodeUrl(this.message.content.url);
        },
    },
    components: {
        imageLoader,
    },
    methods: {
        getUsername(...args) {
            return this.RongIM.common.getUsername(...args);
        },
        userProfile,
    },
    created() {
        const context = this;
        const url = encodeUrl(this.content.imageUri);
        if (!url) {
            return;
        }
        context.showUrl = this.RongIM.common.trans2Localfile(url, 'richcontent-message');
    },
};
