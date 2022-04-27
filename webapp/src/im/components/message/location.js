import getLocaleMixins from '../../utils/getLocaleMixins';
import templateFormat from '../../utils/templateFormat';
import Base64Util from '../../utils/Base64Media';
import encodeUrl from '../../common/encodeUrl';

const name = 'location-message';

export default {
    name,
    props: ['message', 'isMultiSelected'],
    mixins: [getLocaleMixins(name)],
    computed: {
        url() {
            let url = 'http://ditu.amap.com/search?query={{0}}&zoom=17';
            url = templateFormat(url, this.location.poi || '');
            return encodeUrl(url);
        },
        location() {
            return this.message.content;
        },
        base64() {
            const base64 = this.location.content;
            return Base64Util.concat(base64);
        },
    },
};
