/* eslint-disable no-param-reassign */
import KEYCODE from '../../utils/KeyCode';
import console from '../../utils/console';
import FriendState from '../../common/FriendState';
import ErrorCode from '../../common/ErrorCode';
import UserType from '../../common/UserType';
import verifyFriend from './verify-friend';
import avatar from '../../components/avatar.vue';
import validate from '../../components/mixins/validate';
import userRequest from './user-request';
import removeDuplication from '../../utils/removeDuplication';

function search(context, dataModel, auth) {
    const friendApi = dataModel.Friend;
    const orgApi = dataModel.Organization;
    const userApi = dataModel.User;
    if (!context.valid()) {
        return;
    }
    context.searchDone = false;
    const promiseList = [];
    let staffList = [];
    if (/^1[0-9]{10}$/.test(context.mobile)) {
        const mobileDefer = $.Deferred();
        friendApi.search(context.mobile, (errorCode, result) => {
            // 手机号不符合规则会返回 10115 错误码，此处屏蔽
            // eslint-disable-next-line eqeqeq
            if (errorCode == '10115') {
                result = [];
            } else if (errorCode) {
                mobileDefer.reject();
                context.RongIM.common.toastError(errorCode);
                return;
            }
            staffList = staffList.concat(result);
            mobileDefer.resolve();
        });
        promiseList.push(mobileDefer.promise());
    }

    const staffnoDefer = $.Deferred();
    orgApi.searchByStaffNo(context.mobile, (errorCode, result) => {
        if (errorCode) {
            staffnoDefer.reject();
            context.RongIM.common.toastError(errorCode);
            return;
        }
        staffList = staffList.concat(result);
        staffnoDefer.resolve();
    });
    promiseList.push(staffnoDefer.promise());

    const usernameDefer = $.Deferred();
    userApi.searchByUserName(context.mobile, (errorCode, result) => {
        if (errorCode) {
            usernameDefer.reject();
            context.RongIM.common.toastError(errorCode);
            return;
        }
        staffList = staffList.concat(result);
        usernameDefer.resolve();
    });

    function callback() {
        context.searchDone = true;
        staffList.forEach((user) => {
            if (user.id === auth.id) {
                user.isLoginUser = true;
            }
            const cacheFriend = friendApi.getCacheFriend(user.id);
            if (cacheFriend) {
                user.isFriend = true;
            }
            user.isStaff = (user.user_type === UserType.STAFF);
        });
        context.userList = removeDuplication(staffList);
    }
    $.when.apply(null, promiseList).done(callback).catch((errorCode) => {
        // eslint-disable-next-line eqeqeq
        if (errorCode == '10115') {
            callback();
        }
    });
}

function acceptFriend(context, friendApi, request) {
    friendApi.accept(request, (errorCode, result) => {
        if (errorCode) {
            if (errorCode === ErrorCode.RCEC_FRIEND_REQUEST_TIMEOUT) {
                request.state = -1;
            }
            context.toastError(errorCode);
            return;
        }
        console.log('acceptFriend', result);
        request.state = FriendState.ACCEPT;
        context.close();
    });
}

export default function () {
    // const friendApi = im.dataModel.Friend;
    // const orgApi = im.dataModel.Organization;
    const options = {
        name: 'add-friend',
        template: 'templates/friend/add-friend.html',
        data() {
            return {
                show: true,
                mobile: '',
                user: null,
                userList: [],
                searchDone: false,
                isAuthStaff: this.$im().auth.isStaff,
                isLoginUser: false,
                isFriend: false,
                isStaff: false,
            };
        },
        components: {
            avatar,
        },
        mixins: [
            validate(),
        ],
        watch: {
            mobile() {
                this.userList = [];
            },
        },
        methods: {
            toastError(errorCode) {
                let el = null;
                if (this.$el) {
                    el = this.$el.firstChild;
                }
                this.RongIM.common.toastError(errorCode, el);
            },
            userProfile: userRequest,
            getUsername(...args) {
                return this.RongIM.common.getUsername(...args);
            },
            close() {
                this.show = false;
            },
            search() {
                const im = this.$im();
                search(this, im.dataModel, im.auth);
            },
            addFriend(user) {
                const friendApi = this.RongIM.dataModel.Friend;
                const requestInfo = friendApi.getRequest(user.id);
                const isRequesting = requestInfo && requestInfo.state === FriendState.INVITEE;
                if (isRequesting) {
                    acceptFriend(this, friendApi, requestInfo);
                    return;
                }
                verifyFriend(user);
                this.close();
            },
            keydown(event) {
                const context = this;
                const im = this.$im();
                const isEnter = (event.keyCode === KEYCODE.enter);
                if (isEnter) {
                    search(context, im.dataModel, im.auth);
                }
                context.searchDone = false;
                context.user = null;
                context.isLoginUser = false;
                context.isFriend = false;
            },
            userName(user) {
                let name = user.name;
                // *规则只针对访客登录搜索内部非好友
                if (!this.isAuthStaff && user.isStaff && !user.isFriend && !user.isLoginUser) {
                    name = name.replace(/.$/g, '*');
                }
                return name;
            },
        },
    };
    window.RongIM.common.mountDialog(options);
}
