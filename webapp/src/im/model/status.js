import { getAppKey } from '../cache/helper';

/* eslint-disable no-param-reassign */
/* eslint-disable no-underscore-dangle */
export default (RongIM) => {
    const Cache = RongIM.dataModel._Cache;
    const ObserverList = RongIM.dataModel._ObserverList;
    const getLibErrorCode = RongIM.dataModel.util.getLibErrorCode;

    const Status = {
        observerList: new ObserverList(),
    };

    const statusObserver = Status.observerList;

    /**
     * 连接 IM Token 失效的回调监听，包含主动调用 connect 及 C++ 断线重连时的状态码抛出
     * 单独监听是因 SDK 只在 connect 方法中可传参用于监听 TokenIncorret 状态的回调方法，
     * 但该回调方法会在连接状态变化时也被调用
     * 为了确保调用栈信息统一且不会出现非计划的回调，故业务层封装处理
     */
    function onTokenIncorrectListeners() {
        // 派发变更
        Status.observerList.notify(31004);
    }

    Status.connect = function connect(result, token, deviceId, callback) {
        callback = callback || $.noop;
        // if (deviceId) {
        //     const instance = RongIMClient.getInstance();
        //     instance.setDeviceInfo({ id: deviceId });
        // }
        RongIM.system.appLogger('info', 'RongIMClient start to connect!');
        // 记录 IM Token 失效回调
        onTokenIncorrectListeners.whileconnect = callback;
        RongIMClient.connect(token, {
            onSuccess(userId) {
                // 清理本次调用上下文中的回调，避免重复回调
                delete onTokenIncorrectListeners.whileconnect;
                RongIM.system.appLogger('info', 'RongIMClient connect succeed!');
                callback(null, userId);
            },
            onTokenIncorrect() {
                // 正常 connect 调用时回调
                if (onTokenIncorrectListeners.whileconnect) {
                    RongIM.system.appLogger('error', 'RongIMClient connect failed!\nerrorCode: invalid-token');
                    onTokenIncorrectListeners.whileconnect('invalid-token');
                    delete onTokenIncorrectListeners.whileconnect;
                    return;
                }
                // C++ 重连时派发 status 变更
                onTokenIncorrectListeners('invalid-token');
            },
            onError(error) {
                // 清理本次调用上下文中的回调，避免重复回调
                delete onTokenIncorrectListeners.whileconnect;
                RongIM.system.appLogger('error', `RongIMClient connect failed!\nerrorCode: ${error}`);
                callback(error);
            },
        }, Cache.auth.id, result);
    };

    Status.reconnect = function reconnect(callback) {
        callback = callback || $.noop;
        RongIM.system.appLogger('info', 'RongIMClient start to reconnect!');
        RongIMClient.reconnect({
            onSuccess() {
                RongIM.system.appLogger('info', 'RongIMClient reconnect succeed!');
                // 重连成功
                callback(null);
            },
            onError(errorCode) {
                RongIM.system.appLogger('warn', `RongIMClient reconnect failed!\nerrorCode: ${errorCode}`);
                // 重连失败
                callback(getLibErrorCode(errorCode));
            },
        });
    };

    Status.disconnect = function disconnect() {
        RongIMClient.getInstance().clearCache();
        RongIMClient.getInstance().logout();
        // 日志记录调用栈
        RongIM.system.appLogger('info', 'RongIMClient logout!');
    };

    Status.watch = function watch(listener) {
        statusObserver.add(listener);
    };

    Status.unwatch = function unwatch(listener) {
        statusObserver.remove(listener);
    };

    Status.getCurrentConnectionStatus = function getCurrentConnectionStatus() {
        const instance = RongIMClient.getInstance();
        return instance.getCurrentConnectionStatus();
    };

    Status.initRongIMClient = function initRongIMClient(config, cache) {
        // if (config.appBasePath) {
        //     config.sdk.dbPath = config.appBasePath;
        //     console.warn(`dbPath => ${config.sdk.dbPath}`);
        // }
        RongIMClient.init(getAppKey(), null, { ...config.sdk, checkCA: false });
        RongIMClient.setConnectionStatusListener({
            onChanged(status) {
                if (status === 0) {
                    cache.cleanMessageQueue();
                }
                console.info('stauts- 排查应用偶现断网问题。。勿删', status);
                RongIM.system.appLogger('info', `RongIMClient conenction status changed: ${status}`);
                Status.observerList.notify(status);
            },
        });
    };
    RongIM.dataModel.Status = Status;
};
