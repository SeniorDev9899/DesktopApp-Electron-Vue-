/* eslint-disable no-param-reassign */

/* eslint-disable no-underscore-dangle */
/* eslint-disable func-names */
export default (RongIM) => {
    const Http = RongIM.dataModel._Http;
    const utils = RongIM.utils;

    const Device = {};
    Device.unlock = function (callback) {
        let platform = utils.getPlatform();
        if (platform === 'web') {
            platform = 1;
        } else {
            platform = 2;
        }
        Http.post('/user/multi_client/unlock_request', {
            platform: 2,
        }).done((result) => {
            callback(null, result);
        }).fail(callback);
    };

    RongIM.dataModel.Device = Device;
};
