/* eslint-disable no-param-reassign */
import getLocaleMixins from '../../utils/getLocaleMixins';
import avatar from '../avatar.vue';
import status from '../status.vue';
import pinDetail from './pin-detail.vue';
import highlight from '../../common/highlight';
import userProfile from '../../dialog/contact/user';
import config from '../../config';
import dateFormat from '../../utils/dateFormat';
import getContextMenuMixins from '../mixins/context-menu';

export default {
    name: 'pin-received',
    mixins: [getLocaleMixins('pin-received'), getContextMenu()],
    data() {
        return {
            confirmExpand: false,
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
        getUsername(user) {
            return user ? user.alias || user.name : ' ';
        },
        getConfirmStr(pin) {
            const localeReceived = config.currentLocale().components
                .receivedPin;
            return pin.confirmed
                ? localeReceived.confirmed
                : localeReceived.unConfirmed;
        },
        getReplyDetail(pin) {
            const localeReceived = config.currentLocale().components
                .receivedPin;
            let replyPrompt = this.localeFormat(
                localeReceived.reply,
                pin.comment_count,
            );
            replyPrompt = pin.comment_count
                ? replyPrompt
                : localeReceived.replyNone;
            return pin.confirmed ? replyPrompt : localeReceived.confirmReceived;
        },
        dateFormat(timestamp) {
            const options = {
                alwaysShowTime: true,
            };
            return dateFormat(timestamp, options);
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
        receiveConfirm(pin) {
            if (pin.confirmed) {
                this.replyPin(pin);
                return;
            }
            const that = this;
            that.isClicking = true;
            $.when(setPinConfirm(pin, this.$im().dataModel.Pin))
                .then(() => {
                    // 38912 - 【PIN】接收者未确认 PIN 时，发送方删除 PIN 消息，接收者确认后仍显示一条 PIN 消息提示
                    const im = this.$im();
                    that.isClicking = false;
                    // server 会下发通知消息屏蔽这里重复获取
                    // pinApi.notifyUnReadCount(pin.pinUid);
                    im.pinUnReadCount.unConfirm -= 1;
                })
                .fail((err) => {
                    that.toastError(err);
                });
        },
        hasUnReadComment(pin) {
            const isConfirmed = pin.confirmed;
            const isSelected = this.selectedPin === pin;
            return pin.un_read_comment_count && !isSelected && isConfirmed;
        },
        afterEnter() {
            this.isClicking = false;
            this.$im().$emit('pinDetailLoadDone');
        },
        enterCancelled() {
            this.isClicking = false;
        },
        scroll() {
            const context = this;
            if (isScrollToBottom()) {
                setupPinInBox(
                    this,
                    this.$im().dataModel.Pin,
                    context.minTimestamp,
                );
            }
        },
        toastError(errorCode) {
            let el = null;
            if (this.$el) {
                el = this.$el.firstChild;
            }
            this.RongIM.common.toastError(errorCode, el);
        },
        hidepanel(event) {
            if (event && event.target === this.$el) {
                return;
            }
            this.selectedPin = null;
        },
    },
    mounted() {
        mounted(this, this.$im().dataModel);
    },
    destroyed() {
        const pinApi = this.$im().dataModel.Pin;
        pinApi.unwatch(this.pinCreateWatch);
        pinApi.unwatch(this.pinChangeWatch);
        pinApi.unwatch(this.pinDeleteWatch);
    },
};

function mounted(context, dataModel) {
    const pinApi = dataModel.Pin;
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
            if (isScrollToBottom()) setupPinInBox(context, pinApi, context.minTimestamp, loadMore);
        });
    };
    setupPinInBox(context, pinApi, context.minTimestamp, loadMore);
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
    return getContextMenuMixins(options);
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
            setupPinInBox(context, pinApi, context.minTimestamp);
        }
    });
}

const throttleMap = {};
function setupPinDetailThrottle(context, pinApi, pin, callback) {
    const uid = pin.uid;
    const later = function later() {
        throttleMap[uid] = {
            args: [],
            handle() {
                throttleMap[uid] = null;
            },
        };
        setTimeout(() => {
            const th = throttleMap[uid];
            if (th) {
                th.handle.apply(null, th.args);
            }
        }, 2000);
    };
    const throttle = throttleMap[uid];
    if (throttle) {
        // eslint-disable-next-line prefer-rest-params
        throttle.args = arguments;
        throttle.handle = function handle() {
            // eslint-disable-next-line prefer-rest-params
            setupPinDetail(...arguments);
            later();
        };
    } else {
        setupPinDetail(context, pinApi, pin, callback);
        later();
    }
}

function setupPinDetail(context, pinApi, pin, callback) {
    pinApi.getPinDetail(pin.uid, (errorCode, detail) => {
        if (errorCode) {
            return;
        }
        $.extend(pin, detail);
        if (callback) callback(detail);
    });
}

function pinCreateWatch(context, pinApi) {
    const im = context.$im();
    context.pinCreateWatch = function watchPinCreate(message) {
        if (message.messageType === pinApi.MessageType.PinNotifyMessage) {
            const pinCreaterId = message.content.creatorUid;
            const pinIdList = context.pinList.map(pin => pin.uid);
            const msgContent = message.content || {};
            const isNewPin = pinIdList.indexOf(msgContent.pinUid) === -1;
            if (pinCreaterId === im.loginUser.id || !isNewPin) {
                return;
            }
            message.content.uid = message.content.pinUid;
            setupPinDetailThrottle(context, pinApi, message.content, (pin) => {
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
        const isCommentMessage = message.messageType === pinApi.MessageType.PinCommentMessage;
        const isUnReadMessage = message.messageType === pinApi.MessageType.PinCommentReadMessage;
        const isConfirmMessage = message.messageType === pinApi.MessageType.PinConfirmMessage;
        if (isCommentMessage || isUnReadMessage || isConfirmMessage) {
            context.pinList.forEach((pin) => {
                if (pin.uid === message.content.pinUid) setupPinDetailThrottle(context, pinApi, pin);
            });
        }
    };
    pinApi.watch(context.pinChangeWatch);
}

function pinDeleteWatch(context, pinApi) {
    context.pinDeleteWatch = function watchPinDelete(message) {
        const isDeleteMessage = message.messageType === pinApi.MessageType.PinDeletedMessage;
        if (isDeleteMessage) {
            context.pinList = context.pinList.filter(
                pin => pin.uid !== message.content.pinUid,
            );
        }
    };
    pinApi.watch(context.pinDeleteWatch);
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

function setupPinInBox(context, pinApi, timestamp, callback) {
    if (!context.hasMore || context.isLoading) {
        return;
    }
    context.isLoading = true;
    pinApi.getInbox(timestamp, (errorCode, result) => {
        if (errorCode) {
            return;
        }
        context.pinList = context.pinList.concat(result.data);
        const count = context.pinList.length;
        if (count) {
            context.hasMore = result.total_count > result.count;
            context.minTimestamp = context.pinList[count - 1].send_dt;
            if (callback) callback();
        }
        context.isLoading = false;
    });
}

function setPinConfirm(pin, pinApi) {
    const $def = $.Deferred();
    pinApi.confirm(
        pin.uid,
        () => {
            pin.confirmed = true;
            $def.resolve();
        },
        (err) => {
            $def.reject(err);
        },
    );

    return $def;
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
