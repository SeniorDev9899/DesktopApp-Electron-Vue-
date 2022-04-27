/* eslint-disable no-param-reassign */
import getLocaleMixins from '../../utils/getLocaleMixins';
import utils from '../../utils';

const name = 'search';

export default {
    name,
    mixins: [getLocaleMixins(name)],
    data() {
        return {
            keyword: '',
            oldkeyword: '',
        };
    },
    watch: {
        $route() {
            this.clear();
            this.search();
        },
    },
    methods: {
        clear() {
            this.keyword = '';
            this.search();
        },
        search() {
            utils.debounce(search(this), 1000);
        },
    },
};

function search(context) {
    const im = context.$im();
    if (context.keyword === '') {
        im.$emit('getNewList');
        context.oldkeyword = '';
        return;
    }
    if (context.keyword !== context.oldkeyword) {
        const params = {
            scope: 'message',
            keyword: context.keyword,
        };
        const route = context.$route.params.id;
        if (route === 'text') {
            params.type = ['RC:TxtMsg'];
        } else if (route === 'voice') {
            params.type = ['RC:VcMsg'];
        } else if (route === 'position') {
            params.type = ['RC:LBSMsg'];
        } else if (route === 'video') {
            params.type = ['RC:ImgMsg', 'RC:SightMsg'];
        } else if (route === 'file') {
            params.type = ['RC:FileMsg'];
        } else if (route === 'link') {
            params.type = ['RC:ImgTextMsg'];
        }
        const collectApi = im.dataModel.Collect;
        collectApi.search(params, (errorcode, ids) => {
            im.$emit('keywordsearch', ids, context.keyword, route);
        });
    }
    context.oldkeyword = context.keyword;
}
