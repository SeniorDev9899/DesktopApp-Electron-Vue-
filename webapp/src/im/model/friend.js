/* eslint-disable no-param-reassign */
/* eslint-disable func-names */
/* eslint-disable no-underscore-dangle */

import localeConf from '../locale';
import { getServerConfig } from '../cache/helper';

export default (RongIM) => {
    const Http = RongIM.dataModel._Http;
    const Cache = RongIM.dataModel._Cache;
    const ObserverList = RongIM.dataModel._ObserverList;
    const utils = RongIM.utils;
    const request = RongIM.dataModel._request;

    let messageApi = null;
    let conversationApi = null;

    const Friend = {
        observerList: new ObserverList(),
    };

    const friendObserverList = Friend.observerList;

    Cache.friendList = [];
    Cache.friendRequest = [];

    Friend.cleanCache = function () {
        Cache.friendList = [];
        Cache.friendRequest = [];
    };

    Friend.loadApi = function () {
        messageApi = RongIM.dataModel.Message;
        conversationApi = RongIM.dataModel.Conversation;
    };

    Friend.registerMessage = function () {
        // 好友消息
        let messageName = 'ContactNotifyMessage';
        let objectName = 'RCE:ContactNtfy';
        let messageTag = new RongIMLib.MessageTag(false, false);
        let properties = ['actionType', 'operator', 'target', 'data'];
        RongIMClient.registerMessageType(messageName, objectName, messageTag, properties);

        // 非好友需要验证
        messageName = 'RequestFriendVerificationMessage';
        objectName = 'RCE:RFVMsg';
        messageTag = new RongIMLib.MessageTag(false, true);
        properties = ['extra'];
        RongIMClient.registerMessageType(messageName, objectName, messageTag, properties);
    };

    Friend.insertRFVMsg = function (targetId) {
        const rfvMsg = RongIM.common.buildMessage.RequestFriendVerificationMessage({});
        const arg = {
            conversationType: RongIMLib.ConversationType.PRIVATE,
            targetId,
            messageType: 'RequestFriendVerificationMessage',
            objectName: 'RCE:RFVMsg',
            sentStatus: RongIMLib.SentStatus.SENT,
            content: rfvMsg,
        };
        messageApi.insertMessage(arg);
    };

    Friend.requestFriendVerification = function (message) {
        message.messageType = message.messageType || message.content.messageName;
        messageApi.insertMessage(message);
        Friend.insertRFVMsg(message.targetId);
    };

    function acceptFriend(message) {
        const conversation = {
            conversationType: message.conversationType,
            targetId: message.targetId,
            timestamp: 0,
            position: 1,
        };
        messageApi.get(conversation, (errorCode, messageList) => {
            const addConversation = function (list, con) {
                con.latestMessage = list[list.length - 1];
                conversationApi.add(con);
            };
            addConversation(messageList, conversation);
        });
    }

    function updateUserstatus(message, action) {
        const operatorId = message.content.operator.userId;
        const operatorIsSelf = Cache.auth.id === operatorId;
        const targetId = message.targetId;
        const targetUser = Cache.user[targetId] || {};
        switch (action) {
        case 'Accept':
            addFriend(targetId);
            targetUser.isFriend = true;
            targetUser.bothFriend = true;
            break;
        case 'Delete':
            if (operatorIsSelf) {
                targetUser.isFriend = false;
                targetUser.bothFriend = false;
            } else {
                targetUser.bothFriend = false;
            }
            break;
        default:
            break;
        }
    }

    function addFriend(userId) {
        let friend = Friend.getCacheFriend(userId);
        if (friend) {
            friend.bothFriend = true;
            return;
        }
        const user = Cache.user[userId] || { id: userId };
        friend = {
            id: user.id,
            name: user.name,
            avatar: user.avatar,
            bothFriend: true,
        };
        Cache.friendList.push(friend);
    }

    Friend.messageCtrol = {
        ContactNotifyMessage(message) {
            if (message.offLineMessage) {
                return;
            }
            const actionMap = {
                1: 'Add',
                2: 'Accept',
                3: 'Reject',
                4: 'Delete',
            };
            const actionType = message.content.actionType;
            const action = actionMap[actionType];
            updateUserstatus(message, action);
            switch (action) {
            case 'Add': {
                Friend.notifyFriendRequest();
                break;
            }
            // eslint-disable-next-line no-case-declarations
            case 'Accept': {
                messageApi._push(message);
                messageApi.observerList.notify(message);
                Friend.notifyFriendRequest();
                Friend.notifyFriend();
                acceptFriend(message);
                const lconv = conversationApi.getLocalOne(message.conversationType, message.targetId);
                if (lconv) {
                    lconv.latestMessage = message;
                    const lconvList = conversationApi.getLocalList();
                    conversationApi.observerList.notify(lconvList);
                }
                break;
            }
            case 'Delete': {
                Friend.notifyFriendRequest();
                Friend.notifyFriend();
                const privateConversation = RongIMLib.ConversationType.PRIVATE;
                const friendId = message.content.target.userId;
                conversationApi.remove(privateConversation, friendId);
                break;
            }
            default:
                // TODO: ContactNotifyMessage
                // utils.console.log('TODO ContactNotifyMessage:' + action);
                break;
            }
        },
    };
    // Friend 文档地址  http://gitlab.rongcloud.net/RCE/RCE-Doc/blob/master/docs/design/subsystem/contact_service.md
    // 根据号码搜索联系人
    Friend.search = function (mobile, callback) {
        callback = callback || $.noop;
        const deferred = $.Deferred();
        const params = {
            keywords: mobile,
        };
        // 添加好友查询从 server 获取（本地无访客/员工全量数据）
        request('/user/search/mobile', 'post', params, (errorCode, result) => {
            if (errorCode) {
                callback(errorCode);
                deferred.reject(errorCode);
                return;
            }
            if (result && result[0]) {
                result[0].avatar = result[0].portrait_url;
            }
            callback(null, result);
            deferred.resolve(result);
        }, true);
        return deferred.promise();
    };

    // 邀请好友
    Friend.invite = function (id, content, callback) {
        callback = callback || $.noop;
        const params = {
            id,
            content,
        };
        Http.post('/friends/invite/', params)
            .then(() => {
                Friend.notifyFriendRequest();
                callback();
            }).fail(callback);
    };

    // 接受请求
    Friend.accept = function (friendRequest, callback) {
        callback = callback || $.noop;
        Cache.friendList = Cache.friendList || [];
        Http.post(`/friends/accept/${friendRequest.requestId}`)
            .then((result) => {
                Friend.notifyFriend();
                Friend.notifyFriendRequest();
                callback(result);
            }).fail(callback);
    };

    // 获取好友信息
    Friend.getFriend = function (friendId, callback) {
        callback = callback || $.noop;
        // mock
        Http.get(`/friends/${friendId}`)
            .then((friend) => {
                friend.avatar = friend.portrait_url;
                friend.mobile = friend.tel;
                callback(null, friend);
            }).fail(callback);
    };

    // 从缓存获取单个好友信息
    Friend.getCacheFriend = function (userId) {
        const cacheList = Cache.friendList;
        if (!cacheList) {
            return null;
        }
        for (let i = 0, len = cacheList.length; i < len; i += 1) {
            if (cacheList[i].id === userId) {
                return cacheList[i];
            }
        }
        return null;
    };

    // 获取好友列表
    Friend.getList = function (callback) {
        callback = callback || $.noop;
        Http.get('/friends')
            .then((result) => {
                const friendList = result.data.map(item => ({
                    id: item.id,
                    name: item.name,
                    avatar: item.portrait_url,
                    tel: item.tel,
                    user_type: item.user_type,
                    bothFriend: item.is_both_friend,
                    create_dt: item.create_dt,
                }));
                Cache.friendList = friendList;
                return callback(null, friendList);
            }).fail(callback);
    };

    Friend.isFileHelper = function (id) {
        const file = getServerConfig().file;
        const fileHelperId = file.file_transfer_robot_id;
        const isFileHelper = id === fileHelperId;
        return isFileHelper;
    };

    // TODO: 代码没有异步 callback 的必要
    Friend.getFileHelper = function (callback) {
        callback = callback || $.noop;
        const file = getServerConfig().file;
        let error;
        if (!file) {
            error = 'serverConfig.file is undefined!';
            utils.console.error(error);
            callback(error, null);
            return undefined;
        }
        const fileHelperId = file.file_transfer_robot_id;
        if (!fileHelperId) {
            error = 'fileHelperId is undefined';
            utils.console.error(error);
            callback(error, null);
            return undefined;
        }
        const locale = (RongIM.instance || { config: {} }).config.locale || 'zh';
        const info = {
            id: fileHelperId,
            name: localeConf[locale].components.getFileHelper.title,
            type: 3,
        };
        callback(null, info);
        return info;
    };

    Friend.getCacheList = function () {
        const cacheList = Cache.friendList || [];
        return cacheList;
    };

    // 删除好友
    Friend.delFriend = function (friendId, callback) {
        callback = callback || $.noop;
        Http.del(`/friends/${friendId}`).then((result) => {
            const idList = Cache.friendList.map(item => item.id);
            const index = idList.indexOf(friendId);
            if (index >= 0) {
                Cache.friendList.splice(index, 1);
            }
            const requestList = Cache.friendRequest;
            const friendRequest = requestList.filter(req => req.uid === friendId)[0];
            Friend.delRequest(friendRequest.requestId);
            Friend.notifyFriend();
            // notifyFriendRequest();
            callback(null, result);
        }).fail(callback);
    };

    // 删除所有好友
    Friend.delAllFriend = function (callback) {
        callback = callback || $.noop;
        Http.del('/friends/all')
            .then(() => {
                callback();
                Cache.friendList = [];
                Friend.notifyFriend();
            }).fail(callback);
    };

    // 获取请求列表
    Friend.getRequestList = function (callback) {
        callback = callback || $.noop;
        // var cacheList = Cache.friendRequest;
        // if(!$.isEmptyObject(cacheList)){
        //     return callback(null, cacheList);
        // }
        // mock
        // $.getJSON('http://localhost:3000/friend-request-list')
        Http.get('/friends/request_list')
            .then((result) => {
                let list = result.data;
                list = list.filter((item) => {
                    item.user = {
                        id: item.uid,
                        name: item.name,
                        avatar: item.portrait_url,
                    };
                    return item.state > 0;
                });
                Cache.friendRequest = list;
                callback(null, list);
            }).fail(callback);
    };

    // 从缓存获取好友请求信息
    Friend.getCacheRequest = function () {
        const cacheList = Cache.friendRequest || [];
        // for (var i = 0, len = cacheList.length; i < len; i++) {
        //     if (cacheList[i].id === userId) {
        //         return cacheList[i];
        //     }
        // }
        return cacheList;
    };

    // 删除请求记录
    Friend.delRequest = function (requestId, callback) {
        callback = callback || $.noop;
        Http.del(`/friends/request_list/${requestId}`).then((result) => {
            const idList = Cache.friendRequest.map(item => item.requestId);
            const index = idList.indexOf(requestId);
            if (index >= 0) {
                Cache.friendRequest.splice(index, 1);
            }
            // requestObserverList.notify();
            callback(result);
        }).fail(callback);
    };

    // 删除所有请求记录
    Friend.delAllRequest = function (callback) {
        callback = callback || $.noop;
        Http.del('/friends/request_list/all')
            .then((result) => {
                callback(result);
                Cache.friendRequest = {};
                // requestObserverList.notify();
            }).fail(callback);
    };

    // 清除邀请记录未读数
    Friend.clearUnread = function (callback) {
        callback = callback || $.noop;
        Http.put('/friends/clear_unread')
            .then(() => {
                Friend.notifyFriendRequest();
                callback();
            }).fail(callback);
    };
    // 获取用户申请记录
    Friend.getRequest = function (id) {
        let requestInfo = null;
        const cacheList = Cache.friendRequest;
        for (let i = 0, len = cacheList.length; i < len; i += 1) {
            if (cacheList[i].uid === id) {
                requestInfo = cacheList[i];
                break;
            }
        }
        return requestInfo;
    };

    Friend.watch = function (listener) {
        friendObserverList.add(listener);
    };

    Friend.unwatch = function (listener) {
        friendObserverList.remove(listener);
    };

    // Friend.watchRequest = function (listener) {
    //     requestObserverList.add(listener);
    // };

    // Friend.unwatchRequest = function (listener) {
    //     requestObserverList.remove(listener);
    // };

    Friend.notifyFriend = function () {
        Friend.getList((errorCode, list) => {
            if (errorCode) {
                return;
            }
            list = list || [];
            const result = {
                type: 'Friend',
                list,
            };
            friendObserverList.notify(result);
        });
    };

    Friend.notifyFriendRequest = function () {
        Friend.getRequestList((errorCode, list) => {
            if (errorCode) {
                return;
            }
            list = list || [];
            const result = {
                type: 'Request',
                list,
            };
            friendObserverList.notify(result);
        });
    };

    Friend.getFriendList = function () {
        function callback(result) {
            return result.data;
        }

        return request('/friends', 'GET').then(callback);
    };

    RongIM.dataModel.Friend = Friend;
};
