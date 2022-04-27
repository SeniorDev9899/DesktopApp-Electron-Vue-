/* eslint-disable no-param-reassign */
import avatar from '../avatar.vue';
import GroupPermission from '../../utils/GroupPermission';
import isEmpty from '../../utils/isEmpty';
import getLocaleMixins from '../../utils/getLocaleMixins';

/*
说明： 群公告，查看发布群公告
*/
export default {
    name: 'group-notice',
    props: ['group'],
    mixins: [getLocaleMixins('group-notice')],
    data() {
        const params = this.$im().$route.params;
        return {
            backupConent: '',
            user: {},
            time: 0,
            isModifying: false,
            content: '',
            conversationType: +params.conversationType,
            targetId: params.targetId,
        };
    },
    components: {
        avatar,
    },
    beforeDestroy() {
        this.$im().$off('imclick', this.close);
    },
    mounted() {
        const context = this;
        const im = this.$im();
        const dataModel = im.dataModel;
        im.$on('imclick', (event) => {
            close(context, event);
        });
        const groupNoticeApi = dataModel.GroupNotice;
        const params = {
            id: context.targetId,
        };
            // 获取群公告信息： 发布人 发布时间 内容。缓存内容（ backupConent ）取消编辑时恢复原内容。
        groupNoticeApi.get(params, (errorCode, notice) => {
            if (errorCode) {
                notice = {
                    user: {},
                    content: '',
                    createDt: 0,
                };
            }
            context.user = notice.user;
            const content = notice.content;
            context.content = content;
            context.backupConent = content;
            context.time = moment(notice.create_dt).format('YYYY/M/D HH:mm');
        });
    },
    directives: {
        focus: {
            inserted(el) {
                el.focus();
            },
        },
    },
    computed: {
        // 判断自己在对应群中是否被禁言，若被禁言则不可修改群公告
        isBanned() {
            const group = this.group;
            const members = group.groupMembers;
            const authId = this.$im().auth.id;
            const selfInfo = members.filter(member => member.id === authId)[0] || {};
            const isCantNotSpeak = group.is_all_mute && selfInfo.mute_status !== 2 && selfInfo.id !== group.admin_id;
            const isBanned = selfInfo.mute_status === 1;
            const isRole = selfInfo.role === 1;
            return (isCantNotSpeak || isBanned) && !isRole;
        },
        /*
            发布按钮是否可以点击
            当 发布内容为空 或 只包含空格和回车时 不可点击
            */
        publishDisabled() {
            const content = this.content;
            return content.replace(/\s/g, '').length === 0;
        },
        isSpecialGroup() {
            const group = this.group || {};
            const common = this.RongIM.common;
            const type = common.getGroupType(group.type);
            return !!type;
        },
        isOwnerManage() {
            const group = this.group || {};
            return group.invite_member === GroupPermission.Owner && group.publish_group_notice === GroupPermission.Owner;
        },
        ownerManageCondition() {
            return (this.isOwnerManage && this.group.is_creator) || !this.isOwnerManage;
        },
    },
    methods: {
        close(event) {
            this.$emit('hidepanel', event);
            // this.$im().$off('imclick', this.close);
        },
        isShow(type) {
            const context = this;
            const content = context.content || '';
            const hasNotice = content.length;
            const isModifying = context.isModifying;
            const ownerManageCondition = context.ownerManageCondition;

            const showMap = {
                clear() {
                    return hasNotice && !isModifying && ownerManageCondition;
                },
                edit() {
                    return !isModifying && ownerManageCondition;
                },
                cancel() {
                    return isModifying;
                },
                publish() {
                    return isModifying;
                },
                empty() {
                    return !hasNotice && !isModifying;
                },
                'edit-box': () => isModifying,
                notice() {
                    return !isModifying && hasNotice;
                },
            };
            return showMap[type]();
        },
        getGroupUsername(user) {
            return this.RongIM.common.getGroupUsername(user, this.group.id);
        },
        edit() {
            const context = this;
            context.isModifying = true;
        },
        /*
        说明： 取消编辑群公告
        */
        cancel() {
            const context = this;
            const locale = context.locale;
            const tips = locale.tips;
            const confirmCancel = function confirmCancel() {
                context.isModifying = false;
                context.content = context.backupConent;
                context.close();
            };
            /*
            当公告为空(或只包含空格或者回车)时, 不弹框提示, 直接取消
             */
            if (this.publishDisabled) {
                confirmCancel();
                return;
            }
            this.RongIM.common.messagebox({
                type: 'confirm',
                message: locale.cancel,
                submitText: tips.msgboxSubmitText,
                callback: confirmCancel,
            });
        },
        /*
        说明： 清除群公告，弹框提示确认清除
        */
        clear() {
            const context = this;
            const common = this.RongIM.common;
            const groupNoticeApi = this.RongIM.dataModel.GroupNotice;
            const locale = context.locale;
            const tips = locale.tips;
            common.messagebox({
                type: 'confirm',
                message: locale.clear,
                submitText: tips.msgboxSubmitText,
                callback() {
                    context.content = '';
                    context.backupConent = '';
                    const params = {
                        id: context.targetId,
                    };
                    groupNoticeApi.remove(params, (errorCode) => {
                        if (errorCode) {
                            common.toastError(errorCode);
                        }
                    });
                    context.close();
                },
            });
        },
        /*
        说明： 发布群公告，弹框提示确认发布
        */
        publish() {
            const context = this;
            const content = context.content;
            if (isEmpty(content)) {
                return;
            }
            const common = this.RongIM.common;
            if (this.isOwnerManage && !this.group.is_creator) {
                common.messageToast({
                    message: context.locale.onlyOwnerManage,
                    type: 'error',
                });
                return;
            }
            const locale = context.locale;
            const tips = locale.tips;
            const groupNoticeApi = this.RongIM.dataModel.GroupNotice;
            common.messagebox({
                type: 'confirm',
                message: locale.confirm,
                submitText: tips.publish,
                callback() {
                    context.isModifying = false;
                    context.backupConent = content;
                    const params = {
                        id: context.targetId,
                        content,
                    };
                    groupNoticeApi.publish(params, (errorCode) => {
                        if (errorCode) {
                            common.toastError(errorCode);
                        }
                    });
                    context.close();
                },
            });
        },
    },
};

function close(context, event) {
    const $target = $(event.target);
    const wrap = '.rong-dialog, .rong-group-create, .rong-group-remove';
    const inBody = $target.closest('body').length > 0;
    const inWrap = $target.closest(wrap).length < 1;
    const isOuter = inBody && inWrap;
    if (isOuter) context.close(event);
}
