/* eslint-disable no-param-reassign */
export default function (RongWork) {
    function getFullUrl(url) {
        // 44421 - 【工作台】进入工作台，页面无数据
        const devServer = 'https://rce-ceshi.rongcloud.net:8443/api';

        if (RongDesktop.configInfo.DEBUG === true){
            return devServer + url;
        }else{
            return RongWork.config.server + url;
        }
    }

    const ajax = function ajax(options, callback) {
        const data = $.isEmptyObject(options.data) ? null : JSON.stringify(options.data);
        const arg = {
            url: getFullUrl(options.url),
            method: options.method,
            xhrFields: {
                withCredentials: true,
            },
            headers: {
                'Content-Type': 'application/json;charset=UTF-8',
            },
            data,
            dataType: 'json',
        };
        return $.ajax(arg).then((rep) => {
            const defer = $.Deferred();
            if (rep.code !== 10000) {
                callback(rep.code);
                defer.reject(rep.code);
            } else {
                callback(null, rep.result);
                callback.done = true;
                defer.resolve(rep.result);
            }
            return defer.promise();
        }).fail((rep) => {
            if (!callback.done) callback(rep);
        });
    };

    const server = {
        getAllApps(callback) {
            callback = callback || $.noop;
            return ajax({
                url: '/apps/list',
            }, callback);
        },
        getUnfavApps(userId, callback) {
            callback = callback || $.noop;
            return ajax({
                url: `/apps?userId=${userId}&subscribe=0`,
            }, callback);
        },
        getFavApps(userId, callback) {
            callback = callback || $.noop;
            return ajax({
                url: '/apps/subscriptions/apps?favorite=1',
            // url: '/apps?userId=' + userId + '&subscribe=1'
            }, callback);
        },
        getLikeApps(callback) {
            callback = callback || $.noop;
            return ajax({
                url: '/apps/favorites',
            }, callback);
        },
        getPublicInfo(appId, callback) {
            callback = callback || $.noop;
            return ajax({
                url: `/apps/${appId}`,
            }, callback);
        },
        addFavApp(appIdList, callback) {
            callback = callback || $.noop;
            // var userId = RongWork.instance.query.userId;
            const data = {
                apps: appIdList,
            };
            return ajax({
            // url: '/apps/' + userId + '/subscribe',
                url: '/apps/favorites/batch',
                method: 'POST',
                data,
            }, callback);
        },
        removeFavApp(appIdList, callback) {
            callback = callback || $.noop;
            // var userId = RongWork.instance.query.userId;
            const data = {
                apps: appIdList,
            };
            return ajax({
            // url: '/apps/' + userId + '/subscribe',
                url: '/apps/favorites/batch',
                method: 'DELETE',
                data,
            }, callback);
        },
        // 获取所有分类及其一下的应用列表
        getList_all(data, callback) {
            callback = callback || $.noop;
            // status 0 启用 1 未启用
            return ajax({ url: '/apps/all', method: 'POST', data }, callback);
        },
    };

    RongWork.serverApi = server;
}
