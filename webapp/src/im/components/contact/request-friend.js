/* eslint-disable no-param-reassign */
import FriendState from '../../common/FriendState';
import ErrorCode from '../../common/ErrorCode';
import getLocaleMixins from '../../utils/getLocaleMixins';
import userRequest from '../../dialog/friend/user-request';
import avatar from '../avatar.vue';

export default {
    name: 'request-friend',
    mixins: [getLocaleMixins('request-friend')],
    data() {
        return {
            isLoadDone: false,
            list: [],
        };
    },
    computed: {
        unreadCount() {
            return this.$im().requestUnReadCount;
        },
        showEmptyFriend() {
            return this.list.length === 0;
        },
    },
    mounted() {
        initList(this, this.$im().dataModel.Friend);
    },
    methods: {
        getUsername(...args) {
            return this.RongIM.common.getUsername(...args);
        },
        userProfile: userRequest,
        showAccept(item) {
            return showAccept(this, item);
        },
        showAdded(item) {
            return showAdded(this, item);
        },
        showOverDate(item) {
            return showOverDate(this, item);
        },
        showRequest(item) {
            return showRequest(this, item);
        },
        acceptFriend(request) {
            acceptFriend(this, this.$im().dataModel.Friend, request);
        },
    },
    components: {
        avatar,
    },
    destroyed() {
        cleanup(this, this.$im().dataModel.Friend);
    },
};


function clearUnread(context, friendApi) {
    if (context.unreadCount === 0) {
        return;
    }
    friendApi.clearUnread((/* errorCode */) => {
    });
}

function getRequestList(context, friendApi) {
    const list = friendApi.getCacheRequest();
    if ($.isEmptyObject(list)) {
        friendApi.getRequestList((errorCode, dataArr) => {
            context.list = dataArr;
            context.isLoadDone = true;
        });
    } else {
        context.list = list;
        context.isLoadDone = true;
    }
}

function addRequestWatch(context, friendApi) {
    context.requestWatch = function requestWatch(result) {
        if (result.type === 'Friend') {
            return;
        }
        context.list = result.list;
    };
    friendApi.watch(context.requestWatch);
}

function initList(context, friendApi) {
    clearUnread(context, friendApi);
    getRequestList(context, friendApi);
    addRequestWatch(context, friendApi);
}

function showAccept(context, item) {
    const isInviteState = item.state === FriendState.INVITEE;
    return isInviteState && !showOverDate(context, item);
}

function showAdded(context, item) {
    // console.log('TODO 需要跟产品确认显示细节');
    const state = item.state;
    const isAccept = (state === FriendState.ACCEPT);
    const isAcceptee = (state === FriendState.ACCEPTEE);
    return isAccept || isAcceptee;
}
function showRequest(context, item) {
    const state = item.state;
    return state === FriendState.INVITE;
}
function showOverDate(context, item) {
    /* var state = item.state;
    return state === -1; */
    const isInviteState = item.state === FriendState.INVITEE;
    const spanDay = (new Date() - new Date(item.create_dt)) / (24 * 3600 * 1000);
    const isExpire = spanDay > 7;
    return isInviteState && isExpire;
}

function acceptFriend(context, friendApi, request) {
    friendApi.accept(request, (errorCode) => {
        if (errorCode) {
            if (errorCode === ErrorCode.RCEC_FRIEND_REQUEST_TIMEOUT) {
                request.state = -1;
            }
            context.RongIM.common.toastError(errorCode);
            return;
        }
        request.state = FriendState.ACCEPT;
    });
}

function cleanup(context, friendApi) {
    friendApi.unwatch(context.requestWatch);
}

/*

function delRequest(context, friendApi, requestId) {
    friendApi.delRequest(requestId, function(result){
        if(result.success){
            console.log(result);
        }
    });
}

function delAllRequest(context, friendApi) {
    friendApi.delAllRequest(function(result){
        if(result.success){
            console.log(result);
        }
    });
}
*/
