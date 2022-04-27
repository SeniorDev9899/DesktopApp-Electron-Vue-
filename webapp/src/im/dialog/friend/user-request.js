/* eslint-disable no-param-reassign */
import avatar from '../../components/avatar.vue';
import utils from '../../utils';
import editAvatar from '../../components/edit-avatar.vue';
import syncdata from '../../syncdata';
import console from '../../utils/console';
import sameConversaton from '../../common/sameConversaton';
import FriendState from '../../common/FriendState';
import UserType from '../../common/UserType';
import OrgType from '../../common/OrgType';
import ErrorCode from '../../common/ErrorCode';
import verifyFriend from './verify-friend';
import { getServerConfigByChainedKey } from '../../cache/helper';

export default function (userId) {
    const displayMobile = getServerConfigByChainedKey('privacy.display_mobile');
    const options = {
        name: 'user-request',
        template: 'templates/friend/user-request.html',
        data() {
            return {
                avatarEditable: false,
                aliasEditable: false,
                user: null,
                alias: '',
                // 用户是否是当前登录用户
                isLoginUser: false,
                // 用户是否是内部员工
                isStaff: false,
                // 是否好友
                isFriend: false,
                // 是否有好友请求
                isRequesting: true,
                infoList: [],
            };
        },
        components: {
            avatar,
            'edit-avatar': editAvatar,
        },
        directives: {
            focus: {
                inserted(el) {
                    el.focus();
                },
            },
        },
        computed: {
            executiveLimit() {
                if (this.isFriend || this.$im().auth.isExecutive) {
                    return false;
                }
                if (this.user) {
                    return !!this.user.isExecutive;
                }
                return false;
            },
            showStar() {
                return (this.isStaff && !this.isLoginUser) || this.isFriend;
            },
            showEditAlias() {
                if (this.$im().auth.isStaff) {
                    if ((this.isStaff || this.isFriend) && !this.isLoginUser) {
                        return true;
                    }
                } else if (this.isFriend) {
                    return true;
                }
                return false;
            },
            userName() {
                let name = this.user.name;
                if (!this.isStaff && !this.isFriend && !this.isLoginUser && !this.isRequesting) {
                    // name = name.replace(/.(?=.)/g, '*');  //只显示最后一个字
                    name = name.replace(/.$/g, '*');
                }
                return name;
            },
            showMobile() {
                if (this.isStaff) {
                    return displayMobile || Boolean(RongIM.instance.auth.display_mobile);
                }
                return true;
            },
        },
        created() {
            const im = this.$im();
            const api = {
                user: im.dataModel.User,
                friend: im.dataModel.Friend,
                org: RongIM.dataModel.Organization,
            };
            created(this, api, userId, im);
        },
        destroyed() {
            this.$im().dataModel.User.unwatch(this.userwatch);
        },
        methods: {
            toastError(errorCode) {
                let el = null;
                if (this.$el) {
                    el = this.$el.firstChild;
                }
                this.RongIM.common.toastError(errorCode, el);
            },
            setAliasEditable() {
                setAliasEditable(this);
            },
            setAvatarEditable() {
                this.avatarEditable = true;
            },
            setAlias() {
                setAlias(this, this.RongIM.dataModel.User, this.user.id, this.alias);
            },
            cancelAlias() {
                this.alias = this.user.alias;
                this.aliasEditable = false;
            },
            setStar() {
                setStar(this, this.RongIM.dataModel.Star, userId);
            },
            unsetStar() {
                unsetStar(this, this.RongIM.dataModel.Star, userId);
            },
            startConversation() {
                startConversation(this, this.$im().$router);
            },
            srcChanged(src) {
                this.user.avatar = src;
            },
            addFriend() {
                addFriend(this);
            },
            removeFriend() {
                const context = this;
                const im = this.$im();
                const dataModel = this.RongIM.dataModel;
                const friendApi = dataModel.Friend;
                const conversationApi = dataModel.Conversation;

                context.RongIM.common.messagebox({
                    type: 'confirm',
                    message: context.locale.removeFriendBefore,
                    submitText: context.locale.btns.remove,
                    callback() {
                        console.info('TODO 删除好友');
                        const api = {
                            friend: friendApi,
                            conversation: conversationApi,
                        };
                        removeFriend(context, api, userId, im);
                    },
                });
            },
            acceptFriend() {
                acceptFriend(this, this.RongIM.dataModel.Friend, this.user.requestInfo);
            },
            close() {
                this.user = null;
            },
            fullPath(item) {
                const pathArray = [];
                item.path.map((pathItem) => {
                    pathArray.push(pathItem.name);
                    return pathItem;
                });
                return pathArray.join('/');
            },
            getFullDeptPath(item) {
                // 如果是
                if (item.type === OrgType.COMPANY) {
                    return item.name;
                }
                const subcompany = item.path[1];
                if (subcompany && subcompany.type === OrgType.COMPANY) {
                    return `${subcompany.name} - ${item.name}`;
                }
                return item.name;
            },
        },
    };
    window.RongIM.common.mountDialog(options);
}

function created(context, api, userId, im) {
    const auth = im.auth;
    if (userId === auth.id) {
        context.isLoginUser = true;
    }
    if (auth.isStaff) {
        api.user.getDetail(userId, (errorCode, user) => {
            if (errorCode) {
                context.toastError(errorCode);
                return;
            }
            context.isStaff = (user.user_type === UserType.STAFF);
            getFriendInfo(context, api, user);
            syncUserInfo(context, api, user);
        });
    } else {
        api.user.get(userId, (errorCode, user) => {
            if (errorCode) {
                context.toastError(errorCode);
                return;
            }
            context.isStaff = false;
            getFriendInfo(context, api, user);
            syncUserInfo(context, api, user);
        });
    }
    context.userwatch = function userwatch(user) {
        if (context.user && user.id === context.user.id) {
            $.extend(context.user, user);
        }
    };
    api.user.watch(context.userwatch);
}

function getUserInfoList(user, orgApi) {
    const infoList = [];
    const orgsInfo = user.orgsInfo || [];
    const cache = {};
    orgsInfo.forEach((orgInfo) => {
        // 判断第二级是否是独立子公司，是则从独立子公司开始计算
        let company = orgInfo.path[0] || {};
        const subcompany = orgInfo.path[1];
        const isAutomy = subcompany && orgApi.isAutonomyCompany(subcompany.id);
        const path = orgInfo.path.concat();
        if (isAutomy) {
            company = subcompany;
            path.shift();
        }
        const dept = {
            id: orgInfo.id,
            type: orgInfo.type,
            name: orgInfo.name,
            path,
        };
        if (cache[company.id]) {
            cache[company.id].deptList.push(dept);
        } else {
            const userInfo = $.extend({}, user, {
                companyId: company.id,
                companyName: company.name,
                deptList: [dept],
            });
            cache[company.id] = userInfo;
            infoList.push(userInfo);
        }
    });
    const majorCompanyId = user.companyId;
    sortMajorCompany(infoList, majorCompanyId);
    return infoList;
}

function syncUserInfo(context, api, user) {
    const userId = user.id;
    if (context.isStaff) {
        syncdata.staffById(userId, () => {
            api.user.getDetail(userId, (errorCode, staff) => {
                if (errorCode) {
                    getDeletedUser(api, context, userId);
                    return;
                }
                context.isStaff = (staff.user_type === UserType.STAFF);
                getFriendInfo(context, api, staff);
            });
        });
    } else {
        syncdata.userBatchById([userId], () => {
            api.user.getNewUser(userId, (errorCode, userInfo) => {
                if (errorCode) {
                    context.toastError(errorCode);
                    return;
                }
                context.isStaff = false;
                getFriendInfo(context, api, userInfo);
            });
        });
    }
}

function getFriendInfo(context, api, user) {
    const userId = user.id;
    const friendApi = api.friend;
    const orgApi = api.org;
    delete user.tel;
    context.user = user;
    const cacheFriend = friendApi.getCacheFriend(userId);
    if (cacheFriend) {
        context.isFriend = true;
        context.user.mobile = cacheFriend.tel;
    } else {
        friendApi.getFriend(userId, (errorCode, friend) => {
            if (errorCode) {
                context.isFriend = false;
                return;
            }
            context.isFriend = true;
            context.user.mobile = friend.tel;
        });
    }

    const requestInfo = friendApi.getRequest(userId);
    user.requestInfo = requestInfo;
    context.isRequesting = requestInfo && requestInfo.state === FriendState.INVITEE;
    context.infoList = getUserInfoList(user, orgApi);
}

function sortMajorCompany(list, majorCompanyId) {
    let index = 0;
    list.forEach((item, i) => {
        if (item.companyId === majorCompanyId) {
            index = i;
        }
    });
    const majorCompany = list.splice(index, 1)[0];
    if (!utils.isEmpty(majorCompany)) {
        list.unshift(majorCompany);
    }
}

// function getMethods(im, userId) {
//     const dataModel = im.dataModel;
//     const friendApi = im.dataModel.Friend;
//     const conversationApi = im.dataModel.Conversation;
//     return ;
// }

function setAliasEditable(context) {
    context.alias = context.user.alias;
    context.aliasEditable = true;
}

function setAlias(context, userApi, userId, alias) {
    userApi.setAlias(userId, alias, (errorCode) => {
        if (errorCode) {
            context.toastError(errorCode);
            return;
        }
        context.user.alias = context.alias;
        context.aliasEditable = false;
    });
}

function setStar(context, starApi, userId) {
    starApi.star(userId, (errorCode) => {
        if (errorCode) {
            context.toastError(errorCode);
            return;
        }
        context.user.star = true;
    });
}

function unsetStar(context, starApi, userId) {
    starApi.unstar(userId, (errorCode) => {
        if (errorCode) {
            context.toastError(errorCode);
            return;
        }
        context.user.star = false;
    });
}

function startConversation(context, router) {
    const path = {
        name: 'conversation',
        params: {
            targetId: context.user.id,
            conversationType: RongIMLib.ConversationType.PRIVATE,
        },
    };
    context.close();
    router.push(path);
}

function addFriend(context) {
    verifyFriend(context.user);
    context.close();
}

function removeFriend(context, api, friendId, im) {
    api.friend.delFriend(friendId, (/* errorCode, list */) => {
        // console.log('TODO 删除聊天记录', list);
        // 删除组织外人员同时删除会话列表
        api.conversation.remove(RongIMLib.ConversationType.PRIVATE, friendId);

        const params = im.$route.params;
        const conversation = {
            conversationType: RongIMLib.ConversationType.PRIVATE,
            targetId: friendId,
        };
        if (sameConversaton(params, conversation)) {
            im.$router.push({
                name: 'conversation',
                query: {
                    force: 1,
                },
            });
        }
        context.close();
    });
}

function acceptFriend(context, friendApi, request) {
    friendApi.accept(request, (errorCode, result) => {
        if (errorCode) {
            if (errorCode === ErrorCode.RCEC_FRIEND_REQUEST_TIMEOUT) {
                request.state = -1;
                // console.log('TODO 已过期');
            }
            context.toastError(errorCode);
            return;
        }
        console.log('acceptFriend', result);
        request.state = FriendState.ACCEPT;
        context.close();
    });
}
