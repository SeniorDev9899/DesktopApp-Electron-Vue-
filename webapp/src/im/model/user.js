/* eslint-disable no-param-reassign */
/* eslint-disable func-names */
/* eslint-disable no-underscore-dangle */

import client from '../client';

export default (RongIM) => {
    const Http = RongIM.dataModel._Http;
    const Cache = RongIM.dataModel._Cache;
    const ObserverList = RongIM.dataModel._ObserverList;
    const request = RongIM.dataModel._request;
    const store = RongIM.utils.cache;
    let config = RongIM.dataModel.config;

    let utils = RongIM.utils;
    const common = RongIM.common;

    let conversationApi = RongIM.dataModel.Conversation;
    let fileApi = RongIM.dataModel.File;
    let friendApi = RongIM.dataModel.Friend;

    const User = {
        observerList: new ObserverList(),
    };

    const userObserverList = User.observerList;

    Cache.user = {
        _defer: {},
    };
    Cache.alias = {};

    User.cleanCache = function () {
        Cache.user = {
            _defer: {},
        };
        Cache.alias = {};
    };

    User.loadApi = function () {
        const dataModel = RongIM.dataModel;
        conversationApi = dataModel.Conversation;
        fileApi = dataModel.File;
        friendApi = dataModel.Friend;
        config = dataModel.config;
        utils = RongIM.utils;
    };

    function requestLogin(params, isSecurity, callback) {
        callback = callback || $.noop;
        const data = {
            username: params.phone || params.ldapAccount,
            password: params.password || params.ldapPassword,
            agent: params.agent,
            status: params.status,
            isRememberMe: params.isRememberMe,
        };
        let url = '';
        if (isSecurity) {
        // 加密算法的密码
            data.password = common.encryptPassword(data.password);
            url = '/user/security_login';
        } else {
            url = '/user/login';
        }

        const deviceInfo = getDeviceInfo();
        data.device_info = deviceInfo;
        // 设备信息
        Http.post(url, data, (errorCode, result) => {
            if (errorCode) {
                callback(errorCode, result);
                return;
            }
            const staff = result.staff;
            staff.deptId = staff.departId;
            staff.deptName = staff.departName;
            Cache.auth = {
                token: result.token,
                id: staff.id,
                deptId: staff.deptId,
                companyId: staff.companyId,
                orgsInfo: staff.orgsInfo,
            };
            store.set('loginInfo', {
                phone: staff.mobile,
                password: utils.compileStr(params.password),
                timestamp: (new Date()).getTime(),
                isRememberMe: params.isRememberMe,
            });
            resetDeviceState();
            callback(errorCode, result);
        });
    }

    User.securityLogin = function (params, callback) {
        requestLogin(params, true, callback);
    };

    User.login = function (params, callback) {
        requestLogin(params, false, callback);
    };

    // 自动登录
    User.autoLogin = function (params, callback) {
        callback = callback || $.noop;
        const data = {
            username: params.phone,
            password: params.password,
            agent: params.agent,
            status: params.status,
            isRememberMe: params.isRememberMe,
        };
        const deviceInfo = getDeviceInfo();
        data.device_info = deviceInfo;
        // 设备信息
        const url = '/user/login_refresh';
        Http.post(url, data, (errorCode, result) => {
            if (errorCode) {
                callback(errorCode, result);
                return;
            }
            const staff = result.staff;
            staff.deptId = staff.depart_id;
            staff.deptName = staff.depart_name;
            Cache.auth = {
                token: result.token,
                id: staff.id,
                deptId: staff.deptId,
                companyId: staff.company_id,
                orgsInfo: staff.orgs_info,
            };
            store.set('loginInfo', {
                phone: staff.mobile,
                password: utils.compileStr(params.password),
                timestamp: (new Date()).getTime(),
                isRememberMe: params.isRememberMe,
            });
            resetDeviceState();
            callback(errorCode, result);
        });
    };

    // 获取登录时传给后台的设备信息
    function getDeviceInfo() {
        return {
            app_version: config.product.version,
            app_language: getLanguage(),
            timezone: getTimeZone(),
            network: 'WIFI',
        };
    }

    function getLanguage() {
        const localeList = {
            zh: 'zh-CN',
            en: 'en-US',
        };
        const locale = store.get('locale');
        return localeList[locale];
    }

    function getTimeZone() {
        const timeNum = (new Date().getTimezoneOffset() / 60);
        let timeStr = 'UTC-';
        if (timeNum < 0) {
            timeStr = 'UTC+';
        }
        timeStr += timeNum > 9 ? timeNum : `0${Math.abs(timeNum)}`;
        timeStr += ':00';
        return timeStr;
    }

    function resetDeviceState() {
        const url = '/usetting/multiclient/pc_lock_screen';
        Http.put(url, { value: false }).done(() => {});
    }

    User.logout = function () {
        Cache.clean();
        User.setStatus('offline');
        fileApi.downloadManage.abortAll();
        fileApi.uploadManage.abortAll();
        Http.post('/user/logout');
        RongIM.system.appLogger('info', '退出登录');
    };

    // 39331- 【在线状态】对方账号在线，聊天窗口显示对方为离线
    // If KICKED_OFFLINE_BY_OTHER_CLIENT, don't send offline reqest to the server
    User.logoutByKicked = function () {
        Cache.clean();
        fileApi.downloadManage.abortAll();
        fileApi.uploadManage.abortAll();
    };

    User.refreshToken = function (callback) {
        Http.post('/user/refresh_token', callback);
    };

    User.securityChangePassword = function (params, callback) {
        const data = {
            old_password: common.encryptPassword(params.oldPassword),
            new_password: common.encryptPassword(params.newPassword),
        };
        Http.post('/user/security_change_password', data, callback);
    };

    User.changePassword = function (params, callback) {
        const data = {
            old_password: params.oldPassword,
            new_password: params.newPassword,
        };
        Http.post('/user/change_password', data, callback);
    };

    User.sendCode = function (type, params, callback) {
    // type: 'resetpwd' or 'register'
        const url = utils.templateFormat('/user/{{0}}/send_code/{{1}}', type, params.phone);
        Http.post(url, callback);
    };

    User.checkCode = function (params, callback) {
        const url = utils.templateFormat('/user/verify_code/{{0}}/{{1}}', params.phone, params.code);
        Http.post(url, callback);
    };

    User.securityRegister = function (params, callback) {
        const data = {
            name: params.name,
            zip: params.zip,
            tel: params.tel,
            verify_token: params.verifyToken,
            password: common.encryptPassword(params.password),
        };
        const url = '/user/security_register';
        Http.post(url, data, callback);
    };

    // http://gitlab.rongcloud.net/RCE/RCE-Doc/blob/master/docs/design/subsystem/contact_service.md
    User.register = function (params, callback) {
        const data = {
            name: params.name,
            zip: params.zip,
            tel: params.tel,
            verify_token: params.verifyToken,
            password: params.password,
        };
        const url = '/user/register';
        Http.post(url, data, callback);
    };

    User.securityResetPassword = function (params, callback) {
        const data = {
            user_name: params.phone,
            new_password: common.encryptPassword(params.password),
            verify_token: params.verifyToken,
        };
        Http.post('/user/security_reset_password', data, callback);
    };

    User.resetPassword = function (params, callback) {
        const data = {
            user_name: params.phone,
            new_password: params.password,
            verify_token: params.verifyToken,
        };
        Http.post('/user/reset_password', data, callback);
    };

    User.setAlias = function (targetId, alias, callback) {
        const data = {
            alias,
        };
        Http.put(`/userrelation/alias/${targetId}`, data).done((result) => {
            Cache.alias[targetId] = alias;
            User.get(targetId, (errorCode, user) => {
                if (errorCode) {
                    return;
                }
                userObserverList.notify(user);
                callback(null, result);
            });
            const friend = Cache.friendList.filter(item => item.id === targetId);
            if (friend.length !== 0) {
                if (friendApi) friendApi.notifyFriend();
            }
            conversationApi.getList((errorCode, list) => {
                if (errorCode) {
                    return;
                }
                conversationApi.observerList.notify(list);
            });
        }).fail(callback);
    };

    User.setAvatar = function (src, bigSrc, callback) {
        const data = {
            portrait_url: src,
            portrait_big_url: bigSrc,
        };
        Http.put('/user/portrait', data).done(() => {
            callback();
            const auth = RongIM.instance.auth;
            if (auth) {
                const user = Cache.user[auth.id] || auth;
                user.avatar = src;
                user.portrait_big_url = bigSrc;
                userObserverList.notify(user);
            }
        }).fail(callback);
    };

    User.getBatch = function (idsList, callback) {
        callback = callback || $.noop;
        getUsers(idsList, (errorCode, list) => {
            if (errorCode) {
                callback(errorCode);
                return;
            }
            callback(null, list);
        });
    };

    User.get = function (id, callback) {
        callback = callback || $.noop;
        let idList = [];
        idList = idList.concat(id);
        getUsers(idList, (errorCode, list) => {
            if (errorCode) {
                callback(errorCode);
                return;
            }
            let result = list;
            if (!$.isArray(id)) {
                result = list[0];
            }
            callback(null, result);
        });
    };

    User.searchByMobile = function (keyword, callback) {
        callback = callback || $.noop;
        const deferred = $.Deferred();
        Http.post('/staffs/search/mobile', {
            keywords: [keyword],
            partial_match: true,
        }).done((result) => {
            result.forEach((item) => {
                item.userType = item.user_type;
                item.isExecutive = item.is_executive;
                item.avatar = item.portrait_url;
            });
            callback(null, result);
            deferred.resolve(result);
        }).fail((errorCode) => {
            callback(errorCode);
            deferred.reject(errorCode);
        });
        return deferred.promise();
    };

    User.searchByEmail = function (keyword, callback) {
        callback = callback || $.noop;
        const deferred = $.Deferred();
        Http.post('/staffs/search/email', {
            keywords: [keyword],
        }).done((result) => {
            result.forEach((item) => {
                item.userType = item.user_type;
                item.isExecutive = item.is_executive;
                item.avatar = item.portrait_url;
            });
            callback(null, result);
            deferred.resolve(result);
        }).fail((errorCode) => {
            callback(errorCode);
            deferred.reject(errorCode);
        });
        return deferred.promise();
    };

    User.searchByDuty = function (dutyName, callback) {
        const url = `/staffs?duty_name=${encodeURIComponent(dutyName)}`;
        callback = callback || $.noop;
        return Http.get(url).done((result) => {
            if (result.data && result.data.length > 0) {
                result.data.forEach((item) => {
                    item.userType = item.user_type;
                    item.isExecutive = item.is_executive;
                    item.avatar = item.portrait_url;
                });
            }
            callback(null, result);
        }).fail(callback);
    };

    User.updateMajorCompany = function (companyId, callback) {
        const auth = RongIM.instance.auth;
        if (utils.isEmpty(auth)) {
            return callback('nologin');
        }
        const authId = auth.id;
        return Http.put(`/staffs/${authId}`, {
            company_id: companyId,
        }).done((result) => {
            const user = Cache.user[authId];
            if (user) {
                user.companyId = companyId;
                user.detail = null;
            }
            callback(null, result);
        }).fail(callback);
    };

    User.getUsers = getUsers;

    function getUsers(idList, callback) {
    /**
     * 实现过程
     * 1. 从`Cache.user` 匹配, 未找到的从服务器批量获取。
     * 2. 从`Cache.alias`里补充字段`alias`
     * 3. 从`Cache.orgTree`里补充字段`path`（所在部门的路径：由`deptId`构成，用逗号分隔）
     * 4. 从`Cache.starList`里补充字段`star`
     * 5. 从`Cache.friendList`里补充字段`isFriend`
     */

        callback = callback || $.noop;

        idList = idList || [];
        const invalidIdList = [];

        // 排除重复 id 检查传入参数 为 null、 undefined、空字符串输出错误信息
        idList.forEach((id) => {
            const unexist = invalidIdList.indexOf(id) === -1;
            if (!utils.isEmpty(id) && unexist) {
                invalidIdList.push(id);
            }
        });

        if (invalidIdList.length > 0) {
        // utils.console.error('getUsers parameter contains invalid userId', idList);
        }

        const len = idList.length;

        const deferred = $.Deferred();

        if (len === 0) {
            callback(null, []);
            deferred.resolve([]);
            return deferred.promise();
        }

        const fetchUsers = function (idArr) {
            const userMap = {};
            const userPromiseList = [];
            const notCacheDeferList = [];

            for (let j = idArr.length - 1; j >= 0; j -= 1) {
                const userId = idArr[j];
                let user = Cache.user[userId];
                if (friendApi.isFileHelper(userId)) {
                    user = friendApi.getFileHelper();
                }
                const userPromise = Cache.user._defer[userId];
                if (!$.isEmptyObject(user)) {
                    user = compositeUser(user);
                    userMap[user.id] = user;
                } else if (!$.isEmptyObject(userPromise)) {
                    userPromiseList.push({
                        id: userId,
                        promise: userPromise,
                    });
                } else {
                    const defer = $.Deferred();
                    notCacheDeferList.push({
                        id: userId,
                        defer,
                    });
                    const promise = defer.promise();
                    Cache.user._defer[userId] = promise;
                    userPromiseList.push({
                        id: userId,
                        promise,
                    });
                }
            }

            if (notCacheDeferList.length !== 0) {
                const notCacheIdList = notCacheDeferList.map(item => item.id);
                const data = {
                    ids: notCacheIdList,
                };
                Http.post('/staffs/batch?withOrgs=1', data).done((result) => {
                    result.data.forEach((item) => {
                        const userInfo = {
                            id: item.id,
                            name: item.name,
                            avatar: item.portrait_url,
                            deptId: item.depart_id,
                            dutyName: item.duty_name,
                            state: item.state,
                            isExecutive: item.is_executive,
                            type: item.user_type,
                            companyId: item.company_id,
                            orgsInfo: item.orgs_info,
                            portrait_big_url: item.portrait_big_url,
                            mobile: item.mobile,
                        };
                        Cache.user[item.id] = userInfo;
                    });
                    for (let i = notCacheDeferList.length - 1; i >= 0; i -= 1) {
                        const deferObj = notCacheDeferList[i];
                        const userId = deferObj.id;
                        let userCache = Cache.user[userId];
                        if (!userCache) {
                            utils.console.warn('getUsers 用户信息未获取到：', userId);
                            userCache = {
                                id: userId,
                                name: userId,
                            };
                            // Cache.user[userId] = userCache;
                        }
                        deferObj.defer.resolve(userCache);
                    }
                }).fail((errorCode) => {
                    for (let i = notCacheDeferList.length - 1; i >= 0; i -= 1) {
                        const deferObj = notCacheDeferList[i];
                        deferObj.defer.reject(errorCode);
                    }
                });
            }

            if (userPromiseList.length === 0) {
                const userList = getUserList(idArr, userMap);
                callback(null, userList);
                deferred.resolve(userList);
                return;
            }

            const promiseList = userPromiseList.map(item => item.promise);
            $.when.apply(null, promiseList).done((...args) => {
                for (let i = args.length - 1; i >= 0; i -= 1) {
                    let userInfo = args[i];
                    if (!userInfo) {
                        utils.console.log(userPromiseList);
                    }
                    userInfo = compositeUser(userInfo);
                    userMap[userInfo.id] = userInfo;
                }
                const userArr = getUserList(idArr, userMap);
                callback(null, userArr);
                deferred.resolve(userArr);
            }).fail((errorCode) => {
                deferred.reject(errorCode);
                callback(errorCode);
            }).always(() => {
                userPromiseList.forEach((item) => {
                    delete Cache.user._defer[item.id];
                });
            });
        };

        fetchUsers(invalidIdList);

        return deferred.promise();
    }

    User.getDetail = function (id, callback) {
        callback = callback || $.noop;
        Http.get(`/staffs/${id}`).done((result) => {
            const cacheuser = Cache.user[id];
            if (cacheuser) {
                cacheuser.isExecutive = result.isExecutive;
            }
            const userInfo = {
                id: result.id,
                name: result.name,
                avatar: result.portrait_url,
                portrait_big_url: result.portrait_big_url,
                deptId: result.depart_id,
                state: result.state,
                companyId: result.company_id,
                isExecutive: result.is_executive,
                type: result.user_type,
                staff_no: result.staff_no,
                orgsInfo: result.orgs_info,
            };
            if (cacheuser) {
                $.extend(cacheuser, userInfo);
            }
            getUsers([id], (errorCode, list) => {
                if (errorCode) {
                    callback(errorCode);
                    return;
                }
                const user = list[0];
                // 删除用户详情 防止循环引用
                user.detail = null;
                if (user.userType === common.UserType.VISITOR) {
                    callback(null, user);
                    return;
                }
                const detail = $.extend(result, user);
                if (cacheuser) {
                    cacheuser.detail = detail;
                }
                callback(null, detail);
            });
        }).fail(callback);
    };

    User.getVisitors = function (id, callback) {
        callback = callback || $.noop;
        const cacheuser = Cache.user[id];
        if (cacheuser) {
            callback(null, cacheuser);
            // console.log('=========getVisitors from Cache=========',id)
            return;
        }
        // console.log('=========getVisitors from http=========',id)
        Http.get(`/user/${id}`).done((result) => {
            const cacheuser = Cache.user[id];
            if (cacheuser) {
                cacheuser.isExecutive = result.isExecutive;
            }
            const userInfo = {
                id: result.id,
                name: result.name,
                avatar: result.portrait_url,
                portrait_big_url: result.portrait_big_url,
                deptId: result.depart_id,
                state: result.state,
                companyId: result.company_id,
                isExecutive: result.is_executive,
                type: result.user_type,
                staff_no: result.staff_no,
                orgsInfo: result.orgs_info,
                mobile: result.mobile,
            };
            if (cacheuser) {
                $.extend(cacheuser, userInfo);
            }
            getUsers([id], (errorCode, list) => {
                if (errorCode) {
                    callback(errorCode);
                    return;
                }
                const user = list[0];
                // 删除用户详情 防止循环引用
                user.detail = null;
                if (user.userType === common.UserType.VISITOR) {
                    callback(null, user);
                    return;
                }
                const detail = $.extend(result, user);
                if (cacheuser) {
                    cacheuser.detail = detail;
                }
                callback(null, detail);
            });
        }).fail(callback);
    };
    User.getAvatarToken = function (callback) {
        Http.get('/user/get_image_token', callback);
    };

    const subscribeTitle = ['Login_Status_PC', 'Login_Status_Mobile', 'Login_Status_Web'];

    /**
 * @params.userIds
 * @params.duration
 */
    User.subscribe = function (userId, duration, callback) {
        callback = callback || $.noop;
        Http.post('/presence/subscribe', {
            type: 0,
            target_ids: [userId],
            titles: subscribeTitle,
            duration,
            fetch_data: true,
        }).done((result) => {
            callback(null, result);
            User.get(userId, (errorCode, user) => {
                if (errorCode) {
                    callback(errorCode);
                    return;
                }
                user.onlineStatus = {};
                result.datas.forEach((item) => {
                    user.onlineStatus[item.title] = item;
                });
                userObserverList.notify(user);
            });
        }).fail(callback);
    };

    // params.userIds
    User.unsubscribe = function (userId, callback) {
        callback = callback || $.noop;
        Http.post('/presence/unsubscribe', {
            type: 0,
            target_ids: [userId],
            titles: subscribeTitle,
        }).done((result) => {
            callback(null, result);
        }).fail(callback);
    };

    User.setStatus = function (status, callback) {
        callback = callback || $.noop;
        const title = client.userStatusTitle;
        Http.put('/presence/publish', {
            title,
            value: status,
            persist: true,
        }).done((result) => {
            callback(null, result);
        }).fail(callback);
    };

    User.getAlias = function () {
        return Cache.alias;
    };

    User.watch = function (listener) {
        userObserverList.add(listener);
    };

    User.unwatch = function (listener) {
        userObserverList.remove(listener);
    };

    User.executiveLimit = function (user) {
        const isFriend = Cache.friendList.some(friend => friend.id === user.id);
        if (isFriend || RongIM.instance.auth.isExecutive) {
            return false;
        }
        const isExecutive = !!user.isExecutive;
        return isExecutive;
    };

    function compositeUser(user) {
        user.alias = Cache.alias[user.id];
        user.star = Cache.starList.indexOf(user.id) !== -1;
        const friend = friendApi.getCacheFriend(user.id);
        user.isFriend = !!friend;
        user.bothFriend = (friend || {}).bothFriend;
        return user;
    }

    function getUserList(idList, userMap) {
        return idList.map(id => userMap[id]);
    }

    User.qrcodeLogin = function login(ele, callback) {
        callback = callback || $.noop;
        let timeout = false;
        if (login.timer) clearTimeout(login.timer);

        getQRCodeToken()
            .then(render)
            .then(polling)
            .then(qrcodeLogin)
            .then((result) => {
                callback(null, result);
            })
            .fail(callback);

        function render(result) {
            login.timer = setTimeout(() => {
                timeout = true;
            }, result.timeout);

            const token = result.token;
            qrcodeRender(ele, token);
            return token;
        }

        function polling(token) {
            return qrcodePolling(ele, token).then(result => ({
                token,
                ticket: result.ticket,
            }));
        }

        function qrcodePolling(el, token) {
            const url = utils.templateFormat('/user/qrcode/login/polling/{{0}}', token);
            // var POLLING = 0;
            // var VERIFIED = 1;
            const LOGINED = 2;
            const wait = 1000;
            const defer = $.Deferred();

            function loop(node) {
                Http.get(url).then((result) => {
                    if (result.state === LOGINED) {
                        defer.resolve(result);
                        return;
                    }
                    const isInPage = document.body.contains(node);
                    if (timeout) {
                        defer.reject(common.ErrorCode.INVALID_TOKEN);
                    } else if (isInPage) {
                        login.timer = setTimeout(() => {
                            loop(node);
                        }, wait);
                    }
                }).fail((errorCode) => {
                    if (errorCode === common.ErrorCode.QR_INVALID_TOKEN) {
                        login(node, callback);
                        return;
                    }
                    defer.reject(errorCode);
                });
            }

            loop(el);
            return defer.promise();
        }
    };

    function getQRCodeToken() {
        const params = {
            agent: {
                platform: utils.getPlatform(),
                device_id: common.getDeviceId(),
            },
        };
        return Http.post('/user/qrcode/login/create', params);
    }

    function qrcodeRender(node, token) {
        const platform = utils.getPlatform();
        const text = utils.templateFormat('RCE_LOGIN@{{0}}@{{1}}', token, platform);
        $(node).empty();
        // eslint-disable-next-line no-new
        new QRCode(node, {
            text,
            width: 162,
            height: 162,
        });
    }

    function qrcodeLogin(params) {
    // 携带设备信息
        const deviceInfo = getDeviceInfo();
        params.device_info = deviceInfo;
        return Http.post('/user/qrcode/login', params)
            .then((result) => {
                const staff = result.staff;
                const auth = {
                    token: result.token,
                    id: staff.id,
                    companyId: staff.company_id,
                    deptId: staff.dept_id,
                    orgsInfo: staff.orgs_info,
                };
                Cache.auth = auth;
                resetDeviceState();
                return result;
            });
    }

    User.getNewestAlias = function () {
        function callback(result) {
            const alias = {};
            result.data.forEach((user) => {
                alias[user.id] = user.alias;
            });
            return alias;
        }

        return request('/userrelation/alias', 'GET').then(callback);
    };

    User.batchFromServer = function (idList, callback) {
        request('/staffs/batch', 'post', {
            ids: idList,
        }, (error, result) => {
            callback(error, result);
        }, true);
    };

    User.getNewUser = function (id, callback) {
        if (utils.isEmpty(id)) {
            callback('params error: id invalid');
            return;
        }
        delete Cache.user[id];
        getUsers([id], (errorCode, userList) => {
            if (errorCode) {
                callback(errorCode, userList);
                return;
            }
            const user = (userList || [])[0];
            callback(null, user);
        });
    };

    User.validateCanChat = function (user) {
        if (utils.isEmpty(user)) {
            return false;
        }
        let fileHelperId = user.id;
        if (typeof user === 'string') {
            fileHelperId = user;
            user = Cache.user[user] || { bothFriend: false };
        }
        if (friendApi.isFileHelper(fileHelperId)) {
            return true;
        }
        const auth = RongIM.instance.loginUser || {};
        const isVisitor = user.type === common.UserType.VISITOR;
        const selfIsVisitor = auth.type === common.UserType.VISITOR;
        if (isVisitor || selfIsVisitor) {
            return user.bothFriend;
        }
        return true;
    };
    // 修改外部用户姓名
    User.setUsername = function (targetId, name, callback) {
        const data = {
            name,
        };

        Object.keys(Cache.user).forEach((key) => {
            if (key === targetId) {
            // 更新Cache中的name
                Cache.user[key].name = name;
            }
        });
        callback();
        // TODO 根据后端接口传参
        const url = `/visitors/${targetId}/name`;

        Http.put(url, data).done((result) => {
            Cache.name[targetId] = name;
            User.get(targetId, (errorCode, user) => {
                if (errorCode) {
                    return;
                }
                userObserverList.notify(user);
                callback(null, result);
            });
            const friend = Cache.friendList.filter(item => item.id === targetId);
            if (friend.length !== 0 && friendApi) {
                friendApi.notifyFriend();
            }
            conversationApi.getList((errorCode, list) => {
                if (errorCode) {
                    return;
                }
                conversationApi.observerList.notify(list);
            });
        }).fail(callback);
    };

    User.getBatchPart = function (userIdList, callback) {
        const userMap = {};
        const noCacheIdList = [];
        userIdList.forEach((id) => {
            const user = Cache.user[id];
            if (user) {
                userMap[id] = user;
            } else {
                noCacheIdList.push(id);
            }
        });
        if (noCacheIdList.length === 0) {
            const userList = userIdList.map(id => userMap[id]);
            callback(null, userList);
            return;
        }
        Http.post('/staffs/batch', {
            ids: noCacheIdList,
        }, (errorCode, result) => {
            if (errorCode && !result.data) {
                callback(errorCode);
                return;
            }
            result.data.forEach((item) => {
                const userInfo = {
                    id: item.id,
                    name: item.name,
                    avatar: item.portrait_url,
                    deptId: item.depart_id,
                    dutyName: item.duty_name,
                    state: item.state,
                    isExecutive: item.is_executive,
                    type: item.user_type,
                    companyId: item.company_id,
                    orgsInfo: item.orgs_info,
                    portrait_big_url: item.portrait_big_url,
                    mobile: item.mobile,
                };
                compositeUser(userInfo);
                Cache.user[item.id] = userInfo;
                userMap[item.id] = userInfo;
            });
            const userList = [];
            userIdList.forEach((id) => {
                const user = userMap[id];
                if (user) {
                    userList.push(user);
                }
            });
            callback(null, userList);
        });
    };

    User.searchByUserName = function (username, callback) {
        Http.post('/user/search/username', {
            username,
        }, (errorCode, result) => {
            (result || []).forEach((item) => {
                item.userType = item.user_type;
                item.isExecutive = item.is_executive;
                item.avatar = item.portrait_url;
            });
            callback(errorCode, result);
        });
    };

    User.getFriendList = function (callback) {
        const friendList = friendApi.getCacheList();
        const friendIdList = friendList.map(item => item.id);
        getUsers(friendIdList, callback);
    };

    RongIM.dataModel.User = User;
};
