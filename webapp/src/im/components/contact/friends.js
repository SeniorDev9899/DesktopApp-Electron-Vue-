/* eslint-disable no-param-reassign */

import getLocaleMixins from '../../utils/getLocaleMixins';
import isEmpty from '../../utils/isEmpty';
import convertToABC from '../../utils/convertToABC';
import userProfile from '../../dialog/contact/user';
import getFileHelper from '../../dialog/file-helper';
import avatar from '../avatar.vue';

export default {
    name: 'friends',
    mixins: [getLocaleMixins('friends')],
    data() {
        return {
            isLoadDone: false,
            letter: '',
            list: [],
            fileHelper: null,
        };
    },
    computed: {
        orderFriend() {
            return this.list;
        },
        navFriend() {
            const context = this;
            const friends = {};
            context.orderFriend.forEach((item) => {
                const firstLetter = context.getFirstLetter(item.name);
                if (isEmpty(friends[firstLetter])) {
                    friends[firstLetter] = item;
                }
            });
            return friends;
        },
        showEmptyFriend() {
            return this.list.length === 0;
        },
    },
    directives: {
        scrollToLetter(el, binding) {
            const letter = $(el).data('letter');
            if (letter === binding.value) {
                el.scrollIntoView();
            }
        },
    },
    mounted() {
        initList(this, this.$im().dataModel.Friend);
    },
    methods: {
        getUsername(item) {
            const RongIM = this.RongIM;
            const common = RongIM.common;
            // eslint-disable-next-line no-underscore-dangle
            return item ? (RongIM.dataModel._Cache.alias[item.id] || common.getUsername(item)) : '';
        },
        userProfile,
        getFirstLetter(name) {
            name = name && name.charAt(0);
            const pinyinObj = convertToABC(name);
            const firstLetter = pinyinObj.first.toUpperCase();
            return firstLetter;
        },
        isNavFriend(friend) {
            const firstLetter = this.getFirstLetter(friend.name);
            const friendNav = this.navFriend[firstLetter];
            if (friendNav && friendNav.id === friend.id) {
                return true;
            }
            return false;
        },
        scrollToFriend(letter) {
            this.letter = letter;
        },
        getFileHelper,
    },
    components: {
        avatar,
    },
    destroyed() {
        cleanup(this, this.$im().dataModel.Friend);
    },
};

function getFriendList(context, friendApi) {
    const list = friendApi.getCacheList();
    if ($.isEmptyObject(list)) {
        friendApi.getList((errorCode, dataArr) => {
            context.list = dataArr;
            context.isLoadDone = true;
        });
    } else {
        context.list = list;
        context.isLoadDone = true;
    }
    friendApi.getFileHelper((error, helper) => {
        context.fileHelper = helper;
    });
}

function addFriendWatch(context, friendApi) {
    context.friendWatch = function friendWatch(result) {
        if (result.type === 'Request') {
            return;
        }
        context.list = result.list;
    };
    friendApi.watch(context.friendWatch);
}

function initList(context, friendApi) {
    getFriendList(context, friendApi);
    addFriendWatch(context, friendApi);
}

function cleanup(context, friendApi) {
    friendApi.unwatch(context.friendWatch);
}
