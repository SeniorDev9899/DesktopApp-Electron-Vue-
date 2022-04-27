/* eslint-disable no-param-reassign */
/* eslint-disable func-names */
/* eslint-disable no-underscore-dangle */

export default (RongIM) => {
    const Meeting = {};
    const request = RongIM.dataModel._request;

    Meeting.NEED_PASSWORD = 16006;
    Meeting.PASSWORD_ERROR = 16005;
    Meeting.MULTI_PLATFORM_JOIN_MEETING = 16009;
    Meeting.SINGLE_PLATFORM_JOIN_MEETING = 16015;

    Meeting.schedule = function (params) {
        return request('/meeting/schedule', 'post', params);
    };

    Meeting.history = function (fromIndex, size) {
        return request('/meeting/history', 'get', { from: fromIndex, size });
    };

    Meeting.delete = function (id) {
        return request(`/meeting/${id}`, 'delete');
    };

    // 立即开会
    Meeting.joinMeet = function (params) {
        return request('/meeting/join', 'post', params);
    };

    // 查指定
    Meeting.getMeetInfoById = function (id) {
        return request(`/meeting/${id}`, 'get');
    };
    // User.batchFromServer = function (idList, callback) {
    //     request('/meetings/schedule', 'post', {
    //         ids: idList,
    //     }, (error, result) => {
    //         callback(error, result);
    //     }, true);
    // };


    RongIM.dataModel.Meeting = Meeting;
};
