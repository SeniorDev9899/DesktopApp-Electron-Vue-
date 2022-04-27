/* eslint-disable no-param-reassign */
/* eslint-disable no-underscore-dangle */
/* eslint-disable func-names */
/* 收藏 */
export default (RongIM) => {
    const Http = RongIM.dataModel._Http;
    const ObserverList = RongIM.dataModel._ObserverList;
    const Collect = {
        observerList: new ObserverList(),
    };
    const collectObserverList = Collect.observerList;
    const userApi = RongIM.dataModel.User;
    const conversationApi = RongIM.dataModel.Conversation;
    const groupApi = RongIM.dataModel.Group;
    Collect.add = function (params, callback) {
        Http.post('/fav', params, (errorcode, result) => {
            if (errorcode) {
                callback(errorcode);
            }
            callback(errorcode, result);
            // collectObserverList.notify();
        }, true);
    };
    Collect.remove = function (uid, callback) {
        Http.del('/fav', { ids: [uid] }, (errorcode, result) => {
            if (errorcode) {
                callback(errorcode);
            }
            callback(errorcode, result);
        });
    };
    Collect.getList = function (params, callback) {
        Http.post('/fav/all', params, (errorCode, result) => {
            if (errorCode) {
                callback(errorCode);
                return;
            }
            const list = [];
            result.fav_contents.forEach((item) => {
                const collect = {};
                const test = item.fav_content.content && JSON.parse(item.fav_content.content);
                collect.content = test;
                collect.messageType = reSetType(item.type);
                collect.messageName = reSetType(item.type);
                collect.messageUId = item.uid;
                collect.objectName = item.type;
                collect.sentTime = item.update_dt;
                collect.messageId = item.fav_content.content_id;
                collect.content_id = item.fav_content.content_id;
                collect.uid = item.uid;
                collect.targetId = item.fav_content.target_id;
                collect.sourceType = item.fav_content.source_type;
                collect.senderId = item.fav_content.sender_id;
                collect.user = {};
                if (+item.fav_content.source_type === 3) {
                    conversationApi.getOne(7, item.fav_content.sender_id, (errorcode1, result1) => {
                        if (!errorcode1) {
                            result1 = result1 || {};
                            collect.user = {
                                name: result1.user.name,
                            };
                        }
                    });
                } else if (+item.fav_content.source_type === 1) {
                    groupApi.getOne(item.fav_content.target_id, (errorcode, user) => {
                        if (!errorcode) {
                            user = user || {};
                            collect.user = {
                                name: user.name,
                            };
                        }
                    });
                } else {
                    userApi.get(item.fav_content.sender_id, (errorcode, user) => {
                        if (!errorcode) {
                            user = user || {};
                            collect.user = {
                                name: user.name,
                            };
                        }
                    });
                }
                list.push(collect);
            });
            callback(errorCode, list);
        });
    };
    Collect.getIdList = function (params, callback) {
        Http.post('/fav/ids', params, (errorCode, data) => {
            if (errorCode || data.length === 0) {
                return;
            }
            const list = [];
            data.fav_contents.forEach((item) => {
                const collect = {};
                const test = JSON.parse(item.fav_content.content);
                collect.content = test;
                collect.messageType = reSetType(item.type);
                collect.messageUId = item.uid;
                collect.objectName = item.type;
                collect.sentTime = item.update_dt;
                collect.messageId = item.fav_content.content_id;
                collect.content_id = item.fav_content.content_id;
                collect.uid = item.uid;
                collect.targetId = item.fav_content.target_id;
                collect.sourceType = item.fav_content.source_type;
                collect.senderId = item.fav_content.sender_id;
                collect.user = {};
                if (+item.fav_content.source_type === 3) {
                    conversationApi.getOne(7, item.fav_content.target_id, (errorcode, result) => {
                        if (!errorcode) {
                            result = result || {};
                            collect.user = {
                                name: result.user.name,
                            };
                        }
                    });
                } else if (+item.fav_content.source_type === 1) {
                    groupApi.getOne(item.fav_content.target_id, (errorcode, user) => {
                        if (!errorcode) {
                            user = user || {};
                            collect.user = {
                                name: user.name,
                            };
                        }
                    });
                } else {
                    userApi.get(item.fav_content.sender_id, (errorcode, user) => {
                        if (!errorcode) {
                            user = user || {};
                            collect.user = {
                                name: user.name,
                            };
                        }
                    });
                }
                list.push(collect);
            });
            callback(errorCode, list);
        });
    };
    Collect.search = function (params, callback) {
        Http.post('/fav/search', params, (errorcode, result) => {
            const ids = result.map(item => item.uid);
            callback(errorcode, ids);
        });
    };
    Collect.watch = function (listener) {
        collectObserverList.add(listener);
    };
    Collect.unwatch = function (listener) {
        collectObserverList.remove(listener);
    };
    Collect.typeList = [];
    function reSetType(type) {
        switch (type) {
        case 'RC:TxtMsg':
            type = 'TextMessage'; break;
        case 'RC:ImgMsg':
            type = 'ImageMessage'; break;
        case 'RC:VcMsg':
            type = 'VoiceMessage'; break;
        case 'RC:LBSMsg':
            type = 'LocationMessage'; break;
            /* case 'RC:ImgMsg' :
        type='SightMessage';break; */
        case 'RC:FileMsg':
            type = 'FileMessage'; break;
        case 'RC:ImgTextMsg':
            type = 'RichContentMessage'; break;
        case 'RC:SightMsg':
            type = 'SightMessage'; break;
        case 'RC:GIFMsg':
            type = RongIMLib.RongIMClient.MessageType.GIFMessage;
            break;
        default:
            break;
        }
        return type;
    }
    RongIM.dataModel.Collect = Collect;
};
