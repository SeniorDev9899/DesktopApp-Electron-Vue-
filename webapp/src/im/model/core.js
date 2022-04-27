/* eslint-disable no-param-reassign */
/* eslint-disable no-underscore-dangle */
import Intercepter from '../Intercepter';
import ObserverList from './core/ObserverList';

/* datamodel 的核心,其他 model 均会用到这里的接口 */
export default (RongIM) => {
    const store = RongIM.utils.cache;
    let friendApi = null;
    let starApi = null;
    let pinApi = null;

    let groupNtcApi = null;
    let orgApi = null;
    let statusApi = null;
    let groupApi = null;
    let userApi = null;
    let conversationApi = null;
    let messageApi = null;
    let fileApi = null;
    let contactApi = null;
    let publicApi = null;

    let apiList = [];
    function loadApi() {
        const dataModel = RongIM.dataModel;
        userApi = dataModel.User;
        groupApi = dataModel.Group;
        conversationApi = dataModel.Conversation;
        statusApi = dataModel.Status;
        messageApi = dataModel.Message;
        orgApi = dataModel.Organization;
        friendApi = dataModel.Friend;
        starApi = dataModel.Star;
        pinApi = dataModel.Pin;
        groupNtcApi = dataModel.GroupNotice;
        fileApi = dataModel.File;
        contactApi = dataModel.Contact;
        publicApi = dataModel.Public;

        apiList = [userApi, groupApi, conversationApi, statusApi, messageApi, orgApi];
        apiList = apiList.concat([friendApi, starApi, pinApi, groupNtcApi]);
        apiList = apiList.concat([fileApi, contactApi, publicApi]);
    }

    const config = {
        dataModel: {
            getHistoryMessagesNumber: 10,
            // getUsers 接口合并数据的个数
            requestCount: 50,
            // getUsers 等待合并数据等待时长，单位：毫秒
            waitTime: 50,
        },
    };

    $.extend(true, config, RongIM.config);

    let messageQueueInterval = 0;
    const Cache = {
        cleanMessageQueue() {
            const CONNECTED = 0;
            clearInterval(messageQueueInterval);
            messageQueueInterval = setInterval(() => {
                const params = Cache.messageQueue.shift();
                const disconnect = statusApi.getCurrentConnectionStatus() !== CONNECTED;
                if (disconnect || RongIM.utils.isEmpty(params)) {
                    clearInterval(messageQueueInterval);
                    return;
                }
                messageApi.sendCommandMessage(params);
            }, 1000 / 2);
        },
        auth: {},
        clean() {
            Cache.ready._done = false;
            Cache.auth = {};
            apiList.forEach((api) => {
                if (typeof api.cleanCache === 'function') {
                    api.cleanCache();
                }
            });
        },
    };

    const util = {
        noop() {},
        sameConversation(item, other) {
            return item.targetId === other.targetId && item.conversationType === other.conversationType;
        },
        getPrototype: Object.prototype.toString,
        isArray(arr) {
            return this.getPrototype.call(arr) === '[object Array]';
        },
        isString(str) {
            return this.getPrototype.call(str) === '[object String]';
        },
        // 此方法业务使用场景： 校验 messageUId 是否在 messageUIds 数组中，过滤单个字符 '_' 请注意。
        isInArray(node, arr) {
            return arr.join('_').indexOf(node) > -1;
        },
        /*
        重置对象的属性值, 支持单个对象，多个对象需再封装
        此方法操作对象引用，不重新创建对象
        var obj1 = { a: 1, b: 2 };
        var obj2 = reset(obj1, {a: 345});
        // obj1 => { a: 345, b: 2}
        // obj1 === obj2 => true
    */
        reset(obj, newValues) {
            const objs = [obj];
            const keys = function keys(o) {
                const tmp = [];
                $.each(o, (k) => {
                    tmp.push(k);
                });
                return tmp;
            };
            const func = function func(memo) {
                keys(newValues).forEach((key) => {
                    const memoObj = memo[0];
                    memoObj[key] = newValues[key];
                });
                return memo;
            };
            return objs.reduce(func, objs)[0];
        },
        generatorKey(keys) {
            return keys.join('_');
        },
        getStoreKey(key) {
            const userId = Cache.auth.id;
            const keys = ['rce_g', userId, key];
            return util.generatorKey(keys);
        },
        getLibErrorCode(errorCode) {
            const prefix = 'lib-';
            if (errorCode) {
                const existed = String(errorCode).indexOf(prefix) >= 0;
                if (!existed) {
                    errorCode = prefix + errorCode;
                }
            }
            return errorCode;
        },
    };

    function init(_config) {
        $.extend(true, config, _config);
        RongIM.dataModel.Status.initRongIMClient(config, Cache);

        Cache.auth = store.get('auth');
        loadApi();
        apiList.forEach((api) => {
            if (typeof api.loadApi === 'function') {
                api.loadApi();
            }
        });
        messageApi.registerMessage();
        messageApi.setMessageListener();
    }

    function updateAuth(value) {
        Cache.auth = value;
    }

    function httpRequest(method, url, data, callback) {
        callback = callback || $.noop;
        if (requireAuth(url)) {
            return Cache.ready().then(() => request(url, method, data, callback));
        }
        return request(url, method, data, callback);
    }

    const Http = {};

    Http.get = (url, data, callback) => httpRequest('GET', url, data, callback);

    Http.post = (url, data, callback) => httpRequest('POST', url, data, callback);

    Http.put = (url, data, callback) => request(url, 'PUT', data, callback);

    Http.del = (url, data, callback) => request(url, 'DELETE', data, callback);

    function requireAuth(url) {
        const whiteList = [/^\/user\//, /^\/configuration\/all/];
        const publicAccess = whiteList.filter(pattern => pattern.test(url)).length === 0;
        return publicAccess;
    }

    function ajax(url, method, data, callback) {
        if (method.toLowerCase() !== 'get') {
            data = $.isEmptyObject(data) ? null : JSON.stringify(data);
        }

        const options = {
            url: getFullURL(url),
            method,
            data,
            xhrFields: {
                withCredentials: true,
            },
            dataType: 'json',
        };

        if (method !== 'GET') {
            options.contentType = 'application/json;charset=UTF-8';
        }

        $.ajax(options).then((response) => {
            const errorCode = getErrorCode(response.code);
            if (errorCode) {
                callback(errorCode, response);
            } else {
                const result = response.result;
                callback(null, result);
            }
        }, () => {
            callback('request-failed');
        });
    }

    function getFullURL(path) {
        return config.dataModel.server + path;
    }

    function request(url, method, data, callback, fromServer) {
        callback = callback || $.noop;
        /*
    data is optional

    request(url, method, data, callback)
    request(url, method, callback)
    */
        if ($.isFunction(data)) {
            callback = data;
            data = null;
        }
        const defer = $.Deferred();
        const intercept = Intercepter.find(method, url);
        if (intercept && !fromServer) {
            const params = Intercepter.parseUrl(intercept.path, url);
            if (method.toLowerCase() === 'get') {
                $.extend(params.query, data);
            } else {
                params.data = data;
            }
            intercept.handle(params, (errorCode, result) => {
                if (errorCode) {
                    defer.reject(errorCode);
                    callback(errorCode, result);
                    return;
                }
                defer.resolve(result);
                callback(errorCode, result);
            });
            return defer.promise();
        }
        // 从 server 获取数据
        ajax(url, method, data, (errorCode, result) => {
            callback(errorCode, result);
            if (errorCode) {
                defer.reject(errorCode, result);
                return;
            }
            defer.resolve(result);
        });
        return defer.promise();
    }

    /*
    获取 server 配置
    */
    function getServerConfig(netEnvironment, callback) {
        Http.get(`/configuration/all?netEnvironment=${netEnvironment}`, (errorCode, result) => {
            if (errorCode || !result) {
                callback(errorCode || 'request_server_config_failed');
                return;
            }
            callback(null, result.features);
        });
    }

    Cache.ready = function ready(callback) {
        callback = callback || $.noop;
        if (Cache.ready._busy || Cache.ready._done) {
            return $.Deferred().resolve().promise();
        }
        Cache.ready._busy = true;
        /*
    多部门使用 getDeptTree 代替 getTree
    getAllUser 接口失效，获取高管人员列表排除高管计算全选
    */
        return $.when(
            orgApi.getOrgTree(), userApi.getNewestAlias(),
            starApi.getStarList(), friendApi.getFriendList(), orgApi.getAllCompany(),
        ).then((tree, alias, starList, friendList, companyList) => {
            friendList = friendList.map(item => ({
                id: item.id,
                name: item.name,
                avatar: item.portrait_url,
                tel: item.tel,
                user_type: item.user_type,
                bothFriend: item.is_both_friend,
                create_dt: item.create_dt,
            }));
            Cache.orgTree = tree;
            Cache.alias = alias;
            Cache.starList = starList;
            Cache.friendList = friendList;
            // User.getBatch 缓存好友用户信息
            const friendIdList = friendList.map(friend => friend.id);
            userApi.getBatch(friendIdList);
            companyList.forEach((company) => {
                if (company.state !== 2) {
                    Cache.company[company.id] = company;
                }
            });
            const users = {};
            users._defer = {};
            if (!Cache.user) {
                Cache.user = users;
            }
            Cache.ready._done = true;
            callback();
            /*
             缓存 root 级公司 在在搜索是需要判断是否有 独立子公司
            */
            orgApi.getRoot();
            orgApi.getRootCompanyMemberCount();
            return $.Deferred().resolve().promise();
        })
            .fail((error) => {
                callback(error);
                return $.Deferred().reject(error).promise();
            })
            .always(() => {
                Cache.ready._busy = false;
            });
    };

    function getErrorCode(code) {
        const SUCCESS_CODE = 10000;
        return (code === SUCCESS_CODE) ? null : code;
    }

    function getUserSetting(callback) {
        callback = callback || $.noop;
        const url = '/usetting/multiclient/pc_lock_screen';
        Http.get(url, (errorCode, result) => {
            callback(result);
        });
    }

    function getServerTime() {
        return Date.now();
        // return new Date().getTime() - RongIMClient.getInstance().getDeltaTime();
    }

    RongIM.dataModel = {
        getUserSetting,
        getServerConfig,
        init,
        updateAuth,
        _Cache: Cache,
        _Http: Http,
        _httpRequest: httpRequest,
        _ObserverList: ObserverList,
        _request: request,
        getServerTime,
        util,
        config,
    };
};
