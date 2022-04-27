/* eslint-disable no-param-reassign */
import equalMessage from '../../common/equalMessage';
import console from '../../utils/console';

const RongIMVoice = RongIMLib.RongIMVoice;

function startPlay(context, messageApi) {
    const second = context.duration;
    const base64 = context.message.content.content;
    if (context.isPlaying) {
        context.isPlaying = false;
        try {
            RongIMVoice.stop(base64);
        } catch (e) {
            console.log('RongIMVoice.stop', e);
        }
    } else {
        context.isPlaying = true;
        const receivedStatus = context.message.receivedStatus;
        const LISTENED = RongIMLib.ReceivedStatus.LISTENED;
        const messageId = context.message.messageId;
        const unListened = receivedStatus !== LISTENED;
        if (messageId && unListened) {
            context.message.receivedStatus = LISTENED;
            messageApi.setMessageReceivedStatus({
                messageId,
                status: LISTENED,
            }, () => {
                context.$im().$emit('messagechange');
            });
        }
        try {
            setTimeout(() => {
                RongIMVoice.play(base64, second, () => {
                    context.isPlaying = false;
                    context.$emit('autoPlay', context);
                });
            }, 0);
        } catch (e) {
            console.log('RongIMVoice.play', e);
        }
    }
}

function play(context, im) {
    const messageApi = im.dataModel.Message;
    const base64 = context.message.content.content;
    im.$emit('voicemessage.stopother', context.message);
    RongIMVoice.preLoaded(base64, () => {
        startPlay(context, messageApi, im);
    });
}

function mounted(context, im) {
    im.$on('voicemessage.stopother', (message) => {
        const same = equalMessage(message, context.message);
        if (!same && context.isPlaying) {
            context.isPlaying = false;
            const selfBase64 = context.message.content.content;
            RongIMVoice.stop(selfBase64);
        }
    });
    im.$on('voicemessage.autoplay', (message) => {
        const same = equalMessage(message, context.message);
        if (same) {
            play(context, im);
        }
    });
}

function widthStyle(context) {
    const duration = context.duration;
    const MIN_WIDTH = 36;
    const MAX_WIDTH = 200;
    const FIX = 164;
    const width = duration / 60 * FIX + MIN_WIDTH;
    return `${Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, width))}px`;
}

export default {
    name: 'voice-message',
    props: ['message', 'messageList'],
    data() {
        return {
            sentStatus: RongIMLib.SentStatus,
            isPlaying: false,
            timer: null,
        };
    },
    mounted() {
        mounted(this, this.$im());
    },
    computed: {
        widthStyle() {
            return widthStyle(this);
        },
        isUnread() {
            const receivedStatus = this.message.receivedStatus;
            return receivedStatus !== RongIMLib.ReceivedStatus.LISTENED;
        },
        isReceiver() {
            const messageDirection = this.message.messageDirection;
            return messageDirection === RongIMLib.MessageDirection.RECEIVE;
        },
        duration() {
            if (this.message.content.duration < 1) {
                return 1;
            } if (this.message.content.duration > 60) {
                return 60;
            }
            return this.message.content.duration;
        },
    },
    beforeDestroy() {
        RongIMVoice.stop();
    },
    methods: {
        play(e) {
            e.stopPropagation();
            play(this, this.$im());
        },
    },
};
