/* eslint-disable no-param-reassign */
import validate from '../mixins/validate';
import config from '../../config';
import isEmpty from '../../utils/isEmpty';
import getLocaleMixins from '../../utils/getLocaleMixins';
import shareData from './shareData';
import { getServerConfigByChainedKey } from '../../cache/helper';

function sendCaptcha(context) {
    if (!context.valid('[name=phone]')) {
        return;
    }
    context.captchaButtonBusy = true;
    context.sendCode().then(() => {
        const captchaButtonTextBackup = context.captchaButtonText;
        let count = 59;
        const timer = setInterval(() => {
            if (count > 0) {
                context.captchaButtonText = context.localeFormat(context.locale.sentCaptcha, count);
                count -= 1;
            } else {
                context.captchaButtonText = captchaButtonTextBackup;
                context.captchaButtonBusy = false;
                clearInterval(timer);
            }
        }, 1000);
    })
        .fail(() => {
            context.captchaButtonBusy = false;
        })
        .always(() => {
            sendCaptcha.done = true;
        });
}

function sendCode(context, userApi) {
    const defer = $.Deferred();
    const params = {
        zip: context.zip,
        phone: context.phone,
    };
    const common = context.RongIM.common;
    userApi.sendCode('resetpwd', params, (errorCode) => {
        if (errorCode) {
            context.$set(context.errors, 'phone', common.getErrorMessage(errorCode));
            defer.reject(errorCode);
        } else {
            defer.resolve();
        }
    });
    return defer.promise();
}

function submitPhone(context, userApi) {
    if (!context.valid() || context.busy) {
        return;
    }
    const common = context.RongIM.common;
    if (!sendCaptcha.done) {
        context.$set(context.errors, 'captcha', common.getErrorMessage('require-captcha'));
        return;
    }

    context.busy = true;
    const params = {
        zip: context.zip,
        phone: context.phone,
        code: context.captcha,
    };
    userApi.checkCode(params, (errorCode, result) => {
        if (errorCode) {
            const errorCodeForCaptcha = [10117, 10120];
            const field = errorCodeForCaptcha.indexOf(errorCode) >= 0 ? 'captcha' : 'phone';
            context.$set(context.errors, field, common.getErrorMessage(errorCode));
        } else {
            shareData.phone = context.phone;
            shareData.token = result.token;
            context.$emit('current-view', 'step-password');
        }
        context.busy = false;
    });
}

const name = 'step-phone';

export default {
    name,
    data() {
        return {
            enabledSms: getServerConfigByChainedKey('sms.verification_state'),
            busy: false,
            zip: config.zip,
            phone: null,
            captcha: null,
            captchaButtonBusy: false,
            captchaButtonText: '',
        };
    },
    mixins: [
        validate(), getLocaleMixins(name),
    ],
    computed: {
        phoneInvalid() {
            return isEmpty(this.phone) || this.errors.phone;
        },
    },
    mounted() {
        this.captchaButtonText = this.locale.sendCaptcha;
    },
    methods: {
        sendCaptcha() {
            sendCaptcha(this);
        },
        // 38565 - 【忘记密码】线上版本点击获取验证码收不到验证码
        sendCode() {
            return sendCode(this, this.RongIM.dataModel.User);
        },
        submit() {
            submitPhone(this, this.RongIM.dataModel.User);
        },
    },
};
