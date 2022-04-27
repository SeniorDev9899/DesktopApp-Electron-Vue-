import Base64Util from '../../../utils/Base64Media';
import { messageIfSupportView } from '../../../utils/netEnvironment';

export default {
    name: 'quote-image-message',
    props: ['message'],
    data() {
        return {
            isGif: false,
        };
    },
    computed: {
        base64() {
            const imageMsg = this.message.content.content;
            const content = imageMsg.content;
            return Base64Util.concat(content);
        },
    },
    methods: {
        showImage() {
            this.$emit('showImage');
        },
    },
    created() {
        const context = this;
        const imageUri = context.message.content.content.imageUri || context.message.content.content.remoteUrl;
        const [url, noSupportView] = messageIfSupportView(imageUri);
        const isGif = (/.*\.gif$/i).test(imageUri);

        if (isGif) {
            this.isGif = true;
        }
        if (this.isGif) {
            this.message.content.content.remoteUrl = url;
        } else {
            this.message.content.content.imageUri = url;
        }
        this.message.noSupportView = noSupportView;

        // const url = this.message.content.content.imageUri;
        // const isGif = (/.*\.gif$/i).test(url);
        // if (isGif) {
        //     this.isGif = true;
        // }
    },
};
