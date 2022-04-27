/* eslint-disable no-param-reassign */

/* eslint-disable no-underscore-dangle */
/* eslint-disable func-names */
export default (RongIM) => {
    const Http = RongIM.dataModel._Http;
    const Cache = RongIM.dataModel._Cache;

    const Public = {};

    Cache.public = {};

    Public.cleanCache = function () {
        Cache.public = {};
    };

    // 获取公众号信息
    Public.getPublicInfo = function (appId, callback) {
        Http.get(`/apps/${appId}`, (errorCode, result) => {
            if (errorCode) {
                callback(errorCode);
                return;
            }
            callback(result);
        });
    };

    Public.getPublicMenu = function (appId, callback) {
        Http.get(`/apps/${appId}/menu`, (errorCode, result) => {
            if (errorCode) {
                callback(errorCode);
                return;
            }
            callback(result);
        });
    };

    Public.search = function (name, callback) {
        Http.get(`/apps/search?name=${name}&states=${0}`, (errorCode, result) => {
            if (errorCode) {
                callback(errorCode);
                return;
            }
            result.apps = result.apps.map((item) => {
                item.avatar = item.logo_url;
                return item;
            });
            callback(null, result.apps);
        });
    };

    RongIM.dataModel.Public = Public;
};
