import htmlLang from '../../../utils/htmlLang';
import highlight from '../../../common/highlight';

export default {
    name: 'quote-text-message',
    props: ['message'],
    computed: {
        content() {
            let content = this.message.content.content.content;
            content = htmlLang.check(content);
            content = this.RongIM.common.textMessageFormat(content);
            return highlight(content, this.keyword);
        },
    },
};
