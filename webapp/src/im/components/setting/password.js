import isEmpty from '../../utils/isEmpty';
import validate from '../mixins/validate';
import getLocaleMixins from '../../utils/getLocaleMixins';
import appCache, { Type as APP_CACHE } from '../../cache/app';

const name = 'setting-password';

/*
说明：设置 - 内容页(修改密码)
功能：
    1. 修改密码
*/
export default {
    name,
    data() {
        return {
            busy: false,
            oldPassword: null,
            newPassword: null,
            confirmPassword: null,
            appCache,
        };
    },
    computed: {
        disabled() {
            return isEmpty(this.oldPassword)
                || isEmpty(this.newPassword)
                || isEmpty(this.confirmPassword);
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
    mixins: [
        validate(),
        getLocaleMixins(name),
    ],
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
                    return `${minimumLength}-${maxLength}${this.locale.bitsErrorText}`;
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
        submit() {
            /**
             * 修改密码前端校验规则：
             * 1. 非空
             * 2. 只允许输入数字、字母和特殊字符（非空格）
             * 3. 两次输入是否一致，不一致提示错误
             * server提示语拼接模板：
             * 密码格式错误：密码必须包含(6-16位)(数字)、(字母)、(特殊字符)
             */
            const context = this;
            if (!context.valid() || context.busy) {
                return;
            }

            const userApi = this.$im().dataModel.User;
            const params = {
                newPassword: context.newPassword,
                oldPassword: context.oldPassword,
            };
            if (context.newPassword === context.oldPassword) {
                context.$set(context.errors, 'newPassword', context.locale.errorCode['new-password-same-old-password']);
                return;
            }
            context.busy = true;
            // 2019-06-12 密码加密传输 userApi.changePassword 改为 securityChangePassword
            userApi.securityChangePassword(params, (errorCode) => {
                context.busy = false;
                if (errorCode) {
                    let errDes;
                    // 同一个错误码 在设置密码时 提示信息不一样
                    if (errorCode === 10101) {
                        errDes = context.locale.errorCode['old-password-error'];
                    } else if (errorCode === 10103) {
                        // 当服务端返回错误码 10103 时，需进行密码规则提示
                        errDes = this.getErrDes();
                    } else {
                        errDes = this.RongIM.common.getErrorMessage(errorCode);
                    }
                    // server错误提示都统一展示在最下边
                    context.$set(context.errors, 'confirmPassword', errDes);
                }
            });
        },

    },
};
