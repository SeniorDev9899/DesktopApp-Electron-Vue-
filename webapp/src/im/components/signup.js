/* eslint-disable no-param-reassign */
import cache from '../utils/cache';
import config from '../config';
import validate from './mixins/validate';
import isEmpty from '../utils/isEmpty';
import getLocaleMixins from '../utils/getLocaleMixins';
import { getServerConfigByChainedKey } from '../cache/helper';

const name = 'signup';

export default {
    name,
    data() {
        return {
            enabledSms: getServerConfigByChainedKey('sms.verification_state'),
            busy: false,
            nickname: null,
            phone: null,
            password: null,
            captcha: null,
            zip: config.zip,
            captchaButtonBusy: false,
            captchaButtonText: '',
        };
    },
    mixins: [
        validate(),
        getLocaleMixins(name),
    ],
    mounted() {
        this.captchaButtonText = this.locale.sendCaptcha;
    },
    computed: {
        invalid() {
            return isEmpty(this.phone) || isEmpty(this.nickname) || isEmpty(this.captcha) || isEmpty(this.password);
        },
        productName() {
            return this.$im().productName;
        },
    },
    methods: {
        sendCaptcha() {
            sendCaptcha(this);
        },
        sendCode() {
            return sendCode(this, this.RongIM.dataModel.User);
        },
        submit() {
            submit(this, this.RongIM.dataModel.User, this.$im());
        },
    },
};

function sendCaptcha(context) {
    if (!context.valid('[name=phone]')) {
        return;
    }

    context.captchaButtonBusy = true;
    context.sendCode()
        .then(() => {
            const captchaButtonTextBackup = context.captchaButtonText;
            let count = 59;
            const timer = setInterval(() => {
                if (count > 0) {
                    count = count < 10 ? (`0${count}`) : count;
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
    userApi.sendCode('register', params, (errorCode) => {
        if (errorCode) {
            context.$set(context.errors, 'phone', context.RongIM.common.getErrorMessage(errorCode));
            defer.reject(errorCode);
        } else {
            defer.resolve();
        }
    });
    return defer.promise();
}

function checkCode(context, userApi) {
    const defer = $.Deferred();
    const params = {
        zip: context.zip,
        phone: context.phone,
        code: context.captcha,
    };
    userApi.checkCode(params, (errorCode, result) => {
        if (errorCode) {
            defer.reject(errorCode);
        } else {
            defer.resolve(result);
        }
    });
    return defer.promise();
}

function register(context, userApi, params, im) {
    // 2019-06-12 密码加密传输 userApi.register 改为 userApi.securityRegister
    userApi.securityRegister(params, (errorCode) => {
        if (errorCode) {
            context.$set(context.errors, 'phone', context.RongIM.common.getErrorMessage(errorCode));
            context.busy = false;
        } else {
            cache.set('account-number', context.phone);
            const path = {
                name: 'login',
                params: {
                    selected: 'password',
                },
            };
            im.$router.push(path);
        }
    });
}

function submit(context, userApi, im) {
    if (!context.valid() || context.busy) {
        return;
    }
    context.busy = true;

    checkCode(context, userApi)
        .then((result) => {
            const params = {
                name: context.nickname,
                zip: context.zip,
                tel: context.phone,
                verifyToken: result.token,
                password: context.password,
            };
            register(context, userApi, params, im);
        })
        .fail((errorCode) => {
            context.$set(context.errors, 'captcha', context.RongIM.common.getErrorMessage(errorCode));
            context.busy = false;
        });
}
