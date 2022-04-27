/* eslint-disable no-param-reassign */
import avatar from '../../components/avatar.vue';
import getStar from '../../components/group/group-star.vue';
import getOrg from '../../components/group/org.vue';
import getFriend from '../../components/group/group-friend.vue';

/*
说明： 选择用户信息发送已选用户名片消息
参数：
    @param {string} targetUserId 排除当前用户 id (单聊发送名片时不显示对方的名片)
*/
export default function (targetUserId) {
    const options = {
        name: 'card',
        template: 'templates/conversation/card.html',
        data() {
            let canNotSelected = [];
            if (targetUserId) {
                canNotSelected = [{
                    id: targetUserId,
                }];
            }
            return {
                show: true,
                tab: 'org',
                tip: '',
                selected: [],
                onlyStaff: true,
                canNotSelected,
                isStaff: this.$im().auth.isStaff,
            };
        },
        components: {
            avatar,
            star: getStar,
            org: getOrg,
            friend: getFriend,
        },
        watch: {
            selected(newValue, oldValue) {
                limitCount(this, newValue, oldValue);
            },
        },
        created() {
            // 登录用户非组织机构人员默认显示 'star' 面板
            if (!this.isStaff) {
                this.tab = 'star';
            }
        },
        methods: {
            close() {
                this.show = false;
            },
            setTab(tab) {
                this.tab = tab;
            },
            removeMembers(members) {
                members = [].concat(members);
                const idList = members.map(item => item.id);
                this.selected = this.selected.filter(item => idList.indexOf(item.id) < 0);
            },
            added(members) {
                const selectedIdList = this.selected.map(item => item.id);
                const addedList = members.filter(item => selectedIdList.indexOf(item.id) < 0);
                this.selected = this.selected.concat(addedList);
            },
            removed(members) {
                const idList = members.map(item => item.id);
                this.selected = this.selected.filter(item => idList.indexOf(item.id) < 0);
            },
            getUsername(...args) {
                return this.RongIM.common.getUsername(...args);
            },
            submit() {
                const im = this.$im();
                const dataModel = im.dataModel;
                const common = this.RongIM.common;
                const routeParams = im.$route.params;
                const conversationType = parseInt(routeParams.conversationType);
                const targetId = routeParams.targetId;
                // 已选用户信息，名片只允许选择 1 个取数组第一个即可
                const user = this.selected[0];
                const params = {
                    conversationType,
                    targetId,
                    user: {
                        userId: user.id,
                        name: user.name,
                        portraitUri: user.avatar,
                        sendUserId: im.loginUser.id,
                        sendUserName: im.loginUser.name,
                        extra: '',
                        type: user.type,
                    },
                };
                sendCardMessage(dataModel.Message, params, common);
                this.close();
            },
        },
    };
    window.RongIM.common.mountDialog(options);
}


/*
说明： 限制选择成员个数
*/
function limitCount(context, newValue, oldValue) {
    // 最多选择成员个数
    const MAX = 1;
    // 已选择成员个数
    const length = context.selected.length;
    if (length > MAX) {
        context.$nextTick(() => {
            context.selected = oldValue;
        });
        // tip 错误提示
        clearTimeout(limitCount.timer);
        context.tip = context.RongIM.common.getErrorMessage('card-limit');
        limitCount.timer = setTimeout(() => {
            context.tip = '';
            context.selected = oldValue;
        }, 1500);
    }
}

/*
说明： 发送名片消息
*/
function sendCardMessage(messageApi, params, common) {
    if (sendCardMessage.busy) {
        return;
    }
    sendCardMessage.busy = true;
    messageApi.sendCard(params, (errorCode) => {
        sendCardMessage.busy = false;
        if (errorCode) {
            /*
            42531 -【会话聊天】断网后发送个人名片提示“错误码：lib-30003”
            */
            const ignoreErrorCodeMap = [
                'lib--1',
                'lib-30001',
                'lib-30003',
            ];
            const existed = ignoreErrorCodeMap.indexOf(errorCode) >= 0;
            if (existed) {
                return;
            } else {
                common.toastError(errorCode);
            }
        }
    });
}
