/* eslint-disable no-param-reassign */
import config from '../../config';
import userProfile from '../../dialog/contact/user';
import avatar from '../avatar.vue';
import getLocaleMixins from '../../utils/getLocaleMixins';

const pageNum = config.profile.pageNum;

export default {
    name: 'contact-star',
    mixins: [getLocaleMixins('contact-star')],
    data() {
        return {
            isLoadDone: false,
            stars: [],
            pageNum,
            currentPage: 1,
        };
    },
    mounted() {
        const dataModel = this.$im().dataModel;
        const { Star: starApi, User: userApi } = dataModel;
        mounted(this, starApi, userApi);
    },
    destroyed() {
        const dataModel = this.$im().dataModel;
        const { Star: starApi, User: userApi } = dataModel;
        cleanup(this, starApi, userApi);
    },
    computed: {
        showEmptyStar() {
            return this.stars.length === 0;
        },
        pageList() {
            const end = this.currentPage * this.pageNum;
            return this.stars.slice(0, end);
        },
    },
    methods: {
        getUsername(...args) {
            return this.RongIM.common.getUsername(...args);
        },
        userProfile,
        loadMore() {
            loadMore(this);
        },
    },
    components: {
        avatar,
    },
};
function mounted(context, starApi, userApi) {
    getList(context, starApi);
    context.userChanged = function userChanged() {
        getList(context, starApi);
    };
    userApi.watch(context.userChanged);
    starApi.watch(context.userChanged);
}

function getList(context, starApi) {
    starApi.getList((errorCode, list) => {
        if (errorCode) {
            context.RongIM.common.toastError(errorCode);
            return;
        }
        context.stars = list;
        context.isLoadDone = true;
    });
}

function cleanup(context, starApi, userApi) {
    starApi.unwatch(context.userChanged);
    userApi.unwatch(context.userChanged);
}

function loadMore(context) {
    const end = context.currentPage * context.pageNum;
    const list = context.stars;
    if (list && list.length > end) {
        context.currentPage += 1;
    }
}
