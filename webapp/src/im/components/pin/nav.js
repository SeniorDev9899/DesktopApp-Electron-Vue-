/* eslint-disable no-param-reassign */
import search from '../search.vue';
import getLocaleMixins from '../../utils/getLocaleMixins';
import throttle from '../../utils/throttle';
import getResizeDirectionMethod from '../../common/getResizeDirection';

export default {
    name: 'pin-nav',
    mixins: [getLocaleMixins('pin-nav')],
    data() {
        return {
            receiverUnReadCount: {
                unConfirm: 0,
                unComment: 0,
            },
            sendUnReadCount: 0,
            bound: {
                width: {
                    min: 0,
                    max: 0,
                },
            },
        };
    },
    computed: {
        receiverCount() {
            return this.receiverUnReadCount.unConfirm || '';
        },
        width() {
            const node = this.$im().resizeNode.rongList;
            return node.width;
        },
    },
    components: {
        search,
    },
    mounted() {
        const context = this;
        const im = this.$im();
        mounted(this, im.dataModel.Pin, im);
        context.receiverUnReadCount.unConfirm = im.pinUnReadCount.unConfirm;
        this.unwatchUnconfirmcount = im.$watch('pinUnReadCount.unConfirm', (newVal) => {
            context.receiverUnReadCount.unConfirm = newVal;
        });
    },
    destroyed() {
        this.$im().dataModel.Pin.unwatch(this.unReadWatch);
        this.unwatchUnconfirmcount();
    },
    methods: {
        getResizeDirection() {
            const direction = getResizeDirectionMethod({
                range: this.width,
                bound: this.bound.width,
                directions: ['left', 'right'],
            });
            this.$im().resizeDirection.temp = direction;
            return direction;
        },
    },
    watch: {
        $route() {
            const im = this.$im();
            im.RongIM.common.resizeNavNode(this, im);
        },
    },
};

const setupUnReadCount = throttle((context, pinApi) => {
    setupReceiverUnReadCount(context, pinApi);
    setupSendUnReadCount(context, pinApi);
}, 2000);

function mounted(context, pinApi, im) {
    context.unReadWatch = function unReadWatch(message) {
        const isCommentMessage = pinApi.MessageType.PinCommentMessage === message.messageType;
        const isCommentReadMessage = pinApi.MessageType.PinCommentReadMessage === message.messageType;
        const loginUser = im.loginUser || {};
        const notSelfComment = isCommentMessage && (message.content.publisherUid !== loginUser.id);
        if (notSelfComment || isCommentReadMessage) {
            setupUnReadCount(context, pinApi);
        }
    };
    pinApi.watch(context.unReadWatch);
    setupUnReadCount(context, pinApi);
    context.RongIM.common.resizeNavNode(context, im);
}

function setupReceiverUnReadCount(context, pinApi) {
    pinApi.getInboxUnRead((errorCode, unread) => {
        if (errorCode) {
            return;
        }
        context.receiverUnReadCount.unComment = unread.length;
    });
}

function setupSendUnReadCount(context, pinApi) {
    pinApi.getOutboxUnRead((errorCode, response) => {
        if (errorCode) {
            return;
        }
        context.sendUnReadCount = response.length;
    });
}
