import shareData from './shareData';
import validate from '../mixins/validate';
import getLocaleMixins from '../../utils/getLocaleMixins';

/* eslint-disable no-param-reassign */
function resetPassword(context, userApi) {
    if (!context.valid() || context.busy) {
        return;
    }
    context.busy = true;
    const params = {
        phone: shareData.phone,
        password: context.password,
        verifyToken: context.token,
    };
    // 2019-06-12 密码加密传输 userApi.resetPassword 改为 userApi.securityResetPassword
    userApi.securityResetPassword(params, (errorCode) => {
        if (errorCode) {
            context.$set(context.errors, 'password', context.RongIM.common.getErrorMessage(errorCode));
        } else {
            context.$emit('current-view', 'step-success');
        }
        context.busy = false;
    });
}

const name = 'step-password';

export default {
    name,
    data() {
        return {
            busy: false,
            password: null,
            confirmPassword: null,
            token: shareData.token,
        };
    },
    mixins: [
        validate(), getLocaleMixins(name),
    ],
    methods: {
        submit() {
            resetPassword(this, this.RongIM.User);
        },
    },
};
