/* eslint-disable no-param-reassign */

/* eslint-disable no-underscore-dangle */
/* eslint-disable func-names */
/* 星标联系人 */
export default (RongIM) => {
    const Http = RongIM.dataModel._Http;
    const Cache = RongIM.dataModel._Cache;
    const ObserverList = RongIM.dataModel._ObserverList;
    const request = RongIM.dataModel._request;

    const userApi = RongIM.dataModel.User;

    const Star = {
        observerList: new ObserverList(),
    };
    const starObserverList = Star.observerList;

    Cache.starList = [];
    Star.cleanCache = function () {
        Cache.starList = [];
    };

    Star.getList = function (callback) {
        callback = callback || $.noop;
        Http.get('/userrelation/starcontacts', (errorCode, result) => {
            if (errorCode) {
                callback(errorCode);
                return;
            }
            const idList = result.data.map(item => item.id).filter(id => id !== Cache.auth.id);
            // 同步本地缓存信息
            Cache.starList = idList;
            // getUsers(idList, callback);
            userApi.getBatch(idList, callback);
        });
    };

    Star.star = function (targetId, callback) {
        callback = callback || $.noop;
        Http.post('/userrelation/starcontacts', {
            ids: [targetId],
        }, (errorCode) => {
            if (errorCode) {
                callback(errorCode);
                return;
            }
            callback();
            const index = Cache.starList.indexOf(targetId);
            if (index < 0) {
                Cache.starList.push(targetId);
            }
            starObserverList.notify();
        });
    };

    Star.unstar = function (targetId, callback) {
        callback = callback || $.noop;
        Http.del('/userrelation/starcontacts', {
            ids: [targetId],
        }, (errorCode) => {
            if (errorCode) {
                callback(errorCode);
                return;
            }
            callback();
            const index = Cache.starList.indexOf(targetId);
            if (index >= 0) {
                Cache.starList.splice(index, 1);
            }
            starObserverList.notify();
        });
    };

    Star.watch = function (listener) {
        starObserverList.add(listener);
    };

    Star.unwatch = function (listener) {
        starObserverList.remove(listener);
    };

    Star.getStarList = function () {
        function callback(result) {
            return result.data.map(user => user.id);
        }

        return request('/userrelation/starcontacts', 'GET').then(callback);
    };

    RongIM.dataModel.Star = Star;
};
