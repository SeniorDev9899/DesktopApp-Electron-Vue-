/* eslint-disable no-param-reassign */

/* eslint-disable no-underscore-dangle */
/* eslint-disable func-names */
/* 群公告 */
export default (RongIM) => {
    const Http = RongIM.dataModel._Http;

    let userApi = null;

    const GroupNotice = {};

    GroupNotice.loadApi = function () {
        userApi = RongIM.dataModel.User;
    };

    GroupNotice.registerMessage = function () {
    // 群公告
        const messageName = 'GroupNoticeNotifyMessage';
        const objectName = 'RCE:GrpNoticeNtfy';
        const messageTag = new RongIMLib.MessageTag(true, true);
        const properties = ['action', 'mentionedInfo', 'content', 'targetGroup', 'operatorUser'];
        const searchProp = ['content'];
        RongIMClient.registerMessageType(messageName, objectName, messageTag, properties, searchProp);
    };

    GroupNotice.get = function (params, callback) {
        const groupId = params.id;
        const url = `/groups/${groupId}/notice`;
        Http.get(url).done((notice) => {
            userApi.get(notice.creator_id, (error, user) => {
                user = user || {};
                notice.user = user;
                callback(error, notice);
            });
        }).fail(callback);
    };

    /*
    params.content
    params.id
*/
    GroupNotice.publish = function (params, callback) {
        const groupId = params.id;
        const url = `/groups/${groupId}/notice/publish`;
        Http.post(url, params)
            .then((result) => {
                callback(null, result);
            }).fail(callback);
    };

    GroupNotice.remove = function (params, callback) {
        const id = params.id;
        const url = `/groups/${id}/notice/delete`;
        Http.post(url, params)
            .then((result) => {
                callback(null, result);
            }).fail(callback);
    };

    RongIM.dataModel.GroupNotice = GroupNotice;
};
