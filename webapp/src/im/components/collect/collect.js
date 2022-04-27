/* eslint-disable no-param-reassign */
import getLocaleMixins from '../../utils/getLocaleMixins';
import utils from '../../utils';

const name = 'collectList';

export default {
    name,
    mixins: [getLocaleMixins(name)],
    data() {
        const collectApi = this.$im().dataModel.Collect;
        return {
            showAll: true,
            collectList: [],
            typeList: collectApi.typeList,
            keyword: '',
        };
    },
    computed: {
        showText() {
            return this.typeList.indexOf('RC:TxtMsg') > -1;
        },
        showVoice() {
            return this.typeList.indexOf('RC:VcMsg') > -1;
        },
        showPosition() {
            return this.typeList.indexOf('RC:LBSMsg') > -1;
        },
        showFile() {
            return this.typeList.indexOf('RC:FileMsg') > -1 || this.typeList.indexOf('LRC:fileMsg') > -1;
        },
        showVideo() {
            return this.typeList.indexOf('RC:ImgMsg') > -1
                || this.typeList.indexOf('RC:SightMsg') > -1
                || this.typeList.indexOf('RC:GIFMsg') > -1;
        },
        showLink() {
            return this.typeList.indexOf('RC:ImgTextMsg') > -1;
        },
    },
    mounted() {
        const context = this;
        const im = this.$im();
        const typeList = this.typeList;
        if (!typeList || typeList.length === 0) {
            getList(context);
        }

        im.$on('collectList', () => {
            getList(context);
        });
        this.$router.push('/collect/all');
    },
    beforeDestroy() {
        const im = this.$im();
        im.$off('collectList');

        im.$off('collectlength');
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

let oldkeyword = '';
function search(context) {
    if (context.keyword !== oldkeyword) {
        context.$im().$emit('collectKeywordsearch', context.$route.params.id, context.keyword);
    }
    oldkeyword = context.keyword;
}


function getList(context) {
    const im = context.$im();
    const common = context.RongIM.common;
    const dataModel = im.dataModel;
    const collectApi = dataModel.Collect;
    const params = {
        version: -1,
        scope: 'message',
    };
    collectApi.getList(params, (errorcode, list) => {
        if (errorcode) {
            common.toastError(errorcode);
            context.Busy = false;
            return;
        }
        context.collectList = list;
        const arr = list.map(item => item.objectName);
        context.typeList = arr.filter((x, index, self) => self.indexOf(x) === index);
        context.showAll = true;
        if (arr.length === 0) {
            return;
        }
        const count = arr.reduce((allElements, ele) => {
            if (ele in allElements) {
                allElements[ele] += 1;
            } else {
                allElements[ele] = 1;
            }
            return allElements;
        }, {});
        im.$emit('collectlength', count, list);
        dataModel.Collect.typeList = context.typeList;
    });
}
