/* eslint-disable no-param-reassign */
import cache from '../utils/cache';
import isEmpty from '../utils/isEmpty';
import getLocaleMixins from '../utils/getLocaleMixins';
import templateFormat from '../utils/templateFormat';
import { uncompile } from '../utils/encrypt';
import config from '../config';
import system from '../system';
import validate from './mixins/validate';
import ErrorCode from '../common/ErrorCode';
import Database from '../Database';
import syncdata, { firstSyncdata } from '../syncdata';
import cleanStorage from '../cleanStorage';
import { getServerConfig } from '../cache/helper';

const name = 'login';

export default {
    name,
    data() {
        const serverConfig = getServerConfig();
        const enabledQrcodeLogin = serverConfig.qrcode.login_enable;
        const selected = enabledQrcodeLogin ? 'qrcode' : 'password';
        // 注册
        const enabledSignup = serverConfig.registration.enable;
        // 忘记密码
        const forgetPassword = serverConfig.password.forgot_enable;
        return {
            busy: false,
            enabledQrcodeLogin,
            enabledSignup,
            forgetPassword,
            selected,
            qrcodeTimeout: false,
            qrcodeAccountLocked: true,
            qrcodeLockedError: '帐号或密码多次错误，请30分钟后再试或点击忘记密码',
            phone: cache.get('account-number'),
            password: '',
            zip: config.zip,
            isRememberMe: false,
            isOvertime: false,
        };
    },
    computed: {
        disabled() {
            return isEmpty(this.phone) || isEmpty(this.password);
        },
        isFirst() {
            return this.$im().isFirst;
        },
        productName() {
            return this.$im().productName;
        },
        // 是否启用服务地址配置
        useServerConfFlag() {
            return this.RongIM.config.useServerConfFlag;
        },
    },
    watch: {
        selected(value) {
            const context = this;
            if (value === 'qrcode') {
                context.$nextTick(context.qrcodeLogin);
            }
        },
        phone() {
            const context = this;
            context.password = '';
            context.isRememberMe = false;
        },
        password() {
            cache.remove('login-params');
        },
        isRememberMe(value) {
            const context = this;
            const loginParams = cache.get('login-params');
            if (!value && loginParams) {
                cache.remove('login-params');
                context.password = '';
            }
        },
    },
    mixins: [
        validate(),
        getLocaleMixins(name),
    ],
    directives: {
        'auto-focus': {
            inserted: autoFocus,
        },
    },
    created() {
        const context = this;
        document.body.style.backgroundColor = '#0085e1';
        const hasLoginInfo = !isEmpty(cache.get('loginInfo'));
        if (hasLoginInfo) {
            const loginInfo = cache.get('loginInfo') || {};
            const newTime = (new Date()).getTime();
            const oldTime = loginInfo.timestamp || '';
            context.isRememberMe = loginInfo.isRememberMe || false;
            context.password = context.isRememberMe ? uncompile(loginInfo.password) : '';
            if (oldTime !== '' && (newTime - oldTime) / (24 * 60 * 60 * 1000) >= 30) {
                // 时间戳超过 30 天，需要重新输入密码
                context.isOvertime = true;
            }
        }
    },
    mounted() {
        const context = this;
        const params = this.$route.params;
        if (params.selected) {
            this.selected = params.selected;
        }
        cache.remove('auth');
        this.$im().$on('userBlocked', () => {
            context.busy = false;
        });
        if (this.enabledQrcodeLogin) {
            this.qrcodeLogin();
        }
    },
    methods: {
        qrcodeRefresh() {
            this.qrcodeLogin();
        },
        qrcodeLogin() {
            const serverConfig = getServerConfig();
            const context = this;
            const RongIM = context.RongIM;
            const common = RongIM.common;
            const im = context.$im();
            context.qrcodeTimeout = false;
            context.qrcodeAccountLocked = false;
            im.dataModel.User.qrcodeLogin(context.$refs.qrcode, (errorCode, result) => {
                if (errorCode) {
                    system.appLogger('error', `二维码登录失败 ${JSON.stringify(errorCode)}`);
                    if (errorCode === ErrorCode.INVALID_TOKEN) {
                        context.qrcodeTimeout = true;
                    } else if (errorCode === ErrorCode.ACCOUNT_IS_LOCKED) {
                        context.qrcodeAccountLocked = true;
                        result = result.result || {};
                        let message = common.getErrorMessage(errorCode);
                        const unlockTime = result.unlock_expired_time;
                        if (unlockTime) {
                            const timeString = common.timestampToDisplayTime(unlockTime);
                            message = templateFormat(message, timeString);
                        }
                        context.qrcodeLockedError = message;
                    }
                    return;
                }
                context.$im().$emit('imlogined');

                system.appLogger('info', `二维码登录成功 ${Date.now()}`);
                const staff = result.staff;
                const auth = {
                    isExecutive: staff.is_executive,
                    token: result.token,
                    id: staff.id,
                    code: staff.code,
                    companyId: staff.company_id,
                    deptId: staff.dept_id,
                    isStaff: staff.user_type === 0,
                    orgsInfo: staff.orgs_info,
                    display_mobile: staff.display_mobile,
                };
                const isTemp = true;
                cache.set('auth', auth, isTemp);
                let accountNumber = staff.mobile;
                const accountConfig = serverConfig.organization;
                if (accountConfig.username_binding === 'staffNo') {
                    accountNumber = staff.staff_no;
                }
                cache.set('account-number', accountNumber);
                // 首次多端同时登陆显示文件助手 其他端登录状态 login_status
                cache.set('login_status', result.login_status);
                im.auth = auth;
                im.cacheAuth = auth;
                im.$router.push({ name: 'conversation' });
                im.checkLock();
                im.isFirstSyncdata = firstSyncdata.get(auth.id);
                if (im.isFirstSyncdata) {
                    im.syncdataLoad.show = true;
                    if (auth.isStaff) {
                        const departIdList = auth.orgsInfo.map(item => item.id);
                        syncdata.departmentBranchStaff(departIdList);
                    }
                }
                im.syncdataLoad.state = 'loading';
                im.syncdataLoad.progress = 0;
                im.syncdataCallback = function syncdataCallback(error) {
                    if (error) {
                        im.syncdataLoad.state = 'failed';
                        return;
                    }
                    firstSyncdata.set(auth.id);
                    im.syncdataLoad.state = 'success';
                    im.connect();
                    im.loginedGetBasedata();
                };
                Database.init(serverConfig.im.app_key, im.auth.id, () => {
                    syncdata.all(auth.isStaff, im.syncdataCallback, (p) => {
                        im.syncdataLoad.progress = Number(p.toFixed(2));
                    });
                });
            });
        },
        passwordLogin() {
            const context = this;
            const params = {
                phone: context.phone,
                password: context.password,
                zip: context.zip,
                isRememberMe: context.isRememberMe,
            };
            if (context.isOvertime) {
                // 超过 30 天密码置空，重新输入
                context.password = '';
                context.isRememberMe = false;
                cache.remove('loginInfo');
                context.isOvertime = false;
                const message = config.currentLocale().errorCode['password-overtime'];
                Vue.set(context.errors, 'password', message);
                return;
            }
            passwordLogin(this, params, this.$im());
        },
        // 点击三次打开服务配置隐藏入口
        productNameClcik(e) {
            // const event = e;
            const target = e.target;
            const innerHanlder = (innerEvent) => {
                // const inEvent = innerEvent;
                const inTarget = innerEvent.target;
                inTarget.removeEventListener('click', innerHanlder, false);

                this.dosomthing();
            };
            target.addEventListener('click', innerHanlder);
            setTimeout(() => {
                target.removeEventListener('click', innerHanlder, false);
            }, 300);
        },
        dosomthing() {
            this.$router.push('/server-conf');
        },
    },
};

function autoFocus(el) {
    if (isEmpty(el.value) && !autoFocus.done) {
        el.focus();
        autoFocus.done = true;
    }
}

function passwordLogin(context, params, im) {
    if (!context.valid() || context.busy) {
        return;
    }
    const RongIM = context.RongIM;
    const common = RongIM.common;

    context.busy = true;
    im.login(params)
        .then(() => {
            system.appLogger('info', '使用帐号密码方式登录成功!');
            cache.set('account-number', context.phone);
        })
        .fail((errorCode, response) => {
            const serverConfig = getServerConfig();
            const lockAccoutCleardata = (serverConfig.lockaccount || {}).clear_local_data_enable;
            let message = common.getErrorMessage(errorCode) || '';
            if (errorCode) {
                if (response && response.result) {
                    const result = response.result;
                    if (result.unlock_expired_time) {
                        // 账号已被锁定
                        if (lockAccoutCleardata) {
                            cleanStorage();
                        }
                        const timeString = common.timestampToDisplayTime(result.unlock_expired_time);
                        message = templateFormat(message, timeString);
                    } else if (result.retry_count) {
                        // 剩余尝试次数
                        if (result.retry_count === 1 && lockAccoutCleardata) {
                            message = context.locale.clearStorageWarn;
                        } else {
                            message = common.getErrorMessage(`${errorCode}-${result.retry_count}`);
                        }
                    }
                }
            }
            system.appLogger('error', `使用帐号密码方式登录失败! Error: ${JSON.stringify(message)}`);
            Vue.set(context.errors, 'password', message);
            context.password = '';
            cache.remove('login-params');
        }).always(() => {
            context.busy = false;
        });
}
