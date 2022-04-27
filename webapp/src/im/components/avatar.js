import isEmpty from '../utils/isEmpty';
import isSysUser from '../common/isSysUser';
import { getServerConfigByChainedKey } from '../cache/helper';
import { FILE_NET_TYPE, getNetUrl } from '../utils/netEnvironment';

function transUrl(common, url) {
    return common.trans2Localfile(url, 'icons');
}

function imgLoaded(common, src, callback, onerror) {
    if (!src) {
        return;
    }
    const img = new Image();
    img.onload = callback;
    img.onerror = () => {
        if (typeof onerror === 'function') {
            onerror();
        }
    };
    img.src = transUrl(common, getNetUrl(src, FILE_NET_TYPE.ALL_CONNECT));
}

// 因为server返回成员顺序是新加入的在前面，所以，需要反转数据
// function getReverseList(list) {
//     const reverseList = list.concat();
//     return reverseList.reverse();
// }

/*
 说明：头像组件，用于显示头像，包括用户头像、群组头像、文件助手头像等
 */
export default {
    name: 'avatar',
    props: ['user', 'group', 'online-status'],
    data() {
        return {
            userData: {},
            memberAvatars: [],
            avatarLoaded: false,
            // 默认设置为 true 200ms 后设置为 false 防止默认蓝色头像闪一下
            avatarLoadSuccess: true,
            groupAvatarLoadSuccess: true, // 42000 - 【windows】偶现 - 客户端出现卡顿情况，更换两次头像客户端出现蓝屏
            groupMemberavatarLoadSuccess: [],
        };
    },
    computed: {
        memberNames() {
            // 获取群组中人员姓名列表
            const memberNames = this.group.firstNine.map(item => item.name);
            return memberNames;
        },
        memberIdList() {
            // 获取群组中人员id列表
            return this.group.firstNine.map(item => item.id);
        },
        isOneMember() {
            // 群组是否只剩一个人
            return this.memberAvatars.length === 1;
        },
        validUser() {
            // 判断是否可以显示用户信息
            const user = this.user;
            if (!user) {
                return false;
            }
            return !isSysUser(user);
        },
        isFileHelper() {
            // 是否为文件助手
            const user = this.user || {};
            return user.id === getServerConfigByChainedKey('file.file_transfer_robot_id');
        },
    },
    filters: {
        slice(name) {
            // 如果没有头像，中文下显示最后一个汉字，英文下显示第一个英文字母
            if (!name) {
                return name;
            }
            const isChinese = /^[^\x20-\xff]+$/.test(name);
            return isChinese ? name.slice(-1) : name[0].toUpperCase();
        },
    },
    watch: {
        user: function onUserChanged(newValue) {
            this.setUserData(newValue);
        },
        'userData.avatar': function onAvatarChanged(newValue, oldValue) {
            const context = this;
            const avatarChanged = isEmpty(oldValue) || newValue !== oldValue;
            if (avatarChanged) {
                // 42000 - 【windows】偶现 - 客户端出现卡顿情况，更换两次头像客户端出现蓝屏
                context.avatarLoadSuccess = true;
                imgLoaded(this.RongIM.common, newValue, () => {
                    context.avatarLoadSuccess = true;
                }, () => {
                    context.avatarLoadSuccess = false;
                });
            }
        },
        'group.avatar': function onGroupAvatarChange(newValue, oldValue) {
            const context = this;
            if (isEmpty(newValue)) {
                return;
            }
            const avatarChanged = newValue !== oldValue;
            if (avatarChanged) {
                // 42000 - 【windows】偶现 - 客户端出现卡顿情况，更换两次头像客户端出现蓝屏
                context.groupAvatarLoadSuccess = true;
                imgLoaded(this.RongIM.common, newValue, () => {
                    context.groupAvatarLoadSuccess = true;
                }, () => {
                    context.avatarLoadSuccess = false;
                });
            }
        },
        'group.firstNine': function firstNineChange(newValue, oldValue) {
            const context = this;
            if (!context.group) {
                return;
            }
            const oldMemberAvatars = (oldValue || []).map(item => item.avatar);
            const memberAvatars = (newValue || []).map(item => item.avatar);
            const unchanged = JSON.stringify(oldMemberAvatars) === JSON.stringify(memberAvatars);
            // 44248 - 回滚 =>【群头像】群组内添加群成员后，修改为默认头像不变更
            if (memberAvatars.length === 0 || unchanged) {
                return;
            }
            context.memberAvatars = memberAvatars;
            if (memberAvatars.length > 0) {
                const loadSuccessArr = [];
                for (let i = 0; i < memberAvatars.length; i += 1) {
                    loadSuccessArr.push(false);
                }
                context.groupMemberavatarLoadSuccess = loadSuccessArr;
                memberAvatars.forEach((src, index) => {
                    imgLoaded(this.RongIM.common, src, () => {
                        loadSuccessArr.splice(index, 1, true);
                    });
                });
            }
        },
    },
    mounted() {
        const context = this;
        this.setUserData(context.user);
        if (context.user) {
            if (context.userData.avatar) {
                context.avatarLoadSuccess = false;
                imgLoaded(this.RongIM.common, context.userData.avatar, () => {
                    context.avatarLoaded = true;
                    context.avatarLoadSuccess = true;
                }, () => {
                    context.avatarLoaded = true;
                    context.avatarLoadSuccess = false;
                });
                // avatarLoadSuccess 默认设置为 true 200ms 后设置为 false 防止默认蓝色头像闪一下
                // setTimeout(() => {
                //     if (!context.avatarLoaded) {
                //         context.avatarLoadSuccess = false;
                //     }
                // }, 200);
            }
        }
        // 监听用户信息变更，私聊更新用户头像，群组更新群成员头像
        context.userChanged = function onUserChange(user) {
            if (!context.user && !context.group) {
                return;
            }
            if (context.user && user.id === context.user.id) {
                context.setUserData(user);
            }
            if (context.group) {
                const firstNine = context.group.firstNine || [];
                const member = firstNine.find(item => item.id === user.id);
                if (member && user.avatar !== member.avatar) {
                    Object.assign(member, {
                        avatar: user.avatar,
                    });
                    const memberAvatars = firstNine.map(item => item.avatar);
                    context.memberAvatars = memberAvatars;
                }
            }
        };
        this.$im().dataModel.User.watch(context.userChanged);
        if (context.group) {
            if (context.group.avatar) {
                imgLoaded(this.RongIM.common, context.group.avatar, () => {
                    context.groupAvatarLoadSuccess = true;
                });
            }
            const memberAvatars = (context.group.firstNine || []).map(item => item.avatar);
            context.memberAvatars = memberAvatars;
            if (memberAvatars.length > 0) {
                const loadSuccessArr = [];
                for (let i = 0; i < memberAvatars.length; i += 1) {
                    loadSuccessArr.push(false);
                }
                context.groupMemberavatarLoadSuccess = loadSuccessArr;
                memberAvatars.forEach((src, index) => {
                    imgLoaded(this.RongIM.common, src, () => {
                        loadSuccessArr.splice(index, 1, true);
                    });
                });
            }
        }
    },
    methods: {
        setUserData(val) {
            const temp = val;
            // 公众号默认头像显示加载失败时的头像而非名字首字母
            if (temp && temp.type === 2) {
                if (!temp.avatar) {
                    const location = window.location;
                    const defautlUrl = location.pathname.replace(/\/[^/]+$/g, '/css/images/person-base.png');
                    temp.avatar = location.origin + defautlUrl;
                }
            }
            if (temp) {
                this.userData = Object.assign({}, temp);
            } else {
                this.userData = temp;
            }
        },
        getThemeIndex(id) {
            // 根据id返回固定数字，用于显示头像背景色，共6种颜色
            const LENGTH = 6;
            return id ? (id.slice(-1).charCodeAt(0) % LENGTH) : 0;
        },
        getAvatar(url) {
            return transUrl(this.RongIM.common, url);
        },
    },
    destroyed() {
        // 组件销毁后，取消监听
        if (this.userChanged) {
            this.RongIM.dataModel.User.unwatch(this.userChanged);
        }
    },
};
