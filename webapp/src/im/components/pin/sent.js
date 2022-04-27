/* eslint-disable no-param-reassign */
import avatar from '../avatar.vue';
import status from '../status.vue';
import pinDetail from './pin-detail.vue';
import highlight from '../../common/highlight';
import getLocaleMixins from '../../utils/getLocaleMixins';
import dateFormat from '../../utils/dateFormat';
import userProfile from '../../dialog/contact/user';
import config from '../../config';
import getContextMenuMixin from '../mixins/context-menu';

export default {
    name: 'pin-sent',
    data() {
        return {
            pinList: [],
            minTimestamp: 0,
            hasMore: true,
            selectedPin: null,
            isClicking: false,
            isLoading: false,
        };
    },
    components: {
        avatar,
        pinDetail,
        status,
    },
    mixins: [getContextMenu(), getLocaleMixins('pin-sent')],
    computed: {
        showEmptyPage() {
            return this.pinList.length === 0;
        },
        isConnected() {
            return this.$im().status === RongIMLib.ConnectionStatus.CONNECTED;
        },
    },
    methods: {
        status() {
            return this.$im().status;
        },
        getPinContent(pin) {
            if (!pin || !pin.content) {
                return undefined;
            }
            const content = this.RongIM.common.textMessageFormat(pin.content);
            return highlight(content);
        },
        userProfile(userId) {
            const that = this;
            that.isClicking = true;
            userProfile(userId, () => {
                that.isClicking = false;
            });
        },
        showDetail(pin, isReply) {
            if (!this.isClicking) {
                this.selectedPin = pin;
                this.selectedPin.isReply = isReply;
                pin.un_read_comment_count = 0;
            }
        },
        replyPin(pin) {
            this.isClicking = true;
            this.selectedPin = pin;
            this.selectedPin.isReply = true;
            pin.un_read_comment_count = 0;
        },
        getUsername(user) {
            return user ? user.alias || user.name : '';
        },
        dateFormat(pin) {
            const timestamp = pin.delayed ? pin.delayed_send_dt : pin.create_dt;
            const options = {
                alwaysShowTime: true,
            };
            return dateFormat(timestamp, options);
        },
        getUnConfirmStr(pin) {
            const localeReceived = config.currentLocale().components.sendPin;
            const unConfirmedPrompt = this.localeFormat(localeReceived.unConfirmed, pin.un_confirm_count);
            return unConfirmedPrompt;
        },
        getReplyStr(pin) {
            const localeReceived = config.currentLocale().components.receivedPin;
            let replyPrompt = this.localeFormat(localeReceived.reply, pin.comment_count);
            replyPrompt = pin.comment_count ? replyPrompt : localeReceived.replyNone;
            return replyPrompt;
        },
        hasUnReadComment(pin) {
            const isSelected = this.selectedPin === pin;
            return pin.un_read_comment_count && !isSelected;
        },
        enterCancelled() {
            this.isClicking = false;
        },
        afterEnter() {
            this.isClicking = false;
            this.$im().$emit('pinDetailLoadDone');
        },
        isShowDelayedIcon(pin) {
            if (!pin.delayed) {
                return false;
            }
            const sendTime = pin.delayed_send_dt;
            const thisTime = new Date().getTime();
            return sendTime > thisTime;
        },
        scroll() {
            const dataModel = this.$im().dataModel;
            const pinApi = dataModel.Pin;
            const context = this;
            if (isScrollToBottom()) {
                setupPinOutbox(context, pinApi, context.minTimestamp);
            }
        },
    },
    mounted() {
        mounted(this, this.$im().dataModel.Pin);
    },
    destroyed() {
        unwatch(this, this.$im().dataModel.Pin);
    },
};

function mounted(context, pinApi) {
    initPinInBox(context, pinApi);
    pinCreateWatch(context, pinApi);
    pinChangeWatch(context, pinApi);
    pinDeleteWatch(context, pinApi);
    watchDeletePin(context);
    watchConnectStatus(context, pinApi);
}

function initPinInBox(context, pinApi) {
    const loadMore = () => {
        Vue.nextTick(() => {
            if (isScrollToBottom()) setupPinOutbox(context, pinApi, context.minTimestamp, loadMore);
        });
    };
    setupPinOutbox(context, pinApi, context.minTimestamp, loadMore);
}

function getContextMenu() {
    const options = {
        template: 'templates/pin/deletepin-contextmenu.html',
        methods: {
            deletePin() {
                const that = this;
                const pin = this.context.pin;
                const im = this.$im();
                const pinApi = im.dataModel.Pin;
                pinApi.deletePin(pin.uid, () => {
                    that.$emit('close');
                    im.$emit('deletePin', pin);
                    pinApi.notifyUnReadCount();
                });
            },
        },
    };
    return getContextMenuMixin(options);
}

function watchDeletePin(context) {
    const im = context.$im();
    im.$on('deletePin', (pin) => {
        context.pinList = context.pinList.filter(item => item.uid !== pin.uid);
    });
}

function watchConnectStatus(context, pinApi) {
    const im = context.$im();
    im.$watch('status', (crtStatus) => {
        if (crtStatus === RongIMLib.ConnectionStatus.CONNECTED) {
            setupPinOutbox(context, pinApi);
        }
    });
}

function pinCreateWatch(context, pinApi) {
    context.pinCreateWatch = function watchPinCreate(message) {
        const isCreateMessage = message.messageType === pinApi.MessageType.PinNotifyMessage;
        const pinIdList = context.pinList.map(pin => pin.uid);
        const isNewPin = isCreateMessage && pinIdList.indexOf(message.content.pinUid) === -1;
        if (isNewPin) {
            message.content.uid = message.content.pinUid;
            setupPinDetail(context, pinApi, message.content, (pin) => {
                const list = context.pinList.concat([]);
                list.unshift(pin);
                context.pinList = deleteRepeatPin(list);
            });
        }
    };
    pinApi.watch(context.pinCreateWatch);
}

function pinChangeWatch(context, pinApi) {
    context.pinChangeWatch = function watchPinChange(message) {
        const isDeleteMessage = message.messageType === pinApi.MessageType.PinDeletedMessage;
        const isCreateMessage = message.messageType === pinApi.MessageType.PinNotifyMessage;
        if (!isDeleteMessage && !isCreateMessage) {
            context.pinList.forEach((pin) => {
                if (pin.uid === message.content.pinUid) setupPinDetail(context, pinApi, pin);
            });
        }
    };
    pinApi.watch(context.pinChangeWatch);
}

function pinDeleteWatch(context, pinApi) {
    context.pinDeleteWatch = function watchPinDelete(message) {
        const isDeleteMessage = message.messageType === pinApi.MessageType.PinDeletedMessage;
        if (isDeleteMessage) {
            context.pinList = context.pinList.filter(pin => pin.uid !== message.content.pinUid);
        }
    };
    pinApi.watch(context.pinDeleteWatch);
}

function unwatch(context, pinApi) {
    pinApi.unwatch(context.pinCreateWatch);
    pinApi.unwatch(context.pinChangeWatch);
    pinApi.unwatch(context.pinDeleteWatch);
}

function setupPinDetail(context, pinApi, pin, callback) {
    pinApi.getPinDetail(pin.uid, (errorCode, detail) => {
        if (errorCode) {
            return;
        }
        $.extend(pin, detail);
        if (context.selectedPin && detail.uid === context.selectedPin.uid) {
            detail.un_read_comment_count = 0;
        }
        if (callback) callback(detail);
    });
}

function isScrollToBottom() {
    const $el = $('.rong-main-content');
    let bottom = $el.css('padding-bottom');
    // 快速切换时 padding-bottom 可能不存在
    if (bottom) {
        bottom = parseFloat(bottom.split('px')[0]);
        const scrollTop = $el[0].scrollTop;
        const height = $el.height();
        const scrollHeight = $el[0].scrollHeight;
        return scrollTop + height >= scrollHeight - bottom - 100;
    }
    return false;
}

function setupPinOutbox(context, pinApi, timestamp, callback) {
    if (!context.hasMore || context.isLoading) {
        return;
    }
    context.isLoading = true;
    pinApi.getOutbox(timestamp, (errorCode, result) => {
        if (errorCode) {
            return;
        }
        context.pinList = context.pinList.concat(result.data);
        const count = context.pinList.length;
        if (count) {
            context.hasMore = result.totalCount > result.count;
            context.minTimestamp = context.pinList[count - 1].create_dt;
            if (callback) callback();
        }
        context.isLoading = false;
    });
}
function deleteRepeatPin(pinList) {
    const newList = [];
    for (let i = 0; i < pinList.length; i += 1) {
        const pin = pinList[i];
        const newPinUid = newList.map(newPin => newPin.uid);
        if (newPinUid.indexOf(pin.uid) === -1) {
            newList.push(pin);
        }
    }
    return newList;
}
