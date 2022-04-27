/* eslint-disable no-param-reassign */
/* eslint-disable no-underscore-dangle */
/* eslint-disable func-names */
export default (RongIM) => {
    const request = RongIM.dataModel._request;
    /**
     * 平台常量
     */
    const PLATFORM = Object.freeze({
        MAC_OS: 'macOS',
        WINDOWS: 'Windows',
        LINUX: 'Linux',
    });

    /**
     * 检查是否需要升级版本
     * @param {PLATFORM} platform 平台标识
     * @param {number} versionCode 版本序列号
     * @param {Function} callback 结果回调，若结果为 null，则无需升级
     */
    function check(platform, versionCode, callback) {
        request('/appversion', 'GET', { platform, version_code: versionCode }, (errorCode, data) => {
            if ((errorCode && errorCode !== 10000) || !data) {
                callback(null);
                return;
            }
            callback(data);
        });
    }

    RongIM.dataModel.versionChecker = {
        check,
        PLATFORM,
    };
};
