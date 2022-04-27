/* eslint-disable no-param-reassign */
import drag from '../../drag';
import utils from '../../utils';
import avatar from '../../components/avatar.vue';
import editAvatar from '../../components/edit-avatar.vue';
import getFullscreen from '../../components/mixins/fullscreen';
import syncdata from '../../syncdata';
import UserState from '../../common/UserState';
import UserType from '../../common/UserType';
import OrgType from '../../common/OrgType';
import sameConversaton from '../../common/sameConversaton';
import config from '../../config';
import { download } from '../../download';
import verifyFriend from '../friend/verify-friend';
import { getServerConfigByChainedKey } from '../../cache/helper';

let isBusy = false;

export default function (userId, isMultiSelected, closeFuc, disabledEdit) {
    const RongIM = window.RongIM;
    if (isBusy || isMultiSelected) {
        return;
    }
    isBusy = true;

    const displayMobile = getServerConfigByChainedKey('privacy.display_mobile');
    const options = {
        name: 'user',
        template: '#rong-template-user',
        data() {
            return {
                avatarEditable: false,
                aliasEditable: false,
                user: null,
                infoList: [],
                alias: '',
                // 用户是否是当前登录用户
                isLoginUser: false,
                // 用户是否是内部员工
                isStaff: false,
                // 是否好友
                isFriend: false,
                disabledEdit,
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
            showMobile() {
                if (this.isStaff) {
                    return displayMobile || Boolean(RongIM.instance.auth.display_mobile);
                }
                return true;
            },
            executiveLimit() {
                if (RongIM.instance.auth.isExecutive || this.isLoginUser) {
                    return false;
                }
                if (this.user && this.user.isExecutive) {
                    return !!this.user.isExecutive;
                }
                // 43049 - 【个人信息】高管用户个人资料的电话没有密文显示
                return true;
            },
            showStar() {
                return !this.isLoginUser && (this.isStaff || this.isFriend);
            },
            showEditAlias() {
                if (RongIM.instance.auth.isStaff) {
                    if ((this.isStaff || this.isFriend) && !this.isLoginUser) {
                        return true;
                    }
                } else if (this.isFriend) {
                    return true;
                }
                return false;
            },
            showStartCoversation() {
                return !this.isLoginUser && (this.isStaff || this.isFriend);
            },
            userName() {
                let name = this.user.name;
                if (!this.isStaff && !this.isFriend && !this.isLoginUser) {
                    // name = name.replace(/.(?=.)/g, '*');  //只显示最后一个字
                    name = name.replace(/.$/g, '*');
                }
                return name;
            },
            hasAvatar() {
                let cursor = 'auto';
                const user = this.user;
                if (user) {
                    // const isFileHelper = user.type === 3;
                    if (this.user.avatar && !this.isFileHelper) {
                        cursor = 'pointer';
                    } else {
                        cursor = 'auto';
                    }
                } else {
                    cursor = 'auto';
                }
                return cursor;
            },
            isDeleted() {
                return this.user && this.user.state === UserState.DELETED;
            },
            isFileHelper() {
                const user = this.user || {};
                return user.id === getServerConfigByChainedKey('file.file_transfer_robot_id');
            },
        },
        created() {
            const api = {
                org: RongIM.dataModel.Organization,
                user: RongIM.dataModel.User,
                friend: RongIM.dataModel.Friend,
                group: RongIM.dataModel.Group,
            };
            created(this, api, userId, RongIM.instance);
        },
        destroyed() {
            RongIM.dataModel.User.unwatch(this.userwatch);
        },
        methods: getMethods(RongIM.instance, userId, closeFuc),
    };

    RongIM.common.mountDialog(options);
}

function created(context, api, userId, im) {
    const auth = im.auth;

    if (userId === auth.id) {
        context.isLoginUser = true;
    }
    if (auth.isStaff) {
        api.user.get(userId, (errorCode, user) => {
            if (errorCode) {
                getDeletedUser(api, context, userId);
                return;
            }
            context.isStaff = (user.type === UserType.STAFF);
            if (!context.isStaff) {
                getFriendInfo(context, api, user);
                syncUserInfo(context, api, user);
                return;
            }
            api.user.getDetail(userId, (error, userDetail) => {
                if (error) {
                    getDeletedUser(api, context, userId);
                    return;
                }
                // orgsInfo 为空是新增员工需要同步组织机构信息 organization company department
                if (utils.isEmpty(userDetail.orgsInfo)) {
                    syncdata.allOrgs((err) => {
                        if (err) {
                            // 输出并记录错误
                            return;
                        }
                        getFriendInfo(context, api, userDetail);
                        syncUserInfo(context, api, userDetail);
                    });
                    return;
                }
                getFriendInfo(context, api, userDetail);
                syncUserInfo(context, api, userDetail);
            });
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

function getDeletedUser(api, context, userId) {
    api.user.getBatch([userId], (errorCode, users) => {
        if (errorCode) {
            context.toastError(errorCode);
            return;
        }
        context.user = users[0];
    });
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

/*
说明：多公司多部门 - 获取用户信息
备注：这里用重复数据做假数据产品暂无设计多部门不同信息的管理
*/
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

function getFriendInfo(context, api, user) {
    const friendApi = api.friend;
    const orgApi = api.org;
    const userId = user.id;
    const userApi = api.user;
    const groupApi = api.group;
    // delete user.tel;
    context.user = user;
    userApi.observerList.notify(user);
    groupApi.updateGroupMember(user);
    const cacheFriend = friendApi.getCacheFriend(userId);
    if (cacheFriend) {
        context.isFriend = true;
        context.user.mobile = cacheFriend.tel;
    } else {
        friendApi.getCacheFriend(userId, (errorCode, friend) => {
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
    context.infoList = getUserInfoList(user, orgApi);
}

function getMethods(im, userId, closeFuc) {
    const dataModel = im.dataModel;
    const friendApi = im.dataModel.Friend;
    const conversationApi = im.dataModel.Conversation;
    const messageApi = im.dataModel.Message;
    return {
        toastError(errorCode) {
            let el = null;
            if (this.$el) {
                el = this.$el.firstChild;
            }
            this.RongIM.common.toastError(errorCode, el);
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
        fullPath(item) {
            const pathArray = [];
            item.path.map((pathItem) => {
                pathArray.push(pathItem.name);
                return pathItem;
            });
            return pathArray.join('/');
        },
        setAliasEditable() {
            setAliasEditable(this);
        },
        setAvatarEditable() {
            this.avatarEditable = true;
        },
        setAlias() {
            setAlias(this, dataModel.User, this.user.id, this.alias);
        },
        cancelAlias() {
            this.alias = this.user.alias;
            this.aliasEditable = false;
        },
        setStar() {
            setStar(this, dataModel.Star, userId);
        },
        unsetStar() {
            unsetStar(this, dataModel.Star, userId);
        },
        startConversation() {
            startConversation(this, im.$router, conversationApi);
        },
        srcChanged(src, bigUrl) {
            this.user.avatar = src;
            this.user.portrait_url = src;
            this.user.portrait_big_url = bigUrl;
        },
        addFriend() {
            addFriend(this);
        },
        viewAvatar(user) {
            const hasAvatar = this.hasAvatar === 'pointer';
            if (hasAvatar) viewAvatar(this, user, im);
        },
        removeFriend() {
            const context = this;
            context.RongIM.common.messagebox({
                type: 'confirm',
                message: context.locale.removeFriendBefore,
                submitText: context.locale.btns.remove,
                callback() {
                    const api = {
                        friend: friendApi,
                        conversation: conversationApi,
                        message: messageApi,
                        star: im.dataModel.Star,
                    };
                    removeFriend(context, api, userId, im);
                },
            });
        },
        close() {
            this.user = null;
            isBusy = false;
            if (closeFuc) closeFuc();
        },
    };
}

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
        if (context.user) {
            context.user.star = false;
        }
    });
}

function startConversation(context, router, conversationApi) {
    const params = {
        conversationType: RongIMLib.ConversationType.PRIVATE,
        targetId: context.user.id,
    };
    router.push({
        name: 'conversation',
        params,
    });
    conversationApi.add(params);
    setTimeout(() => {
        const itemId = ['conversation', params.conversationType, params.targetId].join('-');
        const item = document.getElementById(itemId);
        if (item) {
            const parentHeight = item.parentNode.offsetHeight;
            const offsetTop = item.offsetTop;
            const alginWithTop = offsetTop > parentHeight;
            item.scrollIntoView(alginWithTop);
        }
    }, 50);
    context.close();
}

function addFriend(context) {
    verifyFriend(context.user);
    context.close();
}

function viewAvatar(context, user, im) {
    if (!user.portrait_big_url && !user.portrait_url && !user.avatar) {
        return;
    }
    const options = getImageOptions({
        template: '#rong-template-image-rebox',
        bigAvatar: {
            content: {
                imageUri: user.portrait_big_url || user.portrait_url || user.avatar,
            },
            uId: user.id,
        },
    });
    options.mixins = options.mixins || [];
    const localeMix = {
        computed: {
            locale() {
                const locale = config.currentLocale();
                return locale;
            },
        },
    };
    options.mixins.push(localeMix);

    const Image = Vue.extend(options);
    const instance = new Image({
        el: document.createElement('div'),
    });
    const wrap = im.$el.firstChild;
    $(wrap).append(instance.$el);
}

function clearMessages(conversationType, targetId, messageApi) {
    const params = {
        conversationType,
        targetId,
    };
    messageApi.clearMessages(params, () => {
        // 删除成功
    });
}

function removeFriend(context, api, friendId, im) {
    api.friend.delFriend(friendId, (/* errorCode, list */) => {
        // TODO: 删除聊天记录
        // utils.console.log('TODO 删除聊天记录', list);
        // 删除组织外人员同时删除会话列表, 同时删除星标
        const privateConversation = RongIMLib.ConversationType.PRIVATE;
        clearMessages(privateConversation, friendId, api.message);
        api.conversation.remove(privateConversation, friendId);
        if (context.user.star) {
            unsetStar(context, api.star, friendId);
        }
        const params = im.$route.params;
        const conversation = {
            conversationType: privateConversation,
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

function getImageOptions(options) {
    return {
        name: 'image',
        template: options.template,
        data() {
            return {
                show: true,
                loading: true,
                bigAvatar: options.bigAvatar || '',
                // 'normal' or 'full'
                size: 'normal',
                margin: 0,
                scale: 1,
            };
        },
        computed: {
            current() {
                return this.bigAvatar;
            },
            hasPrev() {
                return false;
            },
            hasNext() {
                return false;
            },
        },
        watch: {
            currentIndex() {
                this.scale = 1;
                this.margin = 0;
            },
        },
        mixins: [
            getFullscreen(),
        ],
        methods: {
            close() {
                this.show = false;
            },
            dragImg(event) {
                dragImg(this, event);
            },
            toggle() {
                const context = this;
                context.margin = 0;
                context.scale = getScale(context.$refs.img);
                context.toggleFullScreen(context.$el);
            },
            prev() {

            },
            next() {

            },
            zoomIn(STEP) {
                const MAX_SCALE = 9;
                this.scale = Math.min(MAX_SCALE, this.scale + STEP);
            },
            zoomOut(STEP) {
                const MIN_SCALE = 0.1;
                this.scale = Math.max(MIN_SCALE, this.scale - STEP);
            },
            zoom: utils.throttle(function throttleHandle(event) {
                const STEP = 0.25;
                if (event.deltaY < 0) {
                    this.zoomIn(STEP);
                } else if (event.deltaY > 0) {
                    this.zoomOut(STEP);
                }
            }, 80),
            download(message) {
                const file = utils.getFilename(message.content.imageUri);
                let filename = '';
                if (file.ext === '') {
                    filename = `${utils.getDateId()}.png`;
                }
                const downloader = download({ url: message.content.imageUri, name: filename });
                downloader.saveAs();
            },
        },
    };
}

function getScale(img) {
    getScale.size = getScale.size || {};

    const $img = $(img);
    const src = $img.attr('src');
    if (!getScale.size[src]) {
        getScale.size[src] = {
            width: $img.width(),
            height: $img.height(),
        };
    }

    const imgSize = getScale.size[src];
    const $wrap = $img.parent();
    const wrapWidth = $wrap.width();
    const wrapHeight = $wrap.height();

    let scale = 1;
    if (imgSize.width > wrapWidth) {
        const widthScale = wrapWidth / imgSize.width;
        scale = Math.min(scale, widthScale);
    }
    if (imgSize.height > wrapHeight) {
        const heightScale = wrapHeight / imgSize.height;
        scale = Math.min(scale, heightScale);
    }
    return scale;
}

function dragImg(context, event) {
    const el = event.target;
    const $el = $(el);
    const oldPosition = {
        left: parseFloat($el.css('left')),
        top: parseFloat($el.css('top')),
    };
    drag(el, event, (position) => {
        const deltaX = position.left - oldPosition.left;
        const deltaY = position.top - oldPosition.top;
        let margin = '{top}px 0 0 {left}px'.replace('{top}', deltaY);
        margin = margin.replace('{left}', deltaX);
        context.margin = margin;
    }, el.parentElement);
}
