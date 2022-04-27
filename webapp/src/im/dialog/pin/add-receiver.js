/* eslint-disable no-param-reassign */
import config from '../../config';
import avatar from '../../components/avatar.vue';
import getOrg from '../../components/group/org.vue';
import getStar from '../../components/group/group-star.vue';
import getFriend from '../../components/group/group-friend.vue';
import { getServerConfigByChainedKey } from '../../cache/helper';

export default function (defaultMembers, pinDetail) {
    const options = {
        name: 'add-receiver',
        template: 'templates/pin/add-receiver.html',
        data() {
            const im = this.$im();
            return {
                maxReceiverCount: getServerConfigByChainedKey('pin.max_receiver_count'),
                tab: 'org',
                show: true,
                selected: $.extend(true, [], defaultMembers),
                defaultSelected: $.extend(true, [], defaultMembers),
                isStaff: im.auth.isStaff,
            };
        },
        components: {
            avatar,
            org: getOrg,
            star: getStar,
            friend: getFriend,
        },
        computed: {
            isStarSelected() {
                return this.tab === 'star';
            },
            isOrgSelected() {
                return this.tab === 'org';
            },
            isFriendSelected() {
                return this.tab === 'friend';
            },
            canNotSelected() {
                const loginUser = this.$im().loginUser || { id: '' };
                return [loginUser];
            },
            defaultCount() {
                return defaultMembers.length;
            },
        },
        created() {
            const im = this.$im();
            if (!im.auth.isStaff) {
                this.tab = 'star';
            }
        },
        methods: {
            reset() {
                this.selected.push({});
                this.selected.pop();
            },
            toastError(errorCode) {
                this.RongIM.common.toastError(errorCode, this.$el.firstChild);
            },
            toast(params) {
                params.el = this.$el.firstChild;
                this.RongIM.common.messageToast(params);
            },
            getUsername(...args) {
                return this.RongIM.common.getUsername(...args);
            },
            close() {
                this.selected = [];
                this.show = false;
            },
            selectTab(tab) {
                this.tab = tab;
            },
            added(members) {
                added(this, members, defaultMembers);
            },
            removed(members) {
                removed(this, members);
            },
            removeMembers(member) {
                removed(this, [member]);
            },
            addReceivers() {
                addReceivers(this, pinDetail, defaultMembers);
            },
            showRemoveBtn(item) {
                const sameUserList = defaultMembers.filter(user => user.id === item.id);
                return sameUserList.length === 0;
            },
            maxCountLimit() {
                const mostReceiveFormat = config.currentLocale().components.newPin.mostReceive;
                const hintMessage = this.localeFormat(mostReceiveFormat, this.maxReceiverCount);
                this.toast({
                    type: 'error',
                    message: hintMessage,
                });
                this.reset();
            },
        },
    };
    window.RongIM.common.mountDialog(options);
}

function addReceivers(context, pinContext, defaultMembers) {
    const pinApi = context.$im().dataModel.Pin;
    const defaultIdList = defaultMembers.map(item => item.id);
    let newReciverIds = context.selected.map(item => item.id);
    newReciverIds = newReciverIds.filter(id => defaultIdList.indexOf(id) === -1);
    pinApi.addReceivers(pinContext.pinUid, newReciverIds, (errorCode) => {
        if (errorCode) {
            context.toastError(errorCode);
            return;
        }
        sendNewReceiverMessage(pinContext.pinUid, pinApi);
        context.close();
    });
}

function sendNewReceiverMessage(uid, pinApi) {
    const message = {
        messageType: pinApi.MessageType.PinNewReciverMessage,
        content: { pinUid: uid },
    };
    pinApi.observerList.notify(message);
}

function added(context, members) {
    const im = context.$im();
    const selectedIdList = context.selected.map(item => item.id);
    const addedList = members.filter((item) => {
        const hasSelected = selectedIdList.indexOf(item.id) < 0;
        const notSelf = item.id !== im.loginUser.id;
        return hasSelected && notSelf;
    });
    const totalList = context.selected.concat(addedList);
    context.selected = totalList;
    // PIN 最大人数由服务端下发
    const maxReceiverCount = context.maxReceiverCount;
    const mostReceiveFormat = im.locale.components.newPin.mostReceive;
    const hintMessage = context.localeFormat(mostReceiveFormat, maxReceiverCount);
    if (totalList.length > maxReceiverCount) {
        context.toast({
            type: 'error',
            message: hintMessage,
        });
        removed(context, addedList);
    }
}

function removed(context, members) {
    const idList = members.map(item => item.id);
    const reservedIdList = context.defaultSelected.map(item => item.id);
    context.selected = context.selected.filter((item) => {
        const reserved = reservedIdList.indexOf(item.id) >= 0;
        return reserved || idList.indexOf(item.id) < 0;
    });
}
