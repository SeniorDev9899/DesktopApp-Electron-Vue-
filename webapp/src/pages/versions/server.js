/* eslint-disable no-param-reassign */
export default function (RongAppversion) {
    const utils = RongAppversion.utils;
    const platformsArr = {
        Windows: 'windows',
        macOS: 'macos',
    };

    function getPlatform() {
        const platform = utils.getPlatform();
        if (platform === 'web') {
            const isMac = /macintosh|mac os x/i.test(navigator.userAgent);
            return isMac ? 'macOS' : 'Windows';
        }
        return {
            windows: 'Windows',
            OSX: 'macOS',
        }[platform];
    }

    function getFullUrl(url) {
        return RongAppversion.config.server + url;
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
        getAppVersions(callback) {
            const platform = getPlatform();
            const url = `/appversion/all?platforms=${platform}`;
            ajax({
                url,
            }, (errorCode, result) => {
                if (errorCode) {
                    callback(errorCode);
                    return;
                }
                const list = result[platformsArr[platform]] || [];
                callback(null, list);
            });
        },
    };

    RongAppversion.serverApi = server;
}
