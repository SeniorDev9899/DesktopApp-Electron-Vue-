/* eslint-disable no-param-reassign */
import syncdataLoading from './components/syncdata-loading.vue';
import onlineStatus from './components/online-status.vue';
import avatar from './components/avatar.vue';
import routes from './routes';
import utils from './utils';
import updateFav from './common/update-fav';
import config from './config';
import languageConf from './locale';
import store from './store';
import pcWin from './browserWindow';
import system from './system';
import client from './client';
import getNavi from './getNavi';
import Database from './Database';
import uploadClient from './upload';
import imageViewer from './imageViewer';

import syncdata, { firstSyncdata } from './syncdata';
import appCache, { Type as APP_CACHE } from './cache/app';

import template from './components/templates/im.shtml';
import { getAppKey, getNaviURL } from './cache/helper';
import updateVersionTip from './dialog/update-version-tip';

export default function (RongIM) {
    const common = RongIM.common;
    const cache = utils.cache;
    const dialog = RongIM.dialog;
    const layout = config.layout;
    const rongMain = layout.main.margin;

    function init(el, error) {
        // 设置缓存模块
        UploadClient.setCache(uploadClient);

        const dataModel = RongIM.dataModel;

        // 模块化屏蔽入口
        // const serverConfig = appCache.get(APP_CACHE.SERVER_CONFIG);
        // const enabledWork = serverConfig.work.enable;
        // const enabledPIN = serverConfig.pin.enable;
        // const rtcEnable = serverConfig.rtc ? serverConfig.rtc.enable : serverConfig.voip.video_enable;

        // 服务地址错误跳转到配置页面
        function isObject(val) {
            return typeof val === 'object' && val !== null;
        }
        function hasError() {
            if (isObject(error)) {
                return false;
            }
            if (error) {
                return true;
            }
            return false;
        }

        const serverConfig = appCache.get(APP_CACHE.SERVER_CONFIG);
        let enabledWork;
        let enabledPIN;
        let rtcEnable;
        if (!hasError()) {
            enabledWork = serverConfig.work.enable;
            enabledPIN = serverConfig.pin.enable;
            rtcEnable = serverConfig.rtc ? serverConfig.rtc.enable : serverConfig.voip.video_enable;
            getRouter.isHasError = false;
            // 1 标识有错误  2没有错误
            window.localStorage.setItem('initProcessIsError', '2');
        } else {
            enabledWork = false;
            enabledPIN = false;
            rtcEnable = false;
            getRouter.isHasError = true;
            window.localStorage.setItem('initProcessIsError', '1');
        }
        const im = new Vue({
            el,
            template,
            store,
            router: getRouter(dataModel),
            data: {
                enableRtc: rtcEnable,
                enabledWork,
                enabledPIN,
                isMaxWindow: false,
                config,
                auth: null,
                cacheAuth: null,
                status: RongIMLib.ConnectionStatus.CONNECTING,
                unReadCount: 0,
                hidden: false,
                isLock: false,
                isScreenLock: false,
                loginUser: null,
                requestUnReadCount: 0,
                approveUnReadCount: 0,
                isShowCollect: config.modules.collect,
                pinUnReadCount: {
                    unComment: 0,
                    unConfirm: 0,
                },
                resizeNode: {
                    rongList: {
                        width: 0,
                    },
                    main: {
                        marginLeft: rongMain.left,
                    },
                    messageInput: {
                        height: 0,
                    },
                },
                resizeDirection: {
                    temp: '',
                    use: '',
                },
                isFirstSyncdata: true,
                syncdataLoad: {
                    show: false,
                    progress: 0,
                    state: 'none',
                },
                screenLockTimer: null,
            },
            computed: {
                locale() {
                    return languageConf[this.config.locale];
                },
                os() {
                    return system.platform;
                },
                showWelcomePage() {
                    const list = [
                        '/conversation',
                        '/contact',
                        '/pin',
                        '/collect',
                    ];
                    return list.indexOf(this.$route.path) >= 0;
                },
                pinNavCount() {
                    const unConfirm = this.formateUnreadCount(
                        this.pinUnReadCount.unConfirm,
                    );
                    return unConfirm;
                },
                isStaff() {
                    return this.auth.isStaff;
                },
                productName() {
                    return this.config.product.name[this.config.locale];
                },
                unReadCountDisplay() {
                    return this.formateUnreadCount(this.unReadCount);
                },
            },
            watch: {
                auth(newValue, oldValue) {
                    const api = {
                        user: dataModel.User,
                        status: dataModel.Status,
                    };
                    const same = $.isEmptyObject(newValue) && $.isEmptyObject(oldValue);
                    if (!same) authChanged(this, api, newValue);
                },
                unReadCount() {
                    updateFav(RongIM);
                },
                pinUnReadCount() {
                    if (this.enabledPIN) updateFav(RongIM);
                },
                $route() {
                    if (hasError()) return;
                    // var im = RongIM.instance;
                    updatePassword(im.auth);
                    // if(config.support.screenshot) {
                    //     toggleScreenShortcut(route);
                    // }
                },
                isLock(newValue) {
                    const notSupport = !this.config.support.voip;
                    if (utils.isEmpty(newValue) || notSupport) {
                        return;
                    }
                    RCCall.disable(newValue);
                },
                isScreenLock(newValue) {
                    const notSupport = !this.config.support.voip;
                    if (utils.isEmpty(newValue) || notSupport) {
                        return;
                    }
                    RCCall.disable(newValue);
                },
            },
            created() {
                let context = this;
                const api = {
                    conversation: dataModel.Conversation,
                    message: RongIM.dataModel.Message,
                    user: RongIM.dataModel.User,
                };
                created(this, api);

                // 【工作台】进入工作台，页面无数据
                this.$on('currentSessionReply', (data) => {
                    const conversationType = data.conversationType;
                    const targetId = data.targetId;
                    console.log(conversationType, targetId);
                    if (conversationType !== undefined && targetId !== undefined) {
                        pcWin.openWork({ conversationType, targetId }, im.auth);
                    }
                });

                window.ondragleave = (e) => {
                    if (!e.fromElement) {
                        // 43170 - 【拖拽转发】鼠标拖拽消息离开目标会话后红框应该消失
                        context.$im().$emit('clear-all-selection');
                    }
                }
            },
            components: {
                'syncdata-loading': syncdataLoading,
                'online-status': onlineStatus,
                avatar,
            },
            methods: {
                dblclickunRead() {
                    this.$root.$emit('scroll');
                },

                routePathStartWith(path) {
                    const currentPath = this.$route.path;
                    return currentPath.indexOf(path) === 0;
                },
                showSetting: dialog.setting,
                userProfile() {
                    dialog.user(im.auth.id);
                },
                updateTotalUnreadCount(list, conversation) {
                    updateTotalUnreadCount(dataModel.Conversation, im, list, conversation);
                },
                min() {
                    pcWin.min();
                },
                max() {
                    pcWin.max();
                    this.isMaxWindow = true;
                },
                restore() {
                    pcWin.restore();
                    this.isMaxWindow = false;
                },
                close() {
                    // 44174 - 【rce-在线会议】会议中，退出rce，自己的主持人权限不会转让
                    RCCall.close();
                    pcWin.close();
                },
                login(params) {
                    const api = {
                        user: dataModel.User,
                        status: dataModel.Status,
                        conversation: dataModel.Conversation,
                    };
                    return login(this, api, params);
                },
                connect() {
                    // var im = this;
                    const naviConfig = naviRequestParams(im.auth);
                    connect(
                        {
                            user: dataModel.User,
                            status: dataModel.Status,
                        },
                        naviConfig,
                        (errorCode, token) => {
                            if (errorCode) {
                                return;
                            }
                            im.auth.token = token;
                            cache.set('auth', im.auth, true);
                            getNativeConversationList(im);
                        },
                    );
                },
                loginedGetBasedata() {
                    loginedGetBasedata(this);
                },
                checkLock() {
                    // var system = this;
                    dataModel.getUserSetting((result) => {
                        if (result.value === 'true') {
                            dialog.deviceLocking();
                            im.isLock = true;
                        }
                    });
                },
                logout() {
                    im.$emit('imLogouted');
                    logout(this, dataModel.Status, dataModel.User);
                    pcWin.closeAll();
                    imageViewer.logout();
                },
                mousedown(event) {
                    if (event.which === 3) {
                        event.preventDefault();
                        this.$emit('imRightClick', event);
                    }
                },
                formateUnreadCount(count) {
                    if (count === 0) {
                        return '';
                    }
                    // eslint-disable-next-line no-nested-ternary
                    return count >= 1000 ? '⋯' : count >= 100 ? '99+' : count;
                },
                openWork() {
                    // 44421 - 【工作台】进入工作台，页面无数据
                    im.$emit('currentSession');
                },
                syncdataLoadFinished() {
                    this.syncdataLoad.show = false;
                    this.syncdataLoad.state = 'none';
                    this.syncdataLoad.progress = 0;
                },
                onNetworkAvailable: function onNetworkAvailable() {
                    // 网络由不可用变可用时触发（已登录时才会触发）
                    const random = 30 + Math.round(Math.random() * 60);
                    clearTimeout(onNetworkAvailable.timeout);
                    onNetworkAvailable.timeout = setTimeout(() => {
                        const auth = im.auth || im.cacheAuth;
                        if (auth) {
                            syncdata.all(auth.isStaff);
                        }
                    }, random * 1000);
                },
                // 刷新
                retrySyncdata() {
                    // var im = this;
                    im.syncdataLoad.state = 'loading';
                    im.syncdataLoad.progress = 0;
                    const auth = im.auth || im.cacheAuth;
                    syncdata.all(auth.isStaff, im.syncdataCallback, (p) => {
                        im.syncdataLoad.progress = Number(p.toFixed(2));
                    });
                },

                /** 502【丹东】【PC端】会话详情支持拓拽消息至其它会话，实现消息转发 */
                dropEvent() {
                    this.$im().$emit('clear-all-selection');
                },
            },
            destroyed() {
                const models = [
                    dataModel.Status,
                    dataModel.Message,
                    dataModel.Friend,
                    dataModel.Account,
                    dataModel.Conversation,
                    dataModel.User,
                    dataModel.Group,
                    dataModel.Pin,
                ];
                cleanup(models);
                unRegListeners(this);
            },
        });
        // 服务地址错误跳转到配置页面
        if (hasError()) {
            RongIM.instance = im;
            setTimeout(() => {
                $('#preload-message').remove();
            }, 0);
            return;
        }
        dataModel.init(config);
        im.dataModel = dataModel;
        initWatch(im);
        turnOffCapsLockWarning();
        im.auth = cache.get('auth');
        RongIM.instance = im;
        if (im.auth) {
            // 已登录
            Database.init(serverConfig.im.app_key, im.auth.id, () => {
                loginedGetBasedata(im);
                const naviConfig = naviRequestParams(im.auth);
                connect(
                    {
                        user: dataModel.User,
                        status: dataModel.Status,
                    },
                    naviConfig,
                    (errorCode, token) => {
                        if (errorCode) {
                            return;
                        }
                        im.auth.token = token;
                        cache.set('auth', im.auth, true);
                        getNativeConversationList(im);
                    },
                );
                im.checkLock();
                setStatus(getStatus());
            });
        }
        RongIM.instance = im;
        setStatus(getStatus());
        // 版本检查
        versionCheck();
    }

    function initWatch(im) {
        const dataModel = im.dataModel;
        const serverConfig = appCache.get(APP_CACHE.SERVER_CONFIG);
        const enabledFriend = serverConfig.friend.enable;
        const enabledPIN = serverConfig.pin.enable;
        watchConnectionStatus(dataModel.Status, im);
        watchMessage(
            dataModel.Message,
            dataModel.Conversation,
            dataModel.User,
            dataModel.Group,
            im,
        );
        watchConversation(dataModel.Conversation, im);
        watchLoginUser(dataModel.User, im);
        watchFriendRequest(dataModel.Friend, im);
        watchAccount(dataModel.Account, im);
        if (enabledPIN) {
            watchPinUnreadCount(dataModel.Pin, im);
        }
        if (enabledFriend) {
            watchApproveRequest(dataModel.Group, im);
        }
    }

    function watchAccount(accountApi, im) {
        accountApi.watch((errorCode) => {
            im.$router.push({ name: 'login' });
            im.logout();
            common.messagebox({
                hashchangeClose: false,
                message: im.locale.errorCode[errorCode],
                callback() {
                    im.logout();
                },
                closeCallback() {
                    im.logout();
                },
            });
        });
    }

    function getRequestList(friendApi, im) {
        friendApi.getRequestList((errorCode, list) => {
            if ($.isEmptyObject(list)) {
                return;
            }
            im.requestUnReadCount = getRequestUnreadCount(list);
        });
    }

    function getRouter(dataModel) {
        const loginRedirect = {
            path: '',
            clear() {
                this.path = '';
            },
        };

        const router = new VueRouter({
            linkActiveClass: routes.linkActiveClass,
            routes: routes.maps,
        });

        router.beforeEach((to, from, next) => {
            // 服务地址错误跳转到配置页面
            if (getRouter.isHasError) {
                next();
                return;
            }
            const im = router.app;
            const publicAccess = to.matched.some(
                record => record.meta.pulicAccess,
            );
            Vue.nextTick(() => {
                if (to.name !== 'login' && (publicAccess || im.auth)) {
                    if (
                        document.body.style.backgroundColor
                        !== 'rgb(255, 255, 255)'
                    ) {
                        document.body.style.backgroundColor = '#FFF';
                    }
                    if (im.isFirst) {
                        im.isFirst = false;
                    }
                }
                if (publicAccess || im.auth) {
                    const path = loginRedirect.path;
                    if (to.name === 'conversation' && path) {
                        loginRedirect.clear();
                        next(path);
                    } else if (to.name === 'login') {
                        im.auth = null;
                        im.cacheAuth = null;
                        next();
                    } else {
                        next(recordPrimarypath(to, from));
                    }
                    return;
                }

                const params = cache.get('login-params');
                if (utils.isEmpty(params) || !params.password) {
                    next({ name: 'login' });
                    return;
                }

                // 自动登录
                dataModel.User.autoLogin(params, (errorCode, result) => {
                    if (errorCode) {
                        loginRedirect.path = to.fullPath;
                        cache.remove('login-params');
                        next({ name: 'login' });
                        return;
                    }
                    document.body.style.backgroundColor = '#FFF';
                    const user = result.staff;
                    const isModifyPwd = result.password_security === 0;
                    const auth = {
                        isExecutive: user.is_executive,
                        name: result.staff.name,
                        portrait: result.staff.portrait_url,
                        id: result.staff.id,
                        token: result.token,
                        code: user.code,
                        companyId: user.company_id,
                        deptId: user.dept_id,
                        isModifyPwd,
                        isStaff: user.user_type === common.UserType.STAFF,
                        orgsInfo: user.orgs_info,
                        display_mobile: user.display_mobile,
                    };
                    im.auth = auth;
                    im.isFirstSyncdata = firstSyncdata.get(user.id);
                    if (im.isFirstSyncdata) {
                        im.syncdataLoad.show = true;
                        if (auth.isStaff) {
                            const departIdList = auth.orgsInfo.map(
                                item => item.id,
                            );
                            syncdata.departmentBranchStaff(departIdList);
                        }
                    }
                    im.syncdataLoad.state = 'loading';
                    im.syncdataLoad.progress = 0;
                    const syncdataCallback = function syncdataCallback(error) {
                        if (error) {
                            im.syncdataLoad.state = 'failed';
                            next({ name: 'login' });
                            return;
                        }
                        firstSyncdata.set(user.id);
                        im.syncdataLoad.state = 'success';
                        loginedGetBasedata(im);
                        const naviConfig = naviRequestParams(auth);
                        const connectSuccess = function connectSuccess(
                            err,
                            token,
                        ) {
                            if (err) {
                                return;
                            }
                            im.auth.token = token;
                            cache.set('auth', im.auth, true);

                            getNativeConversationList(im);
                        };
                        connect(
                            {
                                user: dataModel.User,
                                status: dataModel.Status,
                            },
                            naviConfig,
                            connectSuccess,
                        );
                        if ($('.rong-dialog').length) return;
                        next();
                    };
                    const serverConfig = appCache.get(APP_CACHE.SERVER_CONFIG);
                    Database.init(serverConfig.im.app_key, im.auth.id, () => {
                        syncdata.all(auth.isStaff, syncdataCallback, (p) => {
                            im.syncdataLoad.progress = Number(p.toFixed(2));
                        });
                    });
                });
            });
        });

        return router;
    }

    // 进入一级路径跳转到对应记录路径
    let cachePrimarypath = {};
    function recordPrimarypath(to, from) {
        const toPath = to.path.split('/');
        const fromPath = from.path.split('/');
        if (fromPath.length > 2) {
            cachePrimarypath[fromPath[1]] = from.path;
        } else {
            cachePrimarypath[fromPath[1]] = undefined;
        }
        const query = to.query;
        const useCache = !query.force && toPath.length === 2;
        if (useCache) {
            return cachePrimarypath[toPath[1]];
        }
        return undefined;
    }

    // 新版里只向sessionStorage里保存auth，
    // 旧版本里向localStorage里保存auth，会影响到新版本里的cache.get('auth')取值，
    // 需要清理下
    function fixCache(keyNS) {
        cache.remove(`${keyNS}auth`);
        // localStorage.removeItem(keyNS + 'auth');
    }

    function created(context) {
        // 监听 notification 点击事件
        system.onNotificationClicked((conversationType, targetId) => {
            const currentDialogObj = window.RongIM.common.mountDialog.current;
            if (currentDialogObj && Object.keys(currentDialogObj).length > 0) {
                return;
            }
            const path = {
                name: 'conversation',
                params: {
                    targetId,
                    conversationType,
                },
            };
            context.$router.push(path);
        });

        client.regLogout(() => {
            context.logout();
        });

        client.regAccount(() => {
            context.showSetting(context);
        });

        if (context.config.support.balloonClick) {
            client.regBalloon((event, opt) => {
                const path = {
                    name: 'conversation',
                    params: {
                        targetId: opt.data.targetId,
                        conversationType: opt.data.targetType,
                    },
                };
                context.$router.push(path);
            });
        }

        client.regWindowFocus(() => {
            if (context.screenLockTimer) {
                clearTimeout(context.screenLockTimer);
                context.screenLockTimer = null;
            }
        });

        client.regWindowBlur(() => {
            if (context.auth && utils.cache.get(`screen-lock-pwd-${context.auth.id}`)) {
                const cacheLockPwd = utils.cache.get(`screen-lock-pwd-${context.auth.id}`);
                if (cacheLockPwd.autoLock && !context.isScreenLock && !context.screenLockTimer) {
                    context.screenLockTimer = setTimeout(() => {
                        if (!context.isLock) {
                            dialog.screenLocking();
                            context.isScreenLock = true;
                        }
                    }, context.config.screenLockTime);
                }
            }
        });
        $(window).on('focus', () => {
            context.hidden = false;
            const targetId = context.$route.params.targetId;
            if (!utils.isEmpty(targetId)) {
                /**
                 * 37832-【会话窗口】，鼠标滚动到顶部，收到超过 5 条以上的消息，点击查看消息，没有显示在最后一条消息位置
                 * The issue occurs because this function will be called first than scrollToNewMessage.
                 */
                // conversationApi.clearUnReadCount(conversationType, targetId);
            }
        });
        /**
         * 38153-【会话列表】当前在会话窗口，收到消息后，会话列表会闪一下未读数
         * Although the user is seeing the chat window, if it is not active then it shows the <unread> state
         * So this code will comment.
         */

        /* $(window).on('blur', () => {
            context.hidden = true;
        }); */

        if (context.config.support.voip) {
            RCCall.init();
        }
    }

    function unRegListeners() {
        pcWin.unregLogout();
        pcWin.unregAccount();
        pcWin.unregWindowFocus();
        pcWin.unregWindowBlur();
        if (config.support.balloonClick) {
            pcWin.unregBalloon();
        }
    }

    function authChanged(im, api, auth) {
        // auth changed 导致 connect 重复调用
        if (!auth) {
            const $fav = $('#rong-favicon');
            updateFav(RongIM, $fav.data('default-value'));

            if (im.status === RongIMLib.ConnectionStatus.CONNECTED) {
                api.status.disconnect();
            }
            // 39331- 【在线状态】对方账号在线，聊天窗口显示对方为离线
            const forcedLogout = cache.get('forcedLogout');
            if (forcedLogout === 'kicked') {
                api.user.logoutByKicked();
            } else {
                api.user.logout();
            }
            clearCache();
            try {
                system.logout();
            } catch (e) {
                throw new Error('system.logout error!', e);
            }
            if (im.$route.name !== 'login') {
                im.$router.push({ name: 'login' });
            }
        }
    }

    const getPinUnConfirmCount = utils.throttle((pinApi, im) => {
        pinApi.getUnConfirmCount((errorCode, unconfirm) => {
            if (!errorCode) {
                // 计数-1
                if (unconfirm.cnt < 0) {
                    im.pinUnReadCount.unConfirm = 0;
                } else {
                    im.pinUnReadCount.unConfirm = unconfirm.cnt;
                }
                updateUnreadCount();
                updateFav(RongIM);
            }
        });
    }, 2000);
    const getPinCommentUnreadCount = utils.throttle((pinApi, im) => {
        pinApi.getUnReadCount((errorCode, unread) => {
            if (!errorCode) {
                im.pinUnReadCount.unComment = unread.cnt;
            }
        });
    }, 2000);

    function loginedGetBasedata(im) {
        const userApi = im.dataModel.User;
        const auth = im.auth;
        if (auth.isStaff) {
            userApi.getDetail(auth.id, (errorCode, user) => {
                if (errorCode) {
                    common.toastError(errorCode);
                    return;
                }
                im.loginUser = user;
            });
        } else {
            userApi.getVisitors(auth.id, (errorCode, user) => {
                if (errorCode) {
                    common.toastError(errorCode);
                    return;
                }
                im.loginUser = user;
            });
        }

        setApproveUnReadCount(im.dataModel.Group, im);
        getRequestList(im.dataModel.Friend, im);
        getPinUnConfirmCount(im.dataModel.Pin, im);
        getPinCommentUnreadCount(im.dataModel.Pin, im);

        system.login();
    }

    function firstMultideviceLogin(conversationApi) {
        // 首次多端同时登陆显示文件助手
        let otherDeviceLogin = false;
        const loginStatus = utils.cache.get('login_status');
        if (loginStatus && loginStatus.length) {
            loginStatus.forEach((item) => {
                if (item.title === 'Login_Status_Mobile') {
                    otherDeviceLogin = true;
                }
            });
        }
        if (otherDeviceLogin) {
            utils.cache.set('login_status', '');
            conversationApi.addFileHelper();
        }
    }

    function login(context, api, params) {
        const im = context;
        const defer = $.Deferred();
        const loginParams = {
            isRememberMe: params.isRememberMe,
            phone: params.phone,
            zip: params.zip,
            agent: {
                platform: utils.getPlatform(),
                device_id: common.getDeviceId(),
            },
            status: getStatus(),
        };

        const requriedPassword = utils.isEmpty(cache.get('login-params'));
        if (requriedPassword) {
            loginParams.password = params.password;
        }
        // 2019-06-12 密码加密传输 uapi.user.login 改为 api.user.securityLogin
        api.user.securityLogin(loginParams, (errorCode, result) => {
            if (errorCode) {
                im.auth = null;
                defer.reject(errorCode, result);
            } else {
                const user = result.staff;
                // password_security 密码安全状态，0表示初始密码需要修改，大于0表示密码正常(1为弱密码，2为强密码)
                const isModifyPwd = result.password_security === 0;
                const auth = {
                    isExecutive: result.staff.is_executive,
                    name: result.staff.name,
                    portrait: result.staff.portrait_url,
                    id: result.staff.id,
                    token: result.token,
                    code: user.code,
                    companyId: user.company_id,
                    deptId: user.depart_id,
                    isStaff: user.user_type === 0,
                    isModifyPwd,
                    // 多公司多部门 部门 path
                    orgsInfo: user.orgs_info,
                    display_mobile: user.display_mobile,
                };
                im.cacheAuth = auth;
                // 首次多端同时登陆显示文件助手 其他端登录状态 login_status
                cache.set('login_status', result.login_status);

                if (isModifyPwd) {
                    cache.set('auth-password', loginParams.password, true);
                }

                if (params.isRememberMe) {
                    const backup = $.extend(true, {}, loginParams);
                    cache.set('login-params', backup);
                }
                im.isFirstSyncdata = firstSyncdata.get(user.id);
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
                        defer.reject(error);
                        return;
                    }
                    firstSyncdata.set(user.id);
                    im.syncdataLoad.state = 'success';
                    const naviConfig = naviRequestParams(auth);
                    connect(api, naviConfig, (err, token) => {
                        if (err) {
                            defer.reject(err);
                            return;
                        }
                        firstMultideviceLogin(api.conversation);

                        auth.token = token;
                        const isTemp = true;
                        cache.set('auth', auth, isTemp);
                        getNativeConversationList(im);
                        im.auth = auth;
                        loginedGetBasedata(im);

                        im.$router.push({ name: 'conversation' });
                        defer.resolve(auth);
                        im.checkLock();
                    });
                };
                const serverConfig = appCache.get(APP_CACHE.SERVER_CONFIG);
                Database.init(serverConfig.im.app_key, user.id, () => {
                    syncdata.all(auth.isStaff, im.syncdataCallback, (p) => {
                        im.syncdataLoad.progress = Number(p.toFixed(2));
                    });
                });
            }
            im.busy = false;
        });
        return defer.promise();
    }

    function getStatus() {
        return cache.get('online-status') || 'online';
    }

    function connect(api, naviConfig, callback) {
        callback = callback || $.noop;
        callback.done = false;
        const deviceId = common.getDeviceId();
        const im = RongIM.instance;
        const status = im.status;
        const connected = status === RongIMLib.ConnectionStatus.CONNECTED;
        if (connected) {
            callback(null, naviConfig.token);
            return;
        }
        getNavi(naviConfig, (error, result) => {
            if (error) {
                system.appLogger(
                    'error',
                    `获取导航配置失败! Error: ${JSON.stringify(error)}`,
                );
                callback(error);
                return;
            }
            system.appLogger(
                'info',
                `获取导航配置成功! Result:\n${JSON.stringify(
                    result,
                    null,
                    '  ',
                )}`,
            );
            api.status.connect(
                result,
                naviConfig.token,
                deviceId,
                (errorCode) => {
                    if (callback.done) {
                        return;
                    }
                    callback.done = true;
                    if (errorCode) {
                        if (connect.retry === 'done') {
                            system.appLogger(
                                'error',
                                `链接 RCX 服务失败! Error: ${JSON.stringify(
                                    error,
                                )}`,
                            );
                            callback(errorCode);
                            return;
                        }

                        api.user.refreshToken((err, info) => {
                            if (err) {
                                system.appLogger(
                                    'error',
                                    'Refresh RCX Token Failed!!!',
                                );
                                callback(err);
                                return;
                            }
                            connect.retry = 'done';
                            const token = info.token;
                            system.appLogger(
                                'error',
                                `Refresh RCX Token Succeed!!! token = ${token}`,
                            );
                            const auth = im.auth || im.cacheAuth;
                            auth.token = token;
                            cache.set('auth', im.auth, true);
                            naviConfig.token = token;
                            connect(api, naviConfig, callback);
                        });
                    } else {
                        // 连接成功的时间
                        system.appLogger('info', '链接 RCX 服务成功!');
                        // 同步远程会话列表
                        syncRemoteConversations(() => {
                            callback(null, naviConfig.token);
                        });
                    }
                },
            );
        });
    }

    // 同步远程会话列表，
    function syncRemoteConversations(callback) {
        callback();
        // TODO: 暂时关闭此功能，且同步列表未成功，需跟 王平、宏博 联调
        // if (syncRemoteConversations.running) {
        //     callback();
        //     return;
        // }

        // var userId = RongIM.dataModel._Cache.auth.id;
        // var cacheKey = userId + '-sync-remote-conversation';
        // var latestTime = parseInt(RongIM.utils.cache.get(cacheKey) || 0);
        // var now = Date.now();

        // // 每 12 个小时可同步一次，避免频繁拉取，IM 服务压力过大
        // if (now - latestTime < 12 * 1000 * 3600) {
        //     callback();
        //     return;
        // }

        // syncRemoteConversations.running = true;

        // system.appLogger('info', 'sync remote conversations => ');
        // RongIMClient.getInstance().getRemoteConversations(1000, 0, 0, {
        //     onSuccess: function () {
        //         syncRemoteConversations.running = false;
        //         system.appLogger('info', 'sync remote conversations => success!');
        //         // 记录同步时间
        //         RongIM.utils.cache.set(cacheKey, now.toString());
        //         callback();
        //     },
        //     onError: function () {
        //         syncRemoteConversations.running = false;
        //         system.appLogger('info', 'sync remote conversations => error!');
        //         callback();
        //     }
        // });
    }

    function logout(context) {
        const im = context;
        client.unregOpenCoversation();
        im.auth = null;
        im.cacheAuth = null;
        im.loginUser = null;
        cachePrimarypath = {};
        if (im.config.support.voip) {
            RCCall.close();
        }
        pcWin.closeWork();
        pcWin.closeSealMeeting();
        if (im.$route.name !== 'login') {
            im.$router.push({ name: 'login' });
        }
        // common.downloaders.clear();
        RongIM.resCache = null;
    }

    function clearCache() {
        cache.remove('auth');
        cache.remove('online-status');
        // cache.remove('sysMessage');
        cache.remove('login-params');
    }

    function promptForcedLogout(im, errorCode) {
        im.logout();
        // status 6 其他端登录会连续触发两次关闭上次弹窗
        if (
            promptForcedLogout.precursor
            && promptForcedLogout.precursor.close
        ) {
            promptForcedLogout.precursor.close();
        }
        promptForcedLogout.precursor = common.messagebox({
            hashchangeClose: false,
            message: im.locale.errorCode[errorCode],
        });
    }

    function versionCheck() {
        // web 版无需检查
        if (system.platform.indexOf('web') > -1) {
            return;
        }
        const versionChecker = RongIM.dataModel.versionChecker;
        const now = Date.now();
        versionChecker.lastTimestamp = versionChecker.lastTimestamp || 0;
        // 10 分钟内不做二次检查
        if (now - versionChecker.lastTimestamp < 10 * 60 * 1000) {
            return;
        }
        versionChecker.lastTimestamp = now;
        // 平台标识
        let platform;
        if (system.platform.startsWith('darwin')) {
            platform = versionChecker.PLATFORM.MAC_OS;
        } else if (system.platform === 'linux') {
            platform = versionChecker.PLATFORM.LINUX;
        } else {
            platform = versionChecker.PLATFORM.WINDOWS;
        }
        // 版本号
        const versionCode = RongIM.config.product.versionCode;
        RongIM.dataModel.versionChecker.check(
            platform,
            versionCode,
            (versionInfo) => {
                if (!versionInfo) {
                    return;
                }
                const downloadUrl = versionInfo.download_url;
                function openBrowser() {
                    // 使用默认浏览器打开地址
                    const promise = system.openByBrowser(downloadUrl);
                    promise.then(() => {
                        system.exit();
                    });
                }
                function closeCallback() {
                    RongIM.instance.$router.push({ name: 'conversation' });
                }
                updateVersionTip(versionInfo).done(
                    openBrowser,
                ).catch(
                    closeCallback,
                );
            },
        );
    }

    function watchConnectionStatus(statusApi, im) {
        const dataModel = RongIM.dataModel;
        const api = {
            user: dataModel.User,
            status: dataModel.Status,
            conversation: dataModel.Conversation,
        };
        const kickedStatus = RongIMLib.ConnectionStatus.KICKED_OFFLINE_BY_OTHER_CLIENT;
        const blockedStatus = RongIMLib.ConnectionStatus.USER_BLOCKED;
        const errMap = {
            'logout-by-otherclient': 'logout-by-otherclient',
        };
        errMap[kickedStatus] = 'kicked-offline-by-otherclient';
        errMap[blockedStatus] = 'user-be-blocked';
        function reconnectNavi() {
            const user = im.cacheAuth || im.auth;
            if (utils.isEmpty(user)) {
                // 用户已退出登录不再做重连
                return;
            }
            const naviConfig = naviRequestParams(user);
            connect(api, naviConfig, (errorCode, token) => {
                if (errorCode) {
                    // console.warn(errorCode);
                    // 3秒后重试
                    api.status.disconnect();
                    setTimeout(reconnectNavi, 3000);
                    return;
                }
                firstMultideviceLogin(api.conversation);
                const auth = $.extend({}, im.cacheAuth || im.auth);
                auth.token = token;
                const isTemp = true;
                cache.set('auth', auth, isTemp);
                cache.set('local-auth', auth);
                im.auth = auth;

                im.$router.push({ name: 'conversation' });
                im.checkLock();
            });
        }
        statusApi.watch((status) => {
            if (errMap[status]) {
                im.$emit('userBlocked');
                promptForcedLogout(im, errMap[status]);
                // 39331- 【在线状态】对方账号在线，聊天窗口显示对方为离线
                if (status === RongIMLib.ConnectionStatus.KICKED_OFFLINE_BY_OTHER_CLIENT) {
                    cache.set('forcedLogout', 'kicked');
                }
                return;
            }

            im.status = status;

            const connected = status === RongIMLib.ConnectionStatus.CONNECTED;
            const connecting = status === RongIMLib.ConnectionStatus.CONNECTING;

            // 版本检查
            if (connected) {
                versionCheck();
            }

            if (status === RongIMLib.ConnectionStatus.DISCONNECTED) {
                // 网络断开设置图标为掉线灰色
                system.setConnectStatus(false);
            } else if (connected) {
                system.setConnectStatus(true);
                syncRemoteConversations($.noop);
            } else if (status === 30010) {
                // tcp链接不通，断开链接，重新连接
                api.status.disconnect();
                networkAvailable(function afterNetworkAvailable(result) {
                    if (!result) {
                        setTimeout(
                            networkAvailable,
                            3000,
                            afterNetworkAvailable,
                        );
                        return;
                    }
                    im.onNetworkAvailable();
                    reconnectNavi();
                });
            } else if (status === 31004) {
                // token 失效
                api.status.disconnect();
                networkAvailable(function afterNetworkAvailable2(result) {
                    if (!result) {
                        setTimeout(
                            networkAvailable,
                            3000,
                            afterNetworkAvailable2,
                        );
                        return;
                    }
                    api.user.refreshToken((err, info) => {
                        if (err) {
                            system.appLogger(
                                'error',
                                'Refresh RCX Token Failed!!!',
                            );
                            setTimeout(
                                networkAvailable,
                                3000,
                                afterNetworkAvailable2,
                            );
                            return;
                        }
                        const token = info.token;
                        system.appLogger(
                            'error',
                            `Refresh RCX Token Succeed!!! token = ${token}`,
                        );
                        RongIM.instance.auth.token = token;
                        cache.set('auth', im.auth, true);
                        im.onNetworkAvailable();
                        reconnectNavi();
                    });
                });
            }

            // // c++ SDK 有自动重连机制 不需要处理重连
            if (
                utils.isEmpty(im.auth)
                || connected
                || connecting
                || im.config.support.autoReconnect
            ) {
                return;
            }
            checkToConnect(statusApi, im);
        });

        system.onResume = function onResume() {
            system.appLogger('info', 'RCE renderer resumed !!!');
            // 帐号未登录
            if (utils.isEmpty(im.auth)) {
                return;
            }
            // 同步数据: 离线时收不到部门变更状态消息
            im.onNetworkAvailable();
            // 系统恢复时若当前未连接，则主动断开并重新连接
            if (
                RongIM.instance.status
                === RongIMLib.ConnectionStatus.DISCONNECTED
            ) {
                reconnectNavi();
            }
        };
    }

    // web 平台需手动检测网络状态并重新连接
    function checkToConnect(statusApi, im) {
        if (utils.isEmpty(im.auth)) {
            return;
        }
        networkAvailable((result) => {
            if (result) {
                statusApi.reconnect((errorCode) => {
                    if (!errorCode) {
                        // 重连成功之后设置图标为在线颜色
                        system.setConnectStatus(true);
                    }
                });
                return;
            }
            setTimeout(checkToConnect, 3000, statusApi, im);
        });
    }

    function networkAvailable(callback) {
        callback(true);
    }

    const notificationMessageList = [
        'TextMessage',
        'ImageMessage',
        'FileMessage',
        'VoiceMessage',
        'LocationMessage',
        'LocalFileMessage',
        'LocalImageMessage',
        'CardMessage',
        'SightMessage',
        'RichContentMessage',
        'ApprovalMessage',
        'JrmfRedPacketMessage',
        'PublicServiceRichContentMessage',
        'PublicServiceMultiRichContentMessage',
        'ReferenceMessage',
    ];

    const notificationMessageConvert = {
        TextMessage(msg) {
            const textMessage = msg.content;
            let content = textMessage.content;
            content = utils.htmlLang.check(content);
            return content;
        },
        FileMessage(msg) {
            return msg.content.name;
        },
        LocalFileMessage(msg) {
            return msg.content.name;
        },
        CardMessage(msg) {
            const name = msg.content.name;
            const locale = RongIM.instance.locale;
            const text = locale.message.cardOther;
            return utils.templateFormat(text, name);
        },
        ApprovalMessage(msg) {
            return msg.content.content;
        },
        JrmfRedPacketMessage(msg) {
            return common.getJrmfRedPacket(msg);
        },
        PublicServiceRichContentMessage(msg) {
            const content = msg.content;
            if (!content) {
                return '';
            }
            let articles = content.articles;
            // Web SDK 与 C++ SDK 定义消息结构不一致导致
            if (content.richContentMessage && content.richContentMessage.articles) {
                articles = content.richContentMessage.articles;
            }
            return articles && articles.length > 0 ? articles[0].title : '';
        },
        PublicServiceMultiRichContentMessage(msg) {
            const content = msg.content;
            if (!content) {
                return '';
            }
            let articles = content.articles;
            // Web SDK 与 C++ SDK 定义消息结构不一致导致
            if (content.richContentMessages && content.richContentMessages.articles) {
                articles = content.richContentMessages.articles;
            }
            return articles && articles.length > 0 ? articles[0].title : '';
        },
        ReferenceMessage(msg) {
            let content = msg.content.text;
            content = utils.htmlLang.check(content);
            return common.convertMessage(content);
        },
    };

    const getPrefix = function getPrefix(msg) {
        return RongIM.instance.locale.message.prefix[msg.messageType] || '';
    };

    const getShowText = function getShowText(
        msg,
        isAt,
        groupApi,
        userApi,
        callback,
    ) {
        const convert = notificationMessageConvert[msg.messageType] || $.noop;
        const content = convert(msg) || '';
        const notifyMsg = `${getPrefix(msg)} ${content}`;
        const options = {
            title: '',
            // 默认显示“你收到一条新消息”
            body: RongIM.instance.locale.components.settingSystem.notifyText,
        };
        const isShowPreview = cache.get('showPreview');
        const userId = msg.senderUserId;
        if (msg.conversationType === RongIMLib.ConversationType.GROUP) {
            groupApi.getOne(msg.targetId, (errorCode, group) => {
                if (errorCode) {
                    utils.console.warn(
                        `获取群组信息失败, groupId=${msg.targetId}（错误码：${errorCode}）`,
                    );
                    options.title = `group<${msg.targetId}>`;
                } else {
                    options.title = group.name;
                }
                if (isShowPreview) {
                    userApi.get(userId, (_errorCode, user) => {
                        let userName = `user<${userId}>`;
                        if (_errorCode) {
                            utils.console.warn(
                                `获取用户信息失败, userId=${userId}（错误码：${_errorCode}）`,
                            );
                        } else {
                            userName = common.getGroupUsername(
                                user,
                                msg.targetId,
                            );
                        }
                        if (isAt) {
                            options.body = utils.templateFormat(
                                RongIM.instance.locale.components.settingSystem
                                    .atText,
                                userName,
                            );
                        } else {
                            options.body = `${userName}: ${notifyMsg}`;
                        }
                        callback(options);
                    });
                } else {
                    callback(options);
                }
            });
        } else {
            userApi.get(userId, (errorCode, user) => {
                let userName = `user<${userId}>`;
                if (errorCode) {
                    utils.console.warn(
                        `获取用户信息失败, userId=${userId}（错误码：${errorCode}）`,
                    );
                } else {
                    userName = common.getUsername(user);
                }
                options.title = userName;
                if (isShowPreview) {
                    options.body = notifyMsg;
                }
                callback(options);
            });
        }
    };

    function getIsAt(message, im) {
        const hasUnRead = true;
        const mentionMsg = message.content.mentionedInfo;
        if (!mentionMsg) {
            return false;
        }
        if (mentionMsg.type === RongIMLib.MentionedType.ALL) {
            return hasUnRead;
        }
        const userIdList = mentionMsg.userIdList;
        return userIdList.indexOf(im.auth.id) !== -1 && hasUnRead;
    }

    function watchMessage(messageApi, conversationApi, userApi, groupApi, im) {
        messageApi.watch((message) => {
            console.log('message:', message);
            const auth = im.auth;
            if (utils.isEmpty(auth)) {
                return;
            }
            const params = {
                conversationType: message.conversationType,
                targetId: message.targetId,
            };
            const content = message.content;
            const isCurrentChat = common.sameConversaton(
                params,
                im.$route.params,
            );

            // 正在会话的群被解散给出提示并退出会话
            if (message.messageType === 'GroupNotifyMessage') {
                const isDismiss = `${message.content.action}` === '2';
                if (isDismiss && isCurrentChat) {
                    im.$router.push({
                        name: 'conversation',
                        query: {
                            force: 1,
                        },
                    });
                }
                return;
            }

            // 收到设备锁屏消息，显示弹层
            if (message.messageType === 'MultiClientMessage') {
                if (+message.content.action === 1) {
                    // 锁定
                    dialog.deviceLocking();
                    im.isLock = true;
                }
                return;
            }

            // 收到设备锁定消息，退出登录
            if (message.messageType === 'DeviMonitorMessage') {
                // 设备锁定消息需判断是否是针对当前设备做操作
                if (common.getDeviceId() === message.content.device_id) {
                    if (+message.content.action === 1) {
                        common.messagebox({
                            message: im.locale.components.device.locked,
                            callback: im.logout,
                            closeCallback: im.logout,
                        });
                    } else if (+message.content.action === 2) {
                        const handle = function handle() {
                            Database.clean(getAppKey(), im.auth.id);
                            im.logout();
                            // 同时删除本地存储的消息
                            messageApi.ClearData();
                        };
                        common.messagebox({
                            message: im.locale.components.device.erase,
                            callback: handle,
                            closeCallback: handle,
                        });
                    }
                }
                return;
            }

            // 外部联系人转内部员工通知消息
            if (message.messageType === 'UserTypeChangedMessage') {
                firstSyncdata.remove(im.auth.id);
                const companyName = message.content.company_name;
                const logoutHandle = function logoutHandle() {
                    im.logout();
                };
                common.messagebox({
                    hashchangeClose: false,
                    callback: logoutHandle,
                    closeCallback: logoutHandle,
                    message: utils.templateFormat(
                        im.locale.errorCode['user-status-updated'],
                        companyName,
                    ),
                });
                return;
            }

            if (message.messageType === 'AppNotifyMessage') {
                const publicEnable = content.content.enable;
                const publicAction = content.content.action;
                // 收到公众号关闭通知或者该用户不可见,都提示公众号已关闭.删除会话列表中对应公众号会话，正在会话的公众号退出当前会话
                if (
                    (content.cmd_type === 1 && !publicEnable)
                    || (content.cmd_type === 3 && publicAction === 'del')
                ) {
                    conversationApi.remove(
                        message.conversationType,
                        message.targetId,
                    );
                    if (isCurrentChat) {
                        common.messagebox({
                            message: im.locale.components.public.tips,
                            callback() {
                                im.$router.push({
                                    name: 'conversation',
                                    query: {
                                        force: 1,
                                    },
                                });
                            },
                        });
                    }
                }
                pcWin.sendPublicNotify(message);
                return;
            }

            // RCE Server 订阅状态通知
            if (message.messageType === 'PresenceNotificationMessage') {
                const isPhoneLogin = content.title === 'Login_Status_Mobile';
                if (params.targetId === auth.id && isPhoneLogin) {
                    conversationApi.addFileHelper();
                }
                const conParams = {
                    conversationType: message.conversationType,
                    targetId: message.content.targetId,
                };
                const isSameConversaton = common.sameConversaton(
                    conParams,
                    im.$route.params,
                );
                if (isSameConversaton) {
                    userApi.getDetail(content.targetId, (errorCode, user) => {
                        if (errorCode) {
                            return;
                        }
                        user.onlineStatus = user.onlineStatus || {};
                        user.onlineStatus[content.title] = content;

                        const loginUser = RongIM.instance.loginUser;
                        if (loginUser && loginUser.id === user.id) {
                            user.mobile = loginUser.mobile;
                        }
                        userApi.observerList.notify(user);
                    });
                }
                return;
            }

            // 系统消息通知提示音
            const isNewMessage = message.sentStatus === RongIMLib.SentStatus.SENT
                || message.sentStatus === RongIMLib.SentStatus.RECEIVED
                || message.receivedStatus === 0;
            const isSelf = message.senderUserId === auth.id;
            const notOfflineMessage = !message.offLineMessage;
            const isSystemMessage = +message.conversationType === RongIMLib.ConversationType.SYSTEM;
            const key = 'sysMessage';
            const ring = cache.get(key);
            const isNotify = notificationMessageList.indexOf(message.messageType) > -1;
            if (
                isNewMessage
                && !isSelf
                && notOfflineMessage
                && !isSystemMessage
                && isNotify
            ) {
                conversationApi.getExpandInfo(params, (errorCode, info) => {
                    info = info || {};
                    const notify = !info.not_disturb;
                    const isAt = getIsAt(message, im);
                    const isFocused = pcWin.isFocused();
                    const isVisible = pcWin.isVisible();
                    const isMac = system.platform.startsWith('darwin');
                    const isWin = system.platform.startsWith('win32');
                    if (
                        (notify || isAt)
                        && !isWin
                        && (!isVisible || !isFocused)
                    ) {
                        getShowText(
                            message,
                            isAt,
                            groupApi,
                            userApi,
                            (showOptions) => {
                                system.messageNotification({
                                    conversationType: message.conversationType,
                                    targetId: message.targetId,
                                    title: showOptions.title,
                                    body: showOptions.body,
                                    permanentNot: !!cache.get('permanentNot'),
                                });
                            },
                        );
                    }
                    if (!isMac && notify) {
                        pcWin.flashFrame();
                        if (ring) {
                            common.playSound();
                        }
                    }
                });
            }
        });
    }

    function getNativeConversationList(im, conversation) {
        const conversationApi = im.dataModel.Conversation;
        const isWeb = system.platform.indexOf('web') > -1;
        if (!isWeb) {
            im.updateTotalUnreadCount([], conversation);
            return;
        }
        conversationApi.getNativeList((errorCode, list) => {
            if (errorCode) {
                common.toastError(errorCode);
                return;
            }
            im.updateTotalUnreadCount(list, conversation);
        });
    }

    function watchConversation(conversationApi, im) {
        // 38805 - 【消息计数】收到消息，会话列表里会话计数与消息图标计数显示不同步，会话计数慢
        conversationApi.watch((conversation) => {
            getNativeConversationList(im, conversation);
        });
    }

    function watchLoginUser(userApi, im) {
        userApi.watch((user) => {
            if (im.loginUser && user.id === im.loginUser.id) {
                $.extend(im.loginUser, user);
            }
        });
    }

    function updateTotalUnreadCount(conversationApi, im, list, conversation) {
        utils.throttle(() => {
            conversationApi.getTotalUnreadCount(list, (errorCode, total) => {
                // 38805 - 【消息计数】收到消息，会话列表里会话计数与消息图标计数显示不同步，会话计数慢
                // 收到消息时更新会话列表,延时1000ms,页面平滑过渡(查看pageRefresh函数)
                // 所以，需要 setTimeout
                if (conversation) {
                    im.unReadCount = total;
                    updateUnreadCount();
                } else {
                    setTimeout(() => {
                        im.unReadCount = total;
                        // 41807 - 【消息计数】偶现-导航上显示有5条计数，应用图标上显示有2条计数
                        updateUnreadCount();
                    }, 1100);
                }
            });
        }, 600)();
    }

    function updateUnreadCount() {
        const im = RongIM.instance;
        const normalUnRead = im.unReadCount;
        const pinUnRead = im.enabledPIN ? im.pinUnReadCount.unConfirm : 0;
        let totalUnRead = normalUnRead + pinUnRead;
        totalUnRead = im.formateUnreadCount(totalUnRead);
        pcWin.updateBadgeNumber(normalUnRead + pinUnRead, totalUnRead);
    }

    function getRequestUnreadCount(list) {
        let total = 0;
        list.forEach((item) => {
            if (
                item.read_state === 0
                && item.state === common.FriendState.INVITEE
            ) {
                total += 1;
            }
        });
        return total;
    }

    function watchFriendRequest(friendApi, im) {
        friendApi.watch((result) => {
            const auth = im.auth;
            if (utils.isEmpty(auth)) {
                return;
            }
            if (result.type === 'Friend') {
                return;
            }
            im.requestUnReadCount = getRequestUnreadCount(result.list);
        });
    }

    function watchApproveRequest(groupApi, im) {
        if (im.auth) {
            setApproveUnReadCount(groupApi, im);
        }
        groupApi.watch((message) => {
            const auth = im.auth;
            if (utils.isEmpty(auth)) {
                return;
            }
            const messageType = message.messageType;
            const isGroupVerifyNotify = messageType === 'GroupVerifyNotifyMessage';
            const currentPath = im.$route.path;
            const isApprove = currentPath.indexOf('/contact/approve') === 0;

            if (isGroupVerifyNotify) {
                setApproveUnReadCount(groupApi, im, (count) => {
                    if (isApprove && count > 0) {
                        groupApi.clearApproveUnRead(() => {
                            im.approveUnReadCount = 0;
                        });
                    }
                });
            }
        });
    }

    function setApproveUnReadCount(groupApi, im, callback) {
        callback = callback || $.noop;
        groupApi.getApproveUnread((err, count) => {
            if (!err) {
                im.approveUnReadCount = count;
                callback(count);
            }
        });
    }

    function watchPinUnreadCount(pinApi, im) {
        if (im.auth) {
            getPinUnConfirmCount(pinApi, im);
            getPinCommentUnreadCount(pinApi, im);
        }
        pinApi.watch((message) => {
            const auth = im.auth;
            if (utils.isEmpty(auth)) {
                return;
            }
            const loginId = im.auth ? im.auth.id : null;
            const isPinComment = pinApi.MessageType.PinCommentMessage === message.messageType;
            const isPinCommentRead = pinApi.MessageType.PinCommentReadMessage
                === message.messageType;
            const isSelf = message.content.publisherUid === loginId;
            // 38912 - 【PIN】接收者未确认 PIN 时，发送方删除 PIN 消息，接收者确认后仍显示一条 PIN 消息提示
            if (!isPinComment || message.messageType === 'PinNotifyMessage') {
                getPinUnConfirmCount(pinApi, im);
            }
            if ((isPinComment && !isSelf) || isPinCommentRead) {
                getPinCommentUnreadCount(pinApi, im);
            }
        });
    }

    function turnOffCapsLockWarning() {
        document.msCapsLockWarningOff = true;
    }

    function cleanup(models) {
        models.forEach((model) => {
            model.unwatch();
        });
    }

    RongIM.init = function imInit(el, callback) {
        callback = callback || $.noop;

        RongIM.dataModel.getServerConfig(config.netEnvironment, (error, features) => {
            if (error) {
                system.appLogger(
                    'error',
                    `Get /configuration/all failed!\nResson: ${JSON.stringify(
                        error,
                    )}`,
                );
                // 服务地址错误跳转到配置页面
                const userSetting = cache.get('locale');
                let locale = userSetting || config.locale;
                if (!locale) {
                    // zh-CN --> zh;
                    let systemLocale = system.locale.split('-')[0];
                    systemLocale = systemLocale.toLowerCase();
                    locale = systemLocale;

                    const supportList = [];
                    $.each(languageConf, (key) => {
                        supportList.push(key);
                    });
                    const notSupport = supportList.indexOf(locale) === -1;
                    if (notSupport) {
                        locale = supportList[0];
                        utils.console.log('不支持语言：', locale);
                    }
                }
                // 仅支持 zh, en 其他语言会导致程序错误
                if (locale !== 'zh') {
                    locale = 'en';
                }
                config.locale = locale;
                system.setLanguage(config.locale);
                RongIMLib.RongIMEmoji.setConfig({ lang: locale });
                document.title = config.product.name[locale];
                config.product.productName = config.product.name[config.locale];
                init(el, error);
                callback(error);
                return;
            }
            callback(null);

            system.appLogger(
                'info',
                `Get /configuration/all succeed! Result:\n${JSON.stringify(
                    features,
                )}`,
            );
            appCache.set(APP_CACHE.SERVER_CONFIG, features);
            const naviUrl = utils.getUrlMatchProtocol(features.im.navi_urls);
            if (!naviUrl) {
                console.error('导航获取失败！');
                return;
            }
            // 缓存导航地址
            appCache.set(APP_CACHE.NAVI_URL, naviUrl);
            config.sdk.navi = naviUrl;

            const fileDomain = utils.getUrlMatchProtocol(features.media.upload_urls);
            if (!fileDomain) {
                console.error('文件上传服务器获取失败！');
                return;
            }

            const downloadDomain = utils.getUrlMatchProtocol(features.media.download_urls);
            if (!downloadDomain) {
                console.error('文件下载服务器获取失败！');
                return;
            }
            config.download.domain = downloadDomain;

            const uploadType = features.media.type;
            config.upload.file.domain = fileDomain;
            config.upload.type = RongIM.dataModel.File.getFileType(uploadType);
            if (uploadType === 0) {
                // 七牛
                config.upload.base64.domain = `${fileDomain}/putb64/-1`;
            } else {
                config.upload.base64.domain = `${fileDomain}/upload/base64`;
            }
            // server 端下发文件大小设置
            config.upload.file.fileSize = features.media.max_file_size * 1024 * 1024;
            const appkey = getAppKey();
            cache.setKeyNS(appkey);
            fixCache(appkey);

            const userSetting = cache.get('locale');
            let locale = userSetting || config.locale;
            if (!locale) {
                // zh-CN --> zh;
                let systemLocale = system.locale.split('-')[0];
                systemLocale = systemLocale.toLowerCase();
                locale = systemLocale;

                const supportList = [];
                $.each(languageConf, (key) => {
                    supportList.push(key);
                });
                const notSupport = supportList.indexOf(locale) === -1;
                if (notSupport) {
                    locale = supportList[0];
                    utils.console.log('不支持语言：', locale);
                }
            }
            // 仅支持 zh, en 其他语言会导致程序错误
            if (locale !== 'zh') {
                locale = 'en';
            }
            config.locale = locale;
            system.setLanguage(config.locale);
            RongIMLib.RongIMEmoji.setConfig({ lang: locale });
            document.title = config.product.name[locale];
            config.product.productName = config.product.name[config.locale];

            if (typeof cache.get('permanentNot') === 'undefined') {
                cache.set('permanentNot', true);
            }

            init(el, config);
        });
    };

    function setStatus(status) {
        if (!RongIM.instance) {
            return;
        }
        const auth = RongIM.instance.auth;
        if (utils.isEmpty(auth)) {
            return;
        }
        const userApi = RongIM.dataModel.User;
        userApi.setStatus(status);
    }

    function updatePassword(user) {
        if (utils.isEmpty(user)) {
            return;
        }
        const serverConfig = appCache.get(APP_CACHE.SERVER_CONFIG);
        const isForcedChangePassword = serverConfig.password.default_password_security_level === 0;
        if (user.isModifyPwd && isForcedChangePassword) {
            dialog.setPassword();
        }
    }

    window.onbeforeunload = () => {
        setStatus('offline');
    };

    function naviRequestParams(auth) {
        return {
            appkey: getAppKey(),
            userId: auth.id,
            token: auth.token,
            url: `${getNaviURL()}/navi.json`,
            version: config.sdkVersion,
        };
    }
}
