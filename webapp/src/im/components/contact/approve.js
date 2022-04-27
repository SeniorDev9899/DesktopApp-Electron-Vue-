/* eslint-disable no-param-reassign */
import getLocaleMixins from '../../utils/getLocaleMixins';
import userProfile from '../../dialog/contact/user';
import avatar from '../avatar.vue';
import getContextMenu from '../mixins/context-menu';

export default {
    name: 'contact-approve',
    data() {
        return {
            isLoadDone: false,
            approveList: [],
        };
    },
    computed: {
        showEmptyGroup() {
            return this.groups.length === 0;
        },
        hasApprove() {
            return this.approveList.length > 0;
        },
    },
    mixins: [getContextHandle(), getLocaleMixins('contact-approve')],
    mounted() {
        const im = this.$im();
        const groupApi = im.dataModel.Group;
        clearApproveUnread(groupApi, im);
        initApproveList(this, groupApi);
        watchApproveDelete(im, this);
        watchVerifyNotifyMessage(this, groupApi);
    },
    destroyed() {
        const im = this.$im();
        const groupApi = im.dataModel.Group;
        unWatchVerifyNotifyMessage(this, groupApi);
    },
    filters: {
        slice(name) {
            if (!name) {
                return name;
            }
            const isChinese = /^[^\x20-\xff]+$/.test(name);
            return isChinese ? name.slice(-1) : name[0].toUpperCase();
        },
    },
    methods: {
        getReceiverStyle(approveInfo) {
            const url = `url(${approveInfo.receiverPortraitUrl})`;
            return {
                'background-image': url,
            };
        },
        getApproveStatus(approveInfo) {
            let locale = this.locale.components;
            locale = locale.approve;
            const statusMapTitle = {
                0: locale.wait,
                1: locale.already,
                2: locale.overdue,
                3: locale.invalid,
            };
            const status = approveInfo.receiver_status;
            return statusMapTitle[status];
        },
        approve(data) {
            const context = this;
            const groupApi = this.$im().dataModel.Group;
            approve(data, 1, groupApi, (err) => {
                if (err) {
                    return;
                }
                initApproveList(context, groupApi);
            });
        },
        showClearMenu() {
            const context = this;
            if (!context.hasApprove) {
                return;
            }
            const locale = context.locale;
            const groupApi = context.$im().dataModel.Group;
            context.RongIM.common.messagebox({
                type: 'confirm',
                title: locale.tips.msgboxTitle,
                message: locale.tips.clearApprove,
                submitText: locale.tips.msgboxSubmitText,
                callback() {
                    clearApproveList(context, groupApi);
                },
            });
        },
        userProfile,
    },
    components: {
        avatar,
    },
};


function clearApproveList(context, groupApi) {
    groupApi.clearApprove(() => {
        context.approveList = [];
    });
}

function clearApproveUnread(groupApi, im) {
    const hasUnread = im.approveUnReadCount > 0;
    if (hasUnread) {
        groupApi.clearApproveUnRead(() => {
            im.approveUnReadCount = 0;
        });
    }
}

function watchApproveDelete(im, context) {
    im.$on('approveDelete', (data) => {
        const index = context.approveList.indexOf(data);
        context.approveList.splice(index, 1);
    });
}

function initApproveList(context, groupApi) {
    groupApi.getApproveList((errorCode, result) => {
        context.isLoadDone = true;
        if (errorCode) {
            return;
        }
        result.forEach((approveInfo) => {
            if (approveInfo.join_info) {
                const joinInfo = JSON.parse(approveInfo.join_info);
                if (joinInfo && +joinInfo.type === 0) {
                    approveInfo.inviter_name = groupApi.getMember(joinInfo.operatorId);
                    return;
                }
            }
            approveInfo.inviter_name = approveInfo.requester_name;
        });
        context.approveList = result;
    });
}

function watchVerifyNotifyMessage(context, groupApi) {
    context.watchVerifyNotify = function watchVerifyNotify(message) {
        const messageType = message.messageType;
        const isVerifyNotifyMessage = messageType === 'GroupVerifyNotifyMessage';
        if (isVerifyNotifyMessage) {
            initApproveList(context, groupApi);
        }
    };
    groupApi.watch(context.watchVerifyNotify);
}

function unWatchVerifyNotifyMessage(context, groupApi) {
    groupApi.unwatch(context.watchVerifyNotify);
}

function getContextHandle() {
    // const im = RongIM.instance;
    // const dataModel = im.dataModel;
    // const groupApi = dataModel.Group;
    const options = {
        name: 'approve-contextmenu',
        template: 'templates/contact/approve-contextmenu.html',
        methods: {
            deleteApprove() {
                const context = this;
                const im = context.$im();
                const groupApi = im.dataModel.Group;
                const data = context.context.approve;
                approve(data, 5, groupApi, (err) => {
                    context.$emit('close');
                    if (err) {
                        return;
                    }
                    im.$emit('deleteApprove', data);
                });
            },
        },
    };
    return getContextMenu(options);
}

function approve(data, status, groupApi, callback) {
    const groupId = data.id;
    const userId = data.receiver_id;
    // 1是通过, 5是删除
    groupApi.approve(groupId, userId, status, (err) => {
        callback(err);
    });
}
