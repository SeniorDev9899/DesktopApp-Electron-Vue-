import cache from '../utils/cache';
import validate from '../components/mixins/validate';
import appCache, { Type as APP_CACHE } from '../cache/app';

export default function () {
    const options = {
        name: 'set-password',
        template: 'templates/set-password.html',
        data() {
            return {
                show: true,
                busy: false,
                password: '',
                confirmPassword: '',
                appCache,
            };
        },
        mixins: [
            validate(),
        ],
        computed: {
            language() {
                const language = this.locale.name;
                return language.toLowerCase();
            },
            pwdSetMap() {
                const tmp = this.appCache.get(APP_CACHE.SERVER_CONFIG);
                const isObject = val => typeof val === 'object' && val !== null;
                if (isObject(tmp) && isObject(tmp.password)) return tmp.password;
                return {};
            },
            maxlength() {
                const { max_length: maxLength } = this.pwdSetMap;
                if (maxLength) {
                    return maxLength;
                }
                return 1000;
            },
        },
        methods: {
            /**
             *"password" : {
                "number" : 0, #是否包含数字 0否1是
                "symbol" : 0, #是否包含特殊符号 0否1是
                "word" : 0, #是否包含字母 0否1是
                "minimum_length" : 6, #密码最小长度
                "max_length" : 16 #密码最大长度
            }
            */
            getErrDes() {
                const {
                    number, symbol, word, max_length: maxLength,
                } = this.pwdSetMap;
                let { minimum_length: minimumLength } = this.pwdSetMap;
                const isNumber = val => typeof val === 'number';
                if (!isNumber(minimumLength)) {
                    minimumLength = 1;
                }
                const hasNumberRule = number === 1;
                const hasSymbolRule = symbol === 1;
                const hasWordRule = word === 1;
                const hasLengthRule = isNumber(maxLength);
                const getLengthStr = () => {
                    if (hasLengthRule) {
                        return ` ${minimumLength}-${maxLength}${this.locale.bitsErrorText} `;
                    }
                    return '';
                };
                const getRuleStr = () => {
                    const ret = [];
                    if (hasNumberRule) { // 数字
                        ret.push(this.locale.digitsError);
                    }
                    if (hasWordRule) { // 字母
                        ret.push(this.locale.letters);
                    }
                    if (hasSymbolRule) { // 特殊符号
                        ret.push(this.locale.specialCharacError);
                    }
                    return ret.join('、');
                };
                return `${this.locale.pwdErrorTmp}${hasLengthRule ? getLengthStr() : ''}${getRuleStr()}`;
            },
            isError() {
                const errors = this.errors;
                return (errors.confirmPassword || errors.password);
            },
            close() {
                this.show = false;
            },
            submit() {
                const context = this;
                const im = this.$im();
                const userApi = im.dataModel.User;
                if (context.busy || !context.valid()) {
                    return;
                }
                const oldPassword = cache.get('auth-password');
                const params = {
                    newPassword: this.password,
                    oldPassword,
                };
                context.busy = true;
                // 2019-06-12 密码加密传输 userApi.changePassword 改为 securityChangePassword
                userApi.securityChangePassword(params, (errorCode) => {
                    context.busy = false;
                    if (errorCode) {
                        // this.RongIM.common.handleError(errorCode);
                        let errDes;
                        if (errorCode === 10103) {
                            // 当服务端返回错误码 10103 时，需进行密码规则提示
                            errDes = this.getErrDes();
                        } else {
                            errDes = this.RongIM.common.getErrorMessage(errorCode);
                        }
                        // server错误提示都统一展示在最下边
                        context.$set(context.errors, 'confirmPassword', errDes);
                        return;
                    }
                    cache.remove('auth-password');
                    context.close();
                    im.auth.isModifyPwd = false;
                });
            },
        },
    };
    window.RongIM.common.mountDialog(options);
}
