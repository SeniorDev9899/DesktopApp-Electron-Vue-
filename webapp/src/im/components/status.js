import getLocaleMixins from '../utils/getLocaleMixins';

const name = 'status';

export default {
    name,
    props: ['code'],
    computed: {
        error() {
            const locale = this.locale;
            if (this.connected) {
                return undefined;
            }
            const defaultMessage = locale.netErr;
            const errorKey = `status-${this.code}`;
            const errorMessage = this.RongIM.common.getErrorMessage(errorKey, defaultMessage);
            return errorMessage;
        },
        connected() {
            return this.code === RongIMLib.ConnectionStatus.CONNECTED;
        },
        connecting() {
            return this.code === RongIMLib.ConnectionStatus.CONNECTING;
        },
    },
    mixins: [getLocaleMixins(name)],
};
