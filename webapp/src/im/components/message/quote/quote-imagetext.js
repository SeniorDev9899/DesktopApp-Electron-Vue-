
import htmlLang from '../../../utils/htmlLang';
import getLocaleMixins from '../../../utils/getLocaleMixins';
import highlight from '../../../common/highlight';

const name = 'quote-imagetext-message';

export default {
    name,
    props: ['message'],
    computed: {
        content() {
            let content = this.message.content.content;
            content = htmlLang.check(content);
            content = this.RongIM.common.textMessageFormat(content);
            return highlight(content, this.keyword);
        },
    },
    mixins: [getLocaleMixins(name)],
};
