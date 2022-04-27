/* eslint-disable no-multi-assign */
/* eslint-disable no-restricted-globals */
/* eslint-disable no-param-reassign */
/* eslint-disable no-underscore-dangle */
/* eslint-disable func-names */

import syncdata from '../syncdata';
import imageViewer from '../imageViewer';
import isAvailableData from '../isAvailableData';
import lib from '../lib';
import UploadStatus from '../utils/UploadStatus';
import { getServerConfig } from '../cache/helper';
import system from '../system';

export default (RongIM) => {
    const Cache = RongIM.dataModel._Cache;
    const ObserverList = RongIM.dataModel._ObserverList;
    const util = RongIM.dataModel.util;
    const generatorKey = util.generatorKey;
    const getStoreKey = util.getStoreKey;
    const store = RongIM.utils.cache;
    const getServerTime = RongIM.dataModel.getServerTime;
    let config = RongIM.dataModel.config;
    const getLibErrorCode = util.getLibErrorCode;

    let utils = RongIM.utils;
    const common = RongIM.common;
    let getCurrentConnectionStatus = null;
    let orgApi = null;
    let userApi = null;
    let conversationApi = null;
    let pinApi = null;
    let groupApi = null;
    let groupNtcApi = null;
    let statusApi = null;
    let friendApi = null;
    let starApi = null;
    let accountApi = null;

    RongIM.messageTotal = 0;
    const PullMessageStatus = {
        isFinished: true,
        set(isFinished) {
            this.isFinished = isFinished;
            conversationApi.isPullMessageFinished = isFinished;
        },
        get() {
            return this.isFinished;
        },
    };

    const UpdateStatusType = {
        FAV_GROUP_UPDATED: 1,
        FAV_CONTACT_UPDATED: 2,
        CONVERSATION_SETTING_UPDATED: 3,
        COMPANY_UPDATED: 4,
        DEPARTMENT_UPDATED: 5,
        DUTY_UPDATED: 6,
        USER_SETTING_UPDATED: 7,
        STAFF_UPDATED: 8,
        PASSWORD_UPDATED: 9,
        DEPART_MEMBER_UPDATED: 10,
        USER_UPDATED: 11,
        CONFIGURATION_UPDATED: 12,
        USERNAME_UPDATED: 13,
        FAV_CONTENT_UPDATED: 14, // 收藏内容更新
        VISIBLE_SCOPE_UPDATED: 15, // 通讯录可见范围更新
        DEL_FRIEND: 1000,
    };

    const delaySync = RongIM.utils.debounce((callback) => {
        if (typeof callback === 'function') {
            callback();
        }
    }, RongIM.config.syncDelayTime);

    function updateStatusMessageHandle(message) {
        RongIM.system.appLogger('info', `[ReceiveMessage][RCEUpdateStatusMessage]${JSON.stringify(message)}`);
        // 数据同步不需要处理离线消息
        if (message.offLineMessage) {
            return;
        }
        switch (message.content.updateType) {
        case UpdateStatusType.FAV_GROUP_UPDATED:
            break;
        case UpdateStatusType.FAV_CONTACT_UPDATED:
            starApi.getStarList().done((idList) => {
                Cache.starList = idList;
            });
            starApi.observerList.notify();
            break;
        case UpdateStatusType.CONVERSATION_SETTING_UPDATED:
            Cache.conversation.isSetting = false;
            Cache.conversation.topList = null;
            Cache.conversation._defer = null;
            conversationApi.observerList.notify();
            break;
        case UpdateStatusType.COMPANY_UPDATED:
            delaySync(() => {
                syncdata.company();
            });
            break;
        case UpdateStatusType.DEPARTMENT_UPDATED:
            // 更新部门信息
            delaySync(() => {
                syncdata.department();
            });
            break;
        case UpdateStatusType.DUTY_UPDATED:
            break;
        case UpdateStatusType.USER_SETTING_UPDATED:
            break;
        case UpdateStatusType.STAFF_UPDATED:
            // 多端同步修改自己头像或信息更新本地缓存
            syncdata.userBatchById([Cache.auth.id], () => {
                userApi.getNewUser(Cache.auth.id, (errorCode, user) => {
                    if (errorCode) {
                        return;
                    }
                    $.extend(RongIM.instance.auth, user);
                    $.extend(Cache.auth, user);
                    // 清除缓存消息更新消息中用户信息。
                    userApi.observerList.notify(user);
                });
            });
            break;
        case UpdateStatusType.PASSWORD_UPDATED:
            accountApi.observerList.notify('password-changed');
            break;
        case UpdateStatusType.DEPART_MEMBER_UPDATED:
            // 更新所有组织机构信息 使用随机 1-300 秒 timer
            delaySync(() => {
                const delay = Math.round(Math.random() * 300) * 1000;
                // eslint-disable-next-line no-console
                console.info('%cDEPART_MEMBER_UPDATED', 'color:green', delay);
                RongIM.system.appLogger('info', `[DEPART_MEMBER_UPDATED]${delay}`);
                setTimeout(() => {
                    const auth = RongIM.instance.auth;
                    if (auth) {
                        syncdata.all(auth.isStaff);
                    }
                }, delay);
                // delete Organization.getCompany.cache;
                delete orgApi.getRoot.cache;
                orgApi.observerList.notify();
            });
            break;
        case UpdateStatusType.USER_UPDATED:
            break;
        case UpdateStatusType.CONFIGURATION_UPDATED:
            break;
        case UpdateStatusType.USERNAME_UPDATED:
            break;
        // eslint-disable-next-line no-case-declarations
        case UpdateStatusType.DEL_FRIEND:
            const targetId = message.content.uid;
            const ConversationType = RongIMLib.ConversationType;
            friendApi.delFriend(targetId, () => {});
            friendApi.delRequest(targetId, () => {});
            conversationApi.remove(ConversationType.PRIVATE, targetId, () => {});
            break;
        case UpdateStatusType.FAV_CONTENT_UPDATED:
            break;
        case UpdateStatusType.VISIBLE_SCOPE_UPDATED:
            break;
        default:
            utils.console.warn('Unknown update type ==> ', message.content.updateType);
            break;
        }
    }

    const isSameConversation = function (message) {
        const active = conversationApi.active;
        const activeType = active.conversationType;
        const activeId = active.targetId;
        return message.targetId === activeId && +activeType === +message.conversationType;
    };

    const Message = {
        TextMessage: RongIMLib.TextMessage,
        ImageMessage: RongIMLib.ImageMessage,
        FileMessage: RongIMLib.FileMessage,
        observerList: new ObserverList(),
        _cache: {},
        _push(message, callback) {
            callback = callback || $.noop;
            const key = getCacheKey(message);
            // eslint-disable-next-line no-multi-assign
            const cacheList = Message._cache[key] = Message._cache[key] || [];

            if (!messageUnexist(message, cacheList)) {
                return;
            }
            // 先设置一个 user 属性防止 Vue 监测不到用户信息变化
            message.user = {};

            if (message.offLineMessage) {
                if (cacheList.length > 60) {
                    cacheList.splice(0, 50);
                }
                // server 下发离线消息有时顺序不对，需要重新排序
                let position = 0;
                const cacheLength = cacheList.length;
                for (let i = cacheLength - 1; i >= 0; i -= 1) {
                    if (cacheList[i].sentTime < message.sentTime) {
                        position = i + 1;
                        break;
                    }
                }
                // 顺序不对时打印日志
                if (position !== cacheLength) {
                    utils.console.warn(`离线消息顺序不正确 messageUId:${
                        message.messageUId
                    } targetId:${message.targetId
                    } conversationType:${message.conversationType}`);
                }
                cacheList.splice(position, 0, message);
            } else {
                cacheList.push(message);
            }
            // 如果是当前会话则立即添加用户信息，否则切换会话时再获取
            if (isSameConversation(message)) {
                Message.addSendUserInfo(message, (errorCode, msg) => {
                    if (errorCode) {
                        callback(errorCode);
                        return;
                    }
                    callback(null, msg);
                });
            }
        },
        _sendPush(message, callback) {
            callback = callback || $.noop;
            const key = getCacheKey(message);
            // eslint-disable-next-line no-multi-assign
            const cacheList = Message._cache[key] = Message._cache[key] || [];
            const cacheMessage = getCacheMessageById(cacheList, message.messageId);
            if (cacheMessage) {
                cacheMessage.sentStatus = message.sentStatus;
                $.extend(cacheMessage, message);
                callback(null, cacheMessage);
            } else {
                Message.addSendUserInfo(message, (errorCode, msg) => {
                    if (errorCode) {
                        callback(errorCode);
                        return;
                    }
                    cacheList.push(msg || message);
                    callback(null, msg);
                });
            }
        },
    };
    const msgObserverList = Message.observerList;

    Cache.messageQueue = [];
    Cache.messageRecallEdit = {};

    Message.cleanCache = function () {
        Cache.messageQueue = [];
        Cache.messageRecallEdit = {};
        Message._cache = {};
    };

    let apiList = [];
    Message.loadApi = function () {
        const dataModel = RongIM.dataModel;
        orgApi = dataModel.Organization;
        userApi = dataModel.User;
        groupApi = dataModel.Group;
        conversationApi = dataModel.Conversation;
        statusApi = dataModel.Status;
        pinApi = dataModel.Pin;
        groupNtcApi = dataModel.GroupNotice;
        friendApi = dataModel.Friend;
        starApi = dataModel.Star;
        accountApi = dataModel.Account;
        apiList = [orgApi, userApi, groupApi, conversationApi, statusApi];
        apiList = apiList.concat([pinApi, groupNtcApi, friendApi, starApi]);
        apiList = apiList.concat([accountApi]);

        config = dataModel.config;
        utils = RongIM.utils;
        getCurrentConnectionStatus = statusApi.getCurrentConnectionStatus;
    };

    function getCacheMessageById(cacheList, messageId) {
        for (let i = 0, len = cacheList.length; i < len; i += 1) {
            // fix: web SDK 返回 messageId 有时是数字有时是字符串
            if (cacheList[i].messageId && messageId && cacheList[i].messageId.toString() === messageId.toString()) {
                return cacheList[i];
            }
        }
        return null;
    }

    function getCacheMessageByUId(type, id, uid) {
        const key = `${type}_${id}`;
        const list = Message._cache[key] || [];
        for (let i = list.length - 1; i >= 0; i -= 1) {
            if (list[i].messageUId === uid) {
                return list[i];
            }
        }
        return null;
    }

    function getCacheKey(obj) {
        return `${obj.conversationType}_${obj.targetId}`;
    }

    Message.getCacheKey = getCacheKey;

    function spliceMessage(cacheList, messageId, message) {
        if (!cacheList) {
            return null;
        }
        let index = null;
        for (let i = 0, len = cacheList.length; i < len; i += 1) {
            const cacheMsg = cacheList[i];
            if (cacheMsg.messageId === messageId || cacheMsg.messageUId === messageId) {
                index = i;
                break;
            }
        }

        if (index === null) {
            return null;
        }
        const result = cacheList[index];
        if (message) {
            Message.addSendUserInfo(message, (errorCode, msg) => {
                index = cacheList.indexOf(result);
                if (index === -1) {
                    return;
                }
                cacheList.splice(index, 1, msg);
            });
        } else {
            cacheList.splice(index, 1);
        }
        return result;
    }

    /*
说明： 记录删除的最早的一条消息
       在获取 server 的历史消息时对比时间戳，如果比此时间戳大则使用此时间戳。
       (删除本地最早一条消息时，再次从 server 端拉去会将此消息拉取下来)
*/
    function getRemovedEarliestMessageTime(params) {
        const key = `removed_earliest_message_${params.conversationType}_${params.targetId}`;
        const timestamp = store.get(key) || 0;
        return timestamp;
    }
    function saveRemovedEarliestMessageTime(params) {
        let timestamp = getRemovedEarliestMessageTime(params);
        const firstSave = timestamp === 0;
        const earliestTime = params.sentTime < timestamp && +params.sentTime !== 0;
        if (earliestTime || firstSave) {
            timestamp = params.sentTime;
        }
        const key = `removed_earliest_message_${params.conversationType}_${params.targetId}`;
        store.set(key, timestamp);
    }
    Message.saveRemovedEarliestMessageTime = saveRemovedEarliestMessageTime;
    /*
说明：修改消息体 Web SDK 与 C++ SDK 定义消息结构不一致业务逻辑层不容易处理这里统一数据格式
      1. PublicServiceRichContentMessage 公众号单图文
      2. PublicServiceMultiRichContentMessage 公众号多图文
*/
    function hackWebSDKMessage(messageList) {
        if (!messageList) {
            return;
        }
        if (!$.isArray(messageList)) {
            messageList = [messageList];
        }
        messageList.forEach((message) => {
            const content = message.content;
            if (!content) {
                return;
            }
            if (message.messageType === 'PublicServiceRichContentMessage') {
                if (content && !utils.isEmpty(content.richContentMessage)) {
                    content.articles = content.richContentMessage.articles || [];
                }
            }
            if (message.messageType === 'PublicServiceMultiRichContentMessage') {
                if (content && !utils.isEmpty(content.richContentMessages)) {
                    content.articles = content.richContentMessages.articles || [];
                }
            }
        });
    }

    Message.hackWebSDKMessage = hackWebSDKMessage;

    Message.addSendUserInfo = function (message, callback) {
        callback = callback || $.noop;
        const userId = message.senderUserId;
        if ($.isArray(message)) {
            const userList = message.map(item => item.senderUserId);
            userApi.getUsers(userList, () => {
                message.forEach((item) => {
                    item.user = Cache.user[item.senderUserId];
                });
                callback(null, message);
            });
        } else {
            userApi.getUsers([userId], (errorCode, list) => {
                if (errorCode) {
                    callback(errorCode);
                    return;
                }
                message.user = list[0];
                callback(null, message);
            });
        }
    };

    /*
params.position 1 从缓存获取 2 从服务器获取
params.timestamp
params.count
params.conversationType
params.targetId
params.type 要获取的消息类型  **仅本地消息支持
params.before true:获取比指定时间戳早发的消息,false: 获取比指定时间戳晚发的消息 **仅本地消息支持 false
*/
    Message.get = function (params, callback, imageHistory) {
        callback = callback || $.noop;
        const key = `${params.conversationType}_${params.targetId}`;
        const cacheList = Message._cache[key] = Message._cache[key] || [];
        if (+params.position === 2 || cacheList.length === 0) {
            params.timestamp = Number(params.timestamp) || 0;
            params.count = params.count || config.dataModel.getHistoryMessagesNumber;
            const isFirstGetHistory = cacheList.length === 0;
            let undef;
            if (params.before === undef) {
                params.before = true;
            }
            if (imageHistory) {
                getImageHistoryMessage(params, (errorCode, messageList, hasMore) => {
                    if (errorCode) {
                        callback(errorCode);
                        return;
                    }
                    // C++ 本地获取不到，需要从服务端获取
                    const notSearchMessage = !params.type && params.before;
                    if (messageList.length < params.count && notSearchMessage) {
                        params.count -= messageList.length;
                        // SDK 和服务器不允许获取一条历史消息
                        const count = params.count;
                        if (params.count === 1) {
                            params.count = 2;
                        }
                        const earliestMessage = messageList[0];
                        if (earliestMessage) {
                            params.timestamp = earliestMessage.sentTime;
                        }
                        getRemoteHistoryMessages(params, (error, remoteMessageList, remoteHasMore) => {
                            remoteMessageList = remoteMessageList.slice(-count);
                            remoteMessageList = remoteMessageList.concat(messageList);
                            if (cacheList.length === 0 && +params.position === 1) {
                                Message._cache[key] = remoteMessageList;
                            }
                            callback(error, remoteMessageList, remoteHasMore);
                        });
                    } else {
                        if (cacheList.length === 0 && +params.position === 1) {
                            Message._cache[key] = messageList;
                        }
                        callback(errorCode, messageList, hasMore);
                    }
                });
            } else {
                getHistoryMessages(params, (errorCode, messageList, hasMore) => {
                    if (errorCode) {
                        callback(errorCode);
                        return;
                    }
                    // C++ 本地获取不到，需要从服务端获取
                    const notSearchMessage = !params.type && params.before;
                    if (messageList.length < params.count && notSearchMessage) {
                        params.count -= messageList.length;
                        // SDK 和服务器不允许获取一条历史消息
                        const count = params.count;
                        if (params.count === 1) {
                            params.count = 2;
                        }
                        const earliestMessage = messageList[0];
                        if (earliestMessage) {
                            params.timestamp = earliestMessage.sentTime;
                        }
                        const timestamp = getRemovedEarliestMessageTime(params);
                        const isBefore = timestamp < params.timestamp;
                        const isInitialValue = timestamp === 0;
                        const isFirstGet = params.timestamp === 0;
                        if ((isBefore && !isInitialValue) || isFirstGet) {
                            params.timestamp = timestamp;
                        }
                        getRemoteHistoryMessages(params, (error, remoteMessageList, remoteHasMore) => {
                            remoteMessageList = remoteMessageList.slice(-count);
                            remoteMessageList = remoteMessageList.concat(messageList);
                            if (cacheList.length === 0 && +params.position === 1) {
                                Message._cache[key] = remoteMessageList;
                            }
                            // 首次进入会话获取历史消息过程中收到新消息返回新消息不使用历史消息
                            if (isFirstGetHistory && cacheList.length > 0) {
                                callback(error, cacheList, true);
                            } else {
                                callback(error, remoteMessageList, remoteHasMore);
                            }
                        });
                    } else {
                        if (cacheList.length === 0 && +params.position === 1) {
                            Message._cache[key] = messageList;
                        }
                        // 首次进入会话获取历史消息过程中收到新消息返回新消息不使用历史消息
                        if (isFirstGetHistory && cacheList.length > 0) {
                            callback(errorCode, cacheList, true);
                        } else {
                            callback(errorCode, messageList, hasMore);
                        }
                    }
                });
            }
        } else {
            if (cacheList.length > 50) {
                const length = cacheList.length - 50;
                cacheList.splice(0, length);
            }
            // 更新用户信息
            Message.addSendUserInfo(cacheList);
            callback(null, cacheList, true);
        }
    };

    /**
    @param {object}      params
    @param {number}      params.conversationType - 会话类型
    @param {string}      params.targetId         - 会话Id
    @param {number|null} params.timestamp        - 起始时间戳
    @param {number}      params.count            - 获取消息条数
    @param {string}      params.type             - 获取消息类型
    @param {boolean}     params.before           - true: 获取比指定时间戳早的消息，false：获取比指定时间戳晚的消息
    @param {function}    callback                - 回调函数
    */
    function getHistoryMessages(params, callback) {
        let objectName = '';
        if (params.type) {
            objectName = RongIMClient.getMessageObjectName(params.type);
        }
        RongIMClient.getInstance().getHistoryMessages(params.conversationType, params.targetId, params.timestamp, params.count, {
            onSuccess(list, hasMore) {
                hackWebSDKMessage(list);
                for (let i = 0, len = list.length; i < len; i += 1) {
                    bindResponseToMessage(list[i]);
                    if (list[i].messageType === RongIMClient.MessageType.LocalFileMessage) {
                        list[i].progress = list[i].progress || 0;
                        list[i].uploadStatus = list[i].uploadStatus || '';
                    }
                }
                Message.addSendUserInfo(list, (errorCode, messageList) => {
                    callback(null, messageList, hasMore);
                });
            },
            onError(errorCode) {
                callback(getLibErrorCode(errorCode));
            },
        }, objectName, +(!params.before));
    }

    /**
    @param {object}      params
    @param {number}      params.conversationType - 会话类型
    @param {string}      params.targetId         - 会话Id
    @param {number|null} params.timestamp        - 起始时间戳
    @param {number}      params.count            - 获取消息条数
    @param {string}      params.type             - 获取消息类型
    @param {boolean}     params.before           - true: 获取比指定时间戳早的消息，false：获取比指定时间戳晚的消息

    @param {function}    callback                - 回调函数
    */
    function getImageHistoryMessage(params, callback) {
        let objectName;
        if (params.type === 'ImageMessage') {
            objectName = ['RC:ImgMsg', 'RC:SightMsg', 'RC:GIFMsg'];
        } else {
            objectName = 'RC:ImgMsg';
        }
        getHistoryMessagesByObjectNames(params.conversationType, params.targetId, params.timestamp, params.count, {
            onSuccess(list, hasMore) {
                for (let i = 0, len = list.length; i < len; i += 1) {
                    bindResponseToMessage(list[i]);
                }
                Message.addSendUserInfo(list, (errorCode, messageList) => {
                    callback(null, messageList, hasMore);
                });
            },
            onError(errorCode) {
                callback(getLibErrorCode(errorCode));
            },
        }, objectName, params.before);
    }

    /**
    方法： 获取只有 图片和小视频 的历史消息数据
    参数：
        @param {number}      conversationType - 会话类型
        @param {string}      targetId         - 会话Id
        @param {number|null} timestamp        - 起始时间戳
        @param {number}      count            - 获取消息条数
        @param {function}    callback         - 回调函数
        @param {array}       objectName       - 获取消息类型
        @param {boolean}     direction        - true: 获取比指定时间戳早的消息，false：获取比指定时间戳晚的消息
    */
    function getHistoryMessagesByObjectNames(conversationType, targetId, timestamp, count, callback, objectName, direction) {
        objectName = objectName || '';
        direction = typeof direction === 'undefined' || direction;
        try {
            /**
             * 38852 - 【消息记录】历史消息记录中的图片消息记录显示为空
             * A lot of lib functions have been moved to @rongcloud
             */
            RongIMClient.getInstance().callExtra(
                'getHistoryMessagesByObjectNames',
                {
                    onSuccess(list) {
                        const msgs = [];
                        list.reverse();
                        const len = list.length;
                        for (let i = 0; i < len; i += 1) {
                            const message = buildMessage(list[i]);
                            msgs[i] = message;
                        }
                        callback.onSuccess(msgs, len === count);
                    },
                    onError(error) {
                        console.info(
                            '调用sdk.getHistoryMessagesByObjectNames----失败',
                            error,
                        );
                        callback(getLibErrorCode(error));
                    },
                },
                conversationType,
                targetId, timestamp || 0,
                count,
                objectName,
                direction,
            );
        } catch (e) {
            callback.onError(RongIMLib.ErrorCode.TIMEOUT);
        }
    }

    // 方法： 将获取到的历史消息数据转换成需要的数据格式
    // 参数：@param {Object} result - 消息数据
    function buildMessage(ret) {
        const typeMapping = {
            'RC:ImgMsg': 'ImageMessage',
            'RC:SightMsg': 'SightMessage',
            'RC:GIFMsg': RongIMLib.RongIMClient.MessageType.GIFMessage,
        };
        const message = new RongIMLib.Message();
        // const ret = JSON.parse(result);
        message.conversationType = ret.conversationType;
        message.targetId = ret.targetId;
        message.senderUserId = ret.senderUserId;
        const msgDirection = +ret.direction;
        message.messageDirection = msgDirection;
        if (msgDirection === RongIMLib.MessageDirection.RECEIVE) {
            message.receivedStatus = ret.status;
        } else if (msgDirection === RongIMLib.MessageDirection.SEND) {
            message.sentStatus = ret.status;
        }
        message.sentTime = ret.sentTime;
        message.objectName = ret.objectName;
        const content = ret.content;
        const messageType = typeMapping[ret.objectName];
        if (content) {
            content.messageName = messageType;
        }
        message.content = content;
        message.messageId = ret.messageId;
        // 38852 - 【消息记录】历史消息记录中的图片消息记录显示为空
        // when clicking any thumb images in 消息记录/图片, it always shows the last image.
        message.messageUId = ret.messageUId;
        message.messageType = messageType;
        return message;
    }

    /**
@param {object}      params
@param {number}      params.conversationType - 会话类型
@param {string}      params.targetId         - 会话Id
@param {number|null} params.timestamp        - 起始时间戳
@param {number}      params.count            - 获取消息条数

@param {function}    callback                - 回调函数
*/
    function getRemoteHistoryMessages(params, callback) {
        RongIMClient.getInstance().getRemoteHistoryMessages(params.conversationType, params.targetId, params.timestamp, params.count, {
            onSuccess(list, hasMore) {
                hackWebSDKMessage(list);
                for (let i = 0, len = list.length; i < len; i += 1) {
                    bindResponseToMessage(list[i]);
                }
                Message.addSendUserInfo(list, (errorCode, messageList) => {
                    callback(null, messageList, hasMore);
                });
            },
            onError(errorCode) {
                callback(getLibErrorCode(errorCode), []);
            },
        });
    }

    /*
conversationType
targetId
messageUId
*/
    Message.getMessageNearList = function (idOrUId, callback) {
        callback = callback || $.noop;
        Message.getOne(idOrUId, (errorCode, message) => {
            if (errorCode) {
                callback(getLibErrorCode(errorCode));
                return;
            }
            const targetId = message.targetId;
            const conversationType = message.conversationType;
            const timestamp = message.sentTime;
            const params = {
                targetId,
                conversationType,
                timestamp,
                position: 2,
            };
            messageNearList(params, message, callback);
        });
    };
    function messageNearList(params, message, callback) {
        Message.get(params, (errorCode, messageList) => { // upMsg
            if (errorCode) {
                callback(getLibErrorCode(errorCode));
                return;
            }
            Message.addSendUserInfo([message], (error, msgList) => { // downMsg
                if (error) {
                    callback(error);
                    return;
                }
                const msg = msgList[0];
                messageList.push(msg);
                params.before = false;
                Message.get(params, (err, list) => {
                    if (err) {
                        callback(getLibErrorCode(err));
                        return;
                    }
                    list.reverse();
                    const index = list.findIndex(m => m.messageId === msg.messageId);
                    if (index > -1) {
                        list.splice(index, 1);
                    }
                    messageList = messageList.concat(list);
                    callback(null, messageList, message, msg);
                });
            });
        });
    }

    Message.getOne = function (idOrUId, callback) {
        callback = callback || $.noop;
        RongIMClient.getInstance().getMessage(idOrUId, {
            onSuccess(message) {
                callback(null, message);
            },
            onError(errorCode) {
                callback(getLibErrorCode(errorCode));
            },
        });
    };

    const getLocalMessage = function (params) {
        const msg = new RongIMLib.Message();
        msg.content = params.content.content;
        msg.conversationType = params.conversationType;
        msg.targetId = params.targetId;
        msg.senderUserId = Cache.auth.id;
        msg.sentStatus = RongIMLib.SentStatus.SENDING;
        msg.messageId = params.messageId;
        msg.messageDirection = RongIMLib.MessageDirection.SEND;
        msg.messageType = params.content.messageType;
        msg.sentTime = getServerTime();
        msg.receivedStatus = RongIMLib.ReceivedStatus.UNREAD;
        return msg;
    };

    function sendMessage(params, callback) {
        callback = callback || $.noop;
        // 发送消息前将 localPath 删除防止发给其他端
        const content = $.extend({}, params.content);
        delete content.localPath;
        RongIMClient.getInstance().sendMessage(+params.conversationType, params.targetId, content, {
            onBefore(messageId) {
                params.messageId = messageId;
                const message = getLocalMessage(params);
                callback(null, message);
                const convesationCallback = function () {
                    const list = conversationApi.getLocalList();
                    conversationApi.splitTopConversation(list, (sortList) => {
                        conversationApi.observerList.notify(sortList, {
                            sendMessage: true, // 标识是发送消息的notify
                            message,
                        });
                    });
                };
                const conversation = conversationApi.getLocalOne(params.conversationType, params.targetId);
                if (conversation) {
                    conversation.latestMessage = message;
                    conversation.sentTime = message.sentTime;
                    convesationCallback();
                } else {
                    params.latestMessage = message;
                    params.sentTime = message.sentTime;
                    conversationApi.add(params, () => {
                        convesationCallback();
                    });
                }
            },
            onSuccess(message) {
                fixSendMessageBug(message);
                callback(null, message);
                const conversation = conversationApi.getLocalOne(params.conversationType, params.targetId);
                if (conversation) {
                    conversation.latestMessage = message;
                }
                let list = conversationApi.getLocalList();
                list = sortListBySendTime(list);
                conversationApi.observerList.notify(list, {
                    sendMessage: true, // 标识是发送消息的notify
                    message,
                });
            },
            onError(errorCode, message) {
                // sdk消息状态不对，先手动修改为发送失败状态，后期sdk修复后删除
                message.sentStatus = 20;
                fixSendMessageBug(message);
                message.sentTime = message.sentTime || new Date().getTime();
                // fix: rcx 为客户定制敏感词返回对应 code 码 rce 不需要提示，这里做特殊处理
                // 敏感词替换、屏蔽，显示发送成功
                const arr = [
                    common.ErrorCode.SENSITIVE_WORDS_REPLACED,
                    common.ErrorCode.SENSITIVE_WORDS_INTERCEPT,
                ];
                const isReplaceOrIntercept = arr.indexOf(errorCode) > -1;
                if (isReplaceOrIntercept) {
                    message.sentStatus = RongIMLib.SentStatus.SENT;
                    errorCode = null;
                    Message.setMessageSentStatus({
                        messageId: message.messageId,
                        status: message.sentStatus,
                    });
                }
                callback(errorCode, message);
                const conversation = conversationApi.getLocalOne(params.conversationType, params.targetId);
                conversation.latestMessage = message;
                const list = conversationApi.getLocalList();
                conversationApi.observerList.notify(list);
            },
        }, params.mentiondMsg);
    }

    // 解决bug 发送消息后，会话排序错乱问题
    function sortListBySendTime(list = []) {
        if (!list.length) return list;
        const topList = list.filter(item => item.isTop === true);
        const normalList = list.filter(item => item.isTop !== true);
        normalList.sort((a, b) => {
            if (a.latestMessage && b.latestMessage) {
                return b.latestMessage.sentTime - a.latestMessage.sentTime;
            }
            return false;
        });
        return [...topList, ...normalList];
    }

    // 解决bug 全员群消息不计数、@人不显示问题
    function sendCommandMessageUnReadCount(params, callback) {
        const status = getCurrentConnectionStatus();
        const CONNECTED = 0;
        if (status !== CONNECTED) {
            Cache.messageQueue.push(params);
        }
        system.appLogger(
            'info',
            `开始发送消息： ${JSON.stringify(params.content)}`,
        );
        const isMentioned = false; // @ 消息
        const pushContent = null; // Push 显示内容
        const pushData = null; // Push 通知时附加信息, 可不填
        const configMsg = {
            userIds: [Cache.auth.id], // 群定向消息, 仅发消息给群中的 user1 和 user2
            isVoipPush: true, // 发送 voip push
        };

        RongIMClient.getInstance().sendMessage(params.conversationType, params.targetId, params.content, {
            onSuccess(result) {
                system.appLogger(
                    'info',
                    `发送消息成功： ${JSON.stringify(result)}`,
                );
                if (callback) {
                    callback();
                }
            },
            onError(error) {
                system.appLogger(
                    'error',
                    `发送消息失败： ${JSON.stringify(error)}`,
                );
                if (callback) {
                    callback(error);
                }
            },
        }, isMentioned, pushContent, pushData, null, configMsg);
    }

    function sendCommandMessage(params, callback, resend = false) {
        const status = getCurrentConnectionStatus();
        const CONNECTED = 0;
        if (status !== CONNECTED) {
            Cache.messageQueue.push(params);
            if (resend) return;
        }
        system.appLogger(
            'info',
            `开始发送消息： ${JSON.stringify(params.content)}`,
        );

        RongIMClient.getInstance().sendMessage(params.conversationType, params.targetId, params.content, {
            onSuccess(result) {
                system.appLogger(
                    'info',
                    `发送消息成功： ${JSON.stringify(result)}`,
                );
                if (callback) {
                    callback();
                }
            },
            onError(error) {
                system.appLogger(
                    'error',
                    `发送消息失败： ${JSON.stringify(error)}`,
                );
                if (callback) {
                    callback(error);
                }
            },
        });
    }

    Message.sendCommandMessage = sendCommandMessage;

    function fixSendMessageBug(message) {
        if (!message) return message;
        if (+message.messageDirection === RongIMLib.MessageDirection.SEND) {
            message.senderUserId = Cache.auth.id;
            // Web SDK 发送消息 receivedStatus 为 undefined
            let undef;
            if (message.receivedStatus === undef) {
                message.receivedStatus = RongIMLib.ReceivedStatus.UNREAD;
            }
        }
        if (!message.sentTime) {
        // c++ error 回调返回 message 没有sentTime
            message.sentTime = getServerTime();
        }
        return message;
    }

    Message.fixSendMessageBug = fixSendMessageBug;

    Message.send = function (params, callback) {
        callback = callback || $.noop;
        if (!params) {
            return;
        }
        const isPrivate = Number(params.conversationType) === 1;
        if (isPrivate) {
            const canNotChat = !userApi.validateCanChat(params.targetId);
            if (canNotChat) {
                friendApi.requestFriendVerification(params);
                return;
            }
        }
        sendMessage(params, (errorCode, message) => {
            if (message.messageType === utils.messageType.FileMessage) {
                // 42391 - 【拖拽转发】断网后转发消息，没有显示发送失败图标按钮
                if (!window.navigator.onLine) {
                    message.sentStatus = RongIMLib.SentStatus.FAILED;
                } else {
                    message.sentStatus = RongIMLib.SentStatus.SENT;
                }
                message.content.localPath = params.content.content.localPath;
                Message.setContent(message);
            }
            Message._sendPush(message, (errorCode2, msg) => {
                if (!errorCode2) {
                    errorCode2 = errorCode;
                }
                msgObserverList.notify(msg);
                callback(getLibErrorCode(errorCode2), msg);
            });
        });
    };

    Message.sendCard = function (params, callback) {
        params.content = new RongIMClient.RegisterMessage.CardMessage(params.user);
        Message.send(params, callback);
    };

    Message.sendSyncReadStatusMessage = function (message) {
        const lastMessageSendTime = message.sentTime;
        const msg = new RongIMLib.SyncReadStatusMessage({ lastMessageSendTime });

        const params = {
            conversationType: Number(message.conversationType),
            targetId: message.targetId,
            content: msg,
        };
        sendCommandMessageUnReadCount(params);
    };

    Message.sendReadStatus = function (lastMessage) {
        system.appLogger(
            'info',
            `sendReadStatus function  : ${lastMessage.messageUId}`,
        );
        const content = {
            lastMessageSendTime: lastMessage.sentTime,
            messageUId: lastMessage.messageUId,
            type: 1,
        };
        const msg = new RongIMLib.ReadReceiptMessage(content);

        const params = {
            conversationType: Number(lastMessage.conversationType),
            targetId: lastMessage.targetId,
            content: msg,
        };
        sendCommandMessage(params, cbFun);
        function cbFun(error) {
            if (error) {
                sendCommandMessage(params, cbFun, true);
            }
        }
    };

    Message.setMessageSentStatus = function (params, callback) {
        callback = callback || $.noop;
        RongIMClient.getInstance().setMessageSentStatus(params.messageId, params.status, {
            onSuccess(isUpdate) {
                callback(null, isUpdate);
            },
            onError(error) {
                callback(error);
            },
        });
    };

    Message.setMessageReceivedStatus = function (params, callback) {
        callback = callback || $.noop;
        RongIMClient.getInstance().setMessageReceivedStatus(params.messageId, params.status, {
            onSuccess() {
                callback(null);
            },
            onError(errorCode) {
                callback(errorCode);
            },
        });
    };

    Message.setMessageStatus = function (message) {
        const status = RongIMLib.SentStatus.READ;
        const key = getCacheKey(message);
        const cache = Message._cache[key];
        const timespan = message.content.lastMessageSendTime || message.sentTime;
        if (cache) {
            cache.forEach((item) => {
                const isSend = +item.messageDirection === RongIMLib.MessageDirection.SEND;
                const isBefore = item.sentTime <= timespan;
                const isFailed = +item.sentStatus === RongIMLib.SentStatus.FAILED;
                // 上传中的文件不改变状态
                const isUploading = item.uploadStatus && item.uploadStatus !== UploadStatus.SUCCESS;
                if (isSend && isBefore && !isFailed && !isUploading) {
                    item.sentStatus = status;
                }
            });
        }
        const type = message.conversationType;
        const id = message.targetId;
        const conv = conversationApi.getLocalOne(type, id) || {};
        const msg = conv.latestMessage;
        if (msg) {
            const isSend = +msg.messageDirection === RongIMLib.MessageDirection.SEND;
            const isBefore = msg.sentTime <= timespan;
            const isFailed = +msg.sentStatus === RongIMLib.SentStatus.FAILED;
            if (isSend && isBefore && !isFailed) {
                msg.sentStatus = status;
            }
        }
        RongIMClient.getInstance().callExtra('updateMessageReceiptStatus', {
            onSuccess() {
                if (PullMessageStatus.get()) {
                    conversationApi.notifyConversation(null, {
                        receiptStatus: true, // 标识是已读回执的notify
                        message: msg,
                    });
                }
            },
            onError() {

            },
        }, type, id, timespan);
    };

    Message.sendGroupResponse = function (type, id, req) {
        type = Number(type);
        // 注意:更新会话列表
        // 更新本地会话缓存
        const key = getStoreKey('req');
        const conversationKey = generatorKey([type, id]);
        const request = store.get(key) || {};
        delete request[conversationKey];
        if (!$.isEmptyObject(request)) {
            store.set(key, request);
        } else {
            store.remove(key);
        }

        const msg = new RongIMLib.ReadReceiptResponseMessage({ receiptMessageDic: req });
        const params = {
            conversationType: type,
            targetId: id,
            content: msg,
        };
        sendCommandMessage(params);
    };

    Message.sendGroupRequest = function (message) {
        const messageUId = message.messageUId;
        const msg = new RongIMLib.ReadReceiptRequestMessage({ messageUId });
        const key = getStoreKey(`res_${messageUId}`);
        store.set(key, []);

        const params = {
            conversationType: Number(message.conversationType),
            targetId: message.targetId,
            content: msg,
        };
        sendCommandMessage(params);
    };

    /**
 * @params.conversationType
 * @params.targetId
 * @params.sentTime
 * @params.messageUId
 * @params.sendUserId
 * @params.extra
 * @params.user
 */
    Message.recall = function (message, callback) {
        callback = callback || $.noop;
        const params = {
            conversationType: message.conversationType,
            targetId: message.targetId,
            messageUId: message.messageUId,
            messageId: message.messageId,
            sentTime: message.sentTime,
            senderUserId: message.senderUserId,
        };
        Message.setRecallContent(message.messageId, message);
        if (message.user && message.user.name) {
        // 消息撤回添加推送消息
            const locale = RongIM.config.currentLocale();
            params.push = utils.templateFormat(locale.message.recallOther, message.user.name);
        }
        RongIMClient.getInstance().sendRecallMessage(params, {
            onSuccess(msg) {
                utils.console.info('消息撤回：', msg);
                msg.sentTime = message.sentTime;
                msgObserverList.notify(msg);
                callback(null, msg);
                Message.addSendUserInfo(msg, (errorCode, msgInfo) => {
                    if (errorCode) {
                        callback(errorCode);
                        return;
                    }
                    const key = getCacheKey(message);
                    const list = Message._cache[key];
                    msgInfo.messageId = message.messageId;
                    msgInfo.sentTime = message.sentTime;
                    spliceMessage(list, message.messageId, msgInfo);
                    const objectName = RongIMClient.getMessageObjectName(msgInfo.messageType);
                    RongIMClient.getInstance().setMessageContent(message.messageId, params, objectName);
                    const lconv = conversationApi.getLocalOne(message.conversationType, message.targetId);
                    if (message.messageId === lconv.latestMessage.messageId || message.messageUId === lconv.latestMessage.messageUId) {
                        lconv.latestMessage = msgInfo;
                    }
                    const lconvList = conversationApi.getLocalList();
                    conversationApi.observerList.notify(lconvList);
                });
            },
            onError(code) {
                callback(code);
            },
        });
    };

    Message.setRecallContent = function (messageId, msg) {
        if (msg && msg.messageType === 'TextMessage') {
            const mentionedInfo = msg.content.mentionedInfo;
            let atIdList = [];
            if (mentionedInfo) {
            // type==1 为 @all
                if (mentionedInfo.type === 1) {
                    atIdList = [0];
                } else {
                    atIdList = [].concat(mentionedInfo.userIdList);
                }
            }
            Cache.messageRecallEdit[messageId] = {
                recallTime: Date.now(),
                text: msg.content.content,
                atIdList,
            };
        }
    };
    Message.getRecallContent = function (messageId) {
        return Cache.messageRecallEdit[messageId];
    };

    /**
 * @params.conversationType
 * @params.targetId
 * @params.keyword
 * @params.timestamp ： 时间戳，默认 0
 * @params.count : 0-20
 * @params.total ：是否返回总数
 */
    Message.search = function (params, callback) {
        callback = callback || $.noop;
        const defer = $.Deferred();
        const _instance = RongIMClient.getInstance();
        const isGetTotle = 1;
        _instance.searchMessageByContent(
            params.conversationType,
            params.targetId,
            params.keyword,
            params.timestamp,
            params.count,
            isGetTotle,
            {
                onSuccess(msgList, matched) {
                    hackWebSDKMessage(msgList);
                    Message.addSendUserInfo(msgList, (errorCode, messageList) => {
                        callback(errorCode, messageList, matched);
                        defer.resolve({ list: messageList, count: matched });
                    });
                },
                onError(code) {
                    callback(code);
                },
            },
        );
        return defer.promise();
    };

    /**
 * @params.conversationType
 * @params.targetId
 * @params.messageIds // messageId 的数据，不是 messageUId
 * @params.notNotify  不更新会话列表 (在消息发送失败重新发送时先删除再重新发送，删除的更新-延后通知导致最后一条消息为上一条消息)
 */
    Message.removeLocal = function (params, callback) {
        callback = callback || $.noop;
        // saveRemovedEarliestMessageTime(params);
        RongIMClient.getInstance().deleteLocalMessages(params.conversationType, params.targetId, params.messageIds, {
            onSuccess(isRemove) {
                callback(null, isRemove);
                const key = getCacheKey(params);
                const list = Message._cache[key];
                params.messageIds.forEach((id) => {
                    spliceMessage(list, id);
                });
                if (!params.notNotify) {
                    conversationApi.observerList.notify();
                }
            },
            onError(code) {
                callback(code);
            },
        });
    };

    /**
     * @params.conversationType
     * @params.targetId
     * @params.messageIds // messageId 的数据，不是 messageUId
     */
    Message.clearMessages = function (params, callback) {
        callback = callback || $.noop;
        RongIMClient.getInstance().clearMessages(params.conversationType, params.targetId, {
            onSuccess(isClear) {
                callback(null, isClear);
                const key = getCacheKey(params);
                const list = Message._cache[key];
                if (list) list.length = 0;
            },
            onError(code) {
                callback(code);
            },
        });
    };

    /*
    向本地插入一条 Message

    params.conversationType
    params.targetId
    params.objectName
    params.content
    params.senderUserId
    params.direction
    params.sentStatus

    // 举例：取消文件消息内容
    params.content = {
        name:'core.js',
        type:'js',
        status: 0 // 0 取消
    }
*/
    Message.insertMessage = function (params, callback) {
        callback = callback || $.noop;
        if (utils.isEmpty(params.senderUserId)) {
            params.senderUserId = Cache.auth.id;
        }
        if (utils.isEmpty(params.objectName)) {
            params.objectName = RongIMClient.getMessageObjectName(params.messageType);
        }
        if (isNaN(params.direction)) {
            params.direction = RongIMLib.MessageDirection.SEND;
        }
        if (isNaN(params.sentStatus)) {
            params.sentStatus = RongIMLib.SentStatus.FAILED;
        }
        if (isNaN(params.receivedStatus)) {
            params.receivedStatus = RongIMLib.ReceivedStatus.READ;
        }
        RongIMClient.getInstance().insertMessage(+params.conversationType, params.targetId, params, {
            onSuccess(message) {
                const arg = {
                    messageId: message.messageId,
                };
                // patch web 端无 insertMessage 返回 message 中无 messageId messageDirection
                message.messageId = message.messageId || (`insert${RongIM.utils.createUid()}`);
                message.messageDirection = params.direction;
                if (message.messageDirection === RongIMLib.MessageDirection.SEND) {
                    const sentStatus = params.sentStatus;
                    arg.status = sentStatus;
                    Message.setMessageSentStatus(arg);
                } else {
                    const receivedStatus = params.receivedStatus;
                    arg.status = receivedStatus;
                    Message.setMessageReceivedStatus(arg);
                }
                // 这里返回消息没有 发送时间等重新调用接口获取一遍
                Message.getOne(message.messageId, (errorCode, msg) => {
                    if (errorCode) {
                        // eslint-disable-next-line no-console
                        console.warn('insertMessage', params, msg);
                        callback(errorCode);
                        return;
                    }
                    if (
                        msg.messageType === RongIMClient.MessageType.LocalFileMessage
                        || msg.messageType === RongIMClient.MessageType.SightMessage
                    ) {
                        msg.progress = params.progress || 0;
                        msg.uploadStatus = params.uploadStatus || UploadStatus.CANCELLED;
                        msg.content.status = 1;
                    }
                    // patch web 端无 getOne 方法(RongIMClient.getInstance().getMessage) 返回 msg 为空
                    msg = $.extend({}, message, msg);
                    Message._push(msg);
                    callback(null, msg);
                    conversationApi.observerList.notify();
                });
            // 插入消息 可能会创建新的会话需要重新调用接口获取不可直接使用内存
            // var conversation = Conversation.getLocalOne(params.conversationType, params.targetId);
            // if (conversation) {
            //     conversation.latestMessage = message;
            //     if (message.receivedStatus === RongIMLib.ReceivedStatus.UNREAD) {
            //         conversation.unreadMessageCount += 1;
            //     }
            //     var list = Conversation.getLocalList();
            //     converObserverList.notify(list);
            // }
            },
            onError(error) {
                callback(error);
            },
        });
    };

    /*
    messageId: 要替换的原消息Id
    content: 要替换的消息体
    objectName: 修改消息类型为
*/
    Message.setContent = function (message) {
        const objectName = message.objectName || '';
        const messageId = Number(message.messageId);
        const content = message.content;
        RongIMClient.getInstance().setMessageContent(messageId, content, objectName);
    };

    Message.watch = function (listener) {
        msgObserverList.add(listener);
    };

    Message.unwatch = function (listener) {
        msgObserverList.remove(listener);
    };
    const offlineMsgfinishObserverList = new ObserverList();
    Message.watchOfflineReceivefinish = function (listener) {
        offlineMsgfinishObserverList.add(listener);
    };
    Message.unwatchOfflineReceivefinish = function (listener) {
        offlineMsgfinishObserverList.remove(listener);
    };

    Message.registerMessage = function () {
        let messageName = 'PresenceNotificationMessage';
        let objectName = 'RCE:PresNtf';
        let messageTag = new RongIMLib.MessageTag(false, false);
        // windows, OSX, Web, iOS, Android
        /*
        type : 默认为 0, 0 表示在线状态，没有其他值，待后续扩展
        targetId： 被订阅人 Id
        title: Login_Status_PC 或 Login_Status_Mobile 或 Login_Status_Web
        value: online 或者 offline
        updateDt: 更新时间
        */
        let properties = ['type', 'targetId', 'title', 'value', 'updateDt'];
        RongIMClient.registerMessageType(messageName, objectName, messageTag, properties);

        // UpdateStatus
        messageName = 'RCEUpdateStatusMessage';
        objectName = 'RCE:UpdateStatus';
        messageTag = new RongIMLib.MessageTag(false, false);
        properties = ['uid', 'updateType', 'version'];
        RongIMClient.registerMessageType(messageName, objectName, messageTag, properties);

        // 帐号被禁用
        messageName = 'InactiveCommandMessage';
        objectName = 'RCE:InactiveCmd';
        messageTag = new RongIMLib.MessageTag(false, false);
        properties = ['userId'];
        RongIMClient.registerMessageType(messageName, objectName, messageTag, properties);

        // CardMessage
        messageName = 'CardMessage';
        objectName = 'RC:CardMsg';
        messageTag = new RongIMLib.MessageTag(true, true);
        properties = ['userId', 'name', 'portraitUri', 'sendUserId', 'sendUserName', 'extra', 'type'];
        RongIMClient.registerMessageType(messageName, objectName, messageTag, properties);

        // LocalFileMessage  uId唯一标识,用于文件上传的标识
        messageName = 'LocalFileMessage';
        objectName = 'LRC:fileMsg';
        messageTag = new RongIMLib.MessageTag(true, true);
        properties = ['type', 'name', 'localPath', 'status', 'uploadId'];
        RongIMClient.registerMessageType(messageName, objectName, messageTag, properties);

        // LocalImageMessage
        messageName = 'LocalImageMessage';
        objectName = 'LRC:imageMsg';
        messageTag = new RongIMLib.MessageTag(true, true);
        properties = ['localPath', 'status', 'content', 'imageUri'];
        RongIMClient.registerMessageType(messageName, objectName, messageTag, properties);

        // 小视频
        messageName = 'SightMessage';
        objectName = 'RC:SightMsg';
        messageTag = new RongIMLib.MessageTag(true, true);
        properties = ['content', 'sightUrl', 'duration', 'localPath', 'name', 'size'];
        RongIMClient.registerMessageType(messageName, objectName, messageTag, properties);

        // 位置共享
        messageName = 'RealTimeLocationStartMessage';
        objectName = 'RC:RLStart';
        messageTag = new RongIMLib.MessageTag(false, true);
        properties = ['content', 'extra'];
        RongIMClient.registerMessageType(messageName, objectName, messageTag, properties);

        messageName = 'KickoffMsg';
        objectName = 'RCE:KickoffMsg';
        messageTag = new RongIMLib.MessageTag(false, false);
        properties = ['content'];
        RongIMClient.registerMessageType(messageName, objectName, messageTag, properties);

        messageName = 'RealTimeLocationQuitMessage';
        objectName = 'RC:RLQuit';
        messageTag = new RongIMLib.MessageTag(false, false);
        properties = ['content', 'extra'];
        RongIMClient.registerMessageType(messageName, objectName, messageTag, properties);

        messageName = 'RealTimeLocationJoinMessage';
        objectName = 'RC:RLJoin';
        messageTag = new RongIMLib.MessageTag(false, false);
        properties = ['content', 'extra'];
        RongIMClient.registerMessageType(messageName, objectName, messageTag, properties);

        messageName = 'RealTimeLocationStatusMessage';
        objectName = 'RC:RL';
        messageTag = new RongIMLib.MessageTag(false, false);
        properties = ['latitude', 'longitude'];
        RongIMClient.registerMessageType(messageName, objectName, messageTag, properties);

        // 音视频会话总结 SummaryMessage 插入有问题新自定义了一种消息
        messageName = 'VideoSummaryMessage';
        objectName = 'RC:VideoSummary';
        messageTag = new RongIMLib.MessageTag(true, true);
        properties = ['caller', 'inviter', 'mediaType', 'memberIdList', 'startTime', 'duration', 'status'];
        RongIMClient.registerMessageType(messageName, objectName, messageTag, properties);

        // 会议状态更新消息
        messageName = 'ConferenceUpdateMessage';
        objectName = 'RCE:CnfStatus';
        messageTag = new RongIMLib.MessageTag(false, false);
        properties = [
            'type', 'call_id', 'end_reason', 'initiator', 'participantIds',
            'participantNumbers', 'summaryGroupId', 'summaryGroupName',
        ];
        RongIMClient.registerMessageType(messageName, objectName, messageTag, properties);

        // 会议参与者状态更新消息
        messageName = 'ConferenceParticipantUpdateMessage';
        objectName = 'RCE:CnfPartStatus';
        messageTag = new RongIMLib.MessageTag(false, false);
        properties = ['status', 'call_id', 'participantId', 'participantNumber'];
        RongIMClient.registerMessageType(messageName, objectName, messageTag, properties);

        // 会议ping消息
        messageName = 'ConferencePingMessage';
        objectName = 'RCE:CnfPing';
        messageTag = new RongIMLib.MessageTag(false, false);
        properties = ['call_id', 'participantIds', 'participantNumbers'];
        RongIMClient.registerMessageType(messageName, objectName, messageTag, properties);

        // 审批通知
        // 'applyType': 1.外出审批
        // 'status': 1.审批中；2.审批通过；3.审批拒绝
        messageName = 'ApprovalMessage';
        objectName = 'RCE:ApprovalMsg';
        messageTag = new RongIMLib.MessageTag(true, true);
        properties = ['title', 'url', 'userId', 'content', 'applyType', 'startTime', 'endTime', 'status', 'extra'];
        RongIMClient.registerMessageType(messageName, objectName, messageTag, properties);


        // PC 暂时屏蔽朋友圈消息
        // // 朋友圈 有人评论或点赞
        // messageName = 'MomentsCommentMessage';
        // objectName = 'RC:MomentsComment';
        // messageTag = new RongIMLib.MessageTag(true, true);
        // properties = ['content'];
        // RongIMClient.registerMessageType(messageName, objectName, messageTag, properties);

        // // 朋友圈 有人提到你
        // messageName = 'MomentsMentionMessage';
        // objectName = 'RC:MomentsMention';
        // messageTag = new RongIMLib.MessageTag(true, true);
        // properties = ['content'];
        // RongIMClient.registerMessageType(messageName, objectName, messageTag, properties);

        // // 朋友圈 有更新
        // messageName = 'MomentsUpdateMessage';
        // objectName = 'RC:MomentsUpdate';
        // messageTag = new RongIMLib.MessageTag(true, true);
        // properties = ['content'];
        // RongIMClient.registerMessageType(messageName, objectName, messageTag, properties);

        // 锁屏消息
        messageName = 'MultiClientMessage';
        objectName = 'RCE:MultiClient';
        messageTag = new RongIMLib.MessageTag(false, false);
        properties = ['action', 'platform'];
        RongIMClient.registerMessageType(messageName, objectName, messageTag, properties);

        // 设备锁定消息
        messageName = 'DeviMonitorMessage';
        objectName = 'RCE:DeviMonitor';
        messageTag = new RongIMLib.MessageTag(false, false);
        properties = ['action', 'device_id'];
        RongIMClient.registerMessageType(messageName, objectName, messageTag, properties);

        // 公众号点击菜单消息
        messageName = 'ClickMenuMessage';
        objectName = 'RC:PSCmd';
        messageTag = new RongIMLib.MessageTag(false, false);
        properties = ['cmd', 'id', 'type', 'name', 'data'];
        RongIMClient.registerMessageType(messageName, objectName, messageTag, properties);

        // 公众号关闭消息
        messageName = 'AppNotifyMessage';
        objectName = 'RCE:AppNotify';
        messageTag = new RongIMLib.MessageTag(false, false);
        properties = ['id', 'cmd_type', 'content'];
        RongIMClient.registerMessageType(messageName, objectName, messageTag, properties);

        // 引用消息
        messageName = 'ReferenceMessage';
        objectName = 'RCE:ReferenceMsg';
        messageTag = new RongIMLib.MessageTag(true, true);
        properties = ['content', 'objName', 'text', 'userId'];
        RongIMClient.registerMessageType(messageName, objectName, messageTag, properties);

        // 外部联系人转内部员工通知消息
        messageName = 'UserTypeChangedMessage';
        objectName = 'RCE:UserTypeChanged';
        messageTag = new RongIMLib.MessageTag(false, false);
        properties = ['company_name'];
        RongIMClient.registerMessageType(messageName, objectName, messageTag, properties);

        // 密聊消息
        messageName = 'EncryptedMessage';
        objectName = 'RC:EncryptedMsg';
        messageTag = new RongIMLib.MessageTag(false, false);
        properties = ['message'];
        RongIMClient.registerMessageType(messageName, objectName, messageTag, properties);

        messageName = 'EncryptRequestMessage';
        objectName = 'RC:EncryptRequestMsg';
        messageTag = new RongIMLib.MessageTag(false, false);
        properties = ['message'];
        RongIMClient.registerMessageType(messageName, objectName, messageTag, properties);

        messageName = 'EncryptResponseMessage';
        objectName = 'RC:EncryptResponseMsg';
        messageTag = new RongIMLib.MessageTag(false, false);
        properties = ['message'];
        RongIMClient.registerMessageType(messageName, objectName, messageTag, properties);

        messageName = 'EncryptConfirmMessage';
        objectName = 'RC:EncryptConfirmMsg';
        messageTag = new RongIMLib.MessageTag(false, false);
        properties = ['message'];
        RongIMClient.registerMessageType(messageName, objectName, messageTag, properties);

        messageName = 'EncryptCancelMessage';
        objectName = 'RC:EncryptCancelMsg';
        messageTag = new RongIMLib.MessageTag(false, false);
        properties = ['message'];
        RongIMClient.registerMessageType(messageName, objectName, messageTag, properties);

        messageName = 'EncryptTerminateMessage';
        objectName = 'RC:EncryptTerminateMsg';
        messageTag = new RongIMLib.MessageTag(false, false);
        properties = ['message'];
        RongIMClient.registerMessageType(messageName, objectName, messageTag, properties);

        messageName = 'SCBurnTimeMessage';
        objectName = 'RCE:SCBurnTimeMsg';
        messageTag = new RongIMLib.MessageTag(false, false);
        properties = ['message'];
        RongIMClient.registerMessageType(messageName, objectName, messageTag, properties);

        messageName = 'BurnNoticeMessage';
        objectName = 'RC:BurnNoticeMsg';
        messageTag = new RongIMLib.MessageTag(false, false);
        properties = ['message'];
        RongIMClient.registerMessageType(messageName, objectName, messageTag, properties);
        // 密聊消息 End

        // Gif 图片消息
        // messageName = RongIMLib.RongIMClient.MessageType.GIFMessage;
        // objectName = 'RC:GIFMsg';
        // messageTag = new RongIMLib.MessageTag(true, true);
        // properties = ['content'];
        // RongIMClient.registerMessageType(messageName, objectName, messageTag, properties);

        // 红包消息
        // messageName = 'JrmfRedPacketMessage';
        // objectName = 'RCJrmf:RpMsg';
        // messageTag = new RongIMLib.MessageTag(true, true);
        // /*
        // content         消息文本内容
        // Bribery_ID      红包id
        // Bribery_Name    红包名称
        // Bribery_Message 红包描述
        // */
        // properties = ['content', 'Bribery_ID', 'Bribery_Name', 'Bribery_Message'];
        // RongIMClient.registerMessageType(messageName, objectName, messageTag, properties);

        // // 打开红包消息
        // messageName = 'JrmfRedPacketOpenedMessage';
        // objectName = 'RCJrmf:RpOpendMsg';
        // messageTag = new RongIMLib.MessageTag(true, true);
        // /*
        // sendPacketId    红包发送者id
        // sendNickName    发送者昵称
        // openPacketId    打开红包者id
        // packetId        红包id
        // isGetDone       是否为最后一个红包 1 是最后一个，0不是
        // openNickName    打开红包者昵称
        // */
        // properties = ['sendPacketId', 'sendNickName', 'openPacketId', 'packetId', 'isGetDone', 'openNickName'];
        // RongIMClient.registerMessageType(messageName, objectName, messageTag, properties);

        // // 公众号图文消息
        // messageName = 'PSImageTextMessage';
        // objectName = 'RC:PSImgTxtMsg';
        // messageTag = new RongIMLib.MessageTag(true, true);
        // properties = ['articles'];
        // RongIMClient.registerMessageType(messageName, objectName, messageTag, properties);

        // // 公众号多图文消息
        // messageName = 'PSMultiImageTextMessage';
        // objectName = 'RC:PSMultiImgTxtMsg';
        // messageTag = new RongIMLib.MessageTag(true, true);
        // properties = ['articles'];
        // RongIMClient.registerMessageType(messageName, objectName, messageTag, properties);
        apiList.forEach((api) => {
            if (typeof api.registerMessage === 'function') {
                api.registerMessage();
            }
        });
    };

    function bindResponseToMessage(message, list) {
        if (list) {
            const userId = Cache.auth.id;
            const messageUIds = message.content.receiptMessageDic[userId] || [];
            for (let i = 0, len = list.length; i < len; i += 1) {
                const cacheMessage = list[i];
                if (messageUIds.indexOf(cacheMessage.messageUId) !== -1) {
                    const receiptArr = cacheMessage.receiptResponse = cacheMessage.receiptResponse || [];
                    if (receiptArr.indexOf(message.senderUserId) === -1) {
                        receiptArr.push(message.senderUserId);
                    }
                }
            }

            messageUIds.forEach((uid) => {
                const key = getStoreKey(`res_${uid}`);
                const receipt = store.get(key) || [];
                if (receipt.indexOf(message.senderUserId) === -1) {
                    receipt.push(message.senderUserId);
                    store.set(key, receipt);
                }
            });
        } else {
            const reskey = getStoreKey(`res_${message.messageUId}`);
            message.receiptResponse = store.get(reskey);
        }
    }

    Message.getTypes = function () {
        const type = RongIMClient.MessageType;
        const msgTypes = [
            type.TextMessage,
            type.ImageMessage,
            type.FileMessage,
            type.VoiceMessage,
            type.CardMessage,
            type.LocationMessage,
            type.SightMessage,
        ];
        return msgTypes;
    };
    /*
    params.messageType
    params.content
 */
    Message.create = function (params) {
        const messageType = params.messageType;
        const content = params.content;

        // 引用类型需要创建RCE:ReferenceMsg类型消息
        // 解决bug 41600 【转发】转发引用图片的消息，在手机端显示成乱码
        if (messageType === RongIMClient.MessageType.ReferenceMessage) {
            return RongIMClient.RegisterMessage.ReferenceMessage(content);
        }

        const TMessage = RongIMLib[messageType] || RongIMClient.RegisterMessage[messageType];
        if (!TMessage) {
            throw new Error(`unknown message type! params => ${JSON.stringify(params)}`);
        }

        return new TMessage(content);
    };

    Message.addForwardFaildMessage = function (message) {
        const im = RongIM.instance;
        const loginUser = im.loginUser;
        const groupId = message.targetId;
        const group = Cache.group[groupId];
        const adminId = group.admin_id;
        const admin = Cache.user[adminId];
        const conversationList = Cache.conversation.list || [];
        const messageType = 'GroupNotifyMessage';
        const params = {
            targetId: message.targetId,
            conversationType: message.conversationType,
            objectName: 'RCE:GrpNtfy',
            messageType,
            senderUserId: message.senderUserId,
            sentStatus: RongIMLib.SentStatus.SENT,
            content: {
                action: 23,
                operatorUser: {
                    id: adminId,
                    name: admin.name,
                },
                targetGroup: {
                    id: message.targetId,
                    name: group.name,
                },
                targetUsers: [{
                    id: loginUser.id,
                    name: loginUser.name,
                }],
                messageName: messageType,
            },
        };
        Message.insertMessage(params, (err, msg) => {
            if (!err) {
                conversationList.forEach((item) => {
                    if (item.targetId === msg.targetId) {
                        item.latestMessage = msg;
                    }
                });
            }
        });
    };

    function clearUnreadCountByTimestamp(conversationType, targetId, timestamp, callback) {
        callback = callback || $.noop;
        if (!isAvailableData()) {
            const status = getCurrentConnectionStatus();
            const errorCode = `status-${status}`;
            callback(errorCode);
            return;
        }
        const params = {
            conversationType,
            targetId,
            timestamp,
        };
        lib.clearUnreadCountByTimestamp(params, (error) => {
            if (error) {
                callback(getLibErrorCode(error));
                return;
            }
            if (PullMessageStatus.get()) {
                conversationApi.notifyConversation('notifyConversation：3号');
            }
            callback();
        });
    }

    Message.setMessageListener = function () {
    // var notifyConversation = RongIM.utils.throttle(debounceConversation, 600);
        const messageCtrol = {
        // 音视频
            AcceptMessage() {
            // utils.console.info('TODO: 此消息需要处理', arguments);
            },
            RingingMessage() {
            // utils.console.info('TODO: 此消息需要处理', arguments);
            },
            SummaryMessage() {
            // utils.console.info('TODO: 此消息需要处理', arguments);
            },
            HungupMessage() {
                $.noop();
            },
            // RCE Server 订阅状态通知,此条消息在应用层，im.js中处理
            PresenceNotificationMessage(message) {
                if (message.offLineMessage) {
                    return;
                }
                msgObserverList.notify(message);
            },
            InviteMessage(message) {
                Message._push(message);
            },
            MediaModifyMessage() {
            // utils.console.info('TODO: 此消息需要处理', arguments);
            },
            MemberModifyMessage() {
            // utils.console.info('TODO: 此消息需要处理', arguments);
            },
            DeviMonitorMessage(message) {
                if (message.offLineMessage) {
                    return;
                }
                msgObserverList.notify(message);
            },
            // 资料通知消息
            ProfileNotificationMessage(/* message */) {
            // utils.console.info('TODO: 此消息需要处理', message);
            },
            // 命令通知
            CommandMessage(/* message */) {
            // utils.console.info('TODO: 此消息需要处理', message);
            },
            // RCE Server
            RCEUpdateStatusMessage: updateStatusMessageHandle,
            InactiveCommandMessage(message) {
                if (message.offLineMessage) {
                    return;
                }
                accountApi.observerList.notify(10111);
            },
            TypingStatusMessage(/* message */) {
            // utils.console.info('TODO: 此消息需要处理', message);
            },
            // 同步已读状态
            SyncReadStatusMessage(message) {
                clearUnreadCountByTimestamp(message.conversationType, message.targetId, message.content.lastMessageSendTime, () => {});
            },
            // 撤回消息
            RecallCommandMessage(message) {
                const messageUId = message.content.messageUId;
                Message.getOne(messageUId, (errorCode, msg) => {
                    if (errorCode) {
                        return;
                    }
                    if (message.content.isDelete) {
                        Message.removeLocal({
                            targetId: msg.targetId,
                            conversationType: msg.conversationType,
                            messageIds: [msg.messageId],
                        });
                    } else {
                        const messageId = msg.messageId || messageUId;
                        const direction = RongIMLib.MessageDirection;
                        const content = message.messageDirection === direction.SEND ? message.content : message;
                        const key = getCacheKey(content);
                        const list = Message._cache[key];
                        if (list) {
                            message.messageId = messageId;
                            message.sentTime = msg.sentTime;
                            spliceMessage(list, messageId, message);
                        }
                        const objectName = RongIMClient.getMessageObjectName(message.messageType);
                        RongIMClient.getInstance().setMessageContent(messageId, message.content, objectName);

                        RongIMClient.getInstance().setMessageReceivedStatus(messageId, RongIMLib.ReceivedStatus.READ, {
                            onSuccess() {
                            },
                            onError(error) {
                                utils.console.info('RecallCommandMessage-setMessageSentStatus', error);
                            },
                        });
                    }
                    const delMentionedInfo = function (_msg) {
                        const cacheKey = `rong_mentioneds_${Cache.auth.id}_${_msg.conversationType}_${_msg.targetId}`;
                        let mentioneds = localStorage.getItem(cacheKey);
                        if (mentioneds) {
                            mentioneds = JSON.parse(mentioneds);
                            const contentKey = `${_msg.conversationType}_${_msg.targetId}`;
                            if (mentioneds[contentKey].uid === _msg.content.messageUId) {
                                localStorage.removeItem(cacheKey);
                                localStorage.removeItem(`rong_cu${Cache.auth.id}${_msg.conversationType}${_msg.targetId}`);
                                conversationApi.getOne(_msg.conversationType, _msg.targetId, (error, conversation) => {
                                    if (error) {
                                        // eslint-disable-next-line no-console
                                        console.warn(getLibErrorCode(error));
                                        return;
                                    }
                                    conversation.mentionedMsg = null;
                                });
                            }
                        }
                    };
                    delMentionedInfo(message);

                    const lconv = conversationApi.getLocalOne(message.conversationType, message.targetId);
                    const isLastMessage = utils.isEmpty(lconv) || (lconv.lastMessage && lconv.lastMessage.messageId === msg.messageId);
                    if (!message.offLineMessage || isLastMessage) {
                        msgObserverList.notify(message);
                        conversationApi.notifyConversation('notifyConversation：4号');
                    }

                    imageViewer.recall(msg.messageUId || message.content.messageUId);
                });
            },
            // 私聊已读回执
            ReadReceiptMessage(message) {
                system.appLogger(
                    'info',
                    `收到已读回执消息  : ${JSON.stringify(message)}`,
                );
                const isReceive = message.messageDirection === RongIMLib.MessageDirection.RECEIVE;
                if (isReceive) {
                    Message.setMessageStatus(message);
                } else {
                    conversationApi.clearUnreadCount(message.conversationType, message.targetId, () => {});
                }
            },
            ReadReceiptRequestMessage(message) {
                const messageUId = message.content.messageUId;
                if (message.messageDirection === RongIMLib.MessageDirection.SEND) {
                // 多端同步的消息
                    const key = getStoreKey(`res_${messageUId}`);
                    store.set(key, []);
                    const msg = getCacheMessageByUId(message.conversationType, message.targetId, messageUId);
                    if (msg) {
                        if (message.offLineMessage) {
                            return;
                        }
                        // 34029 - 【文件消息】PC 端在群里发送的文件消息，移动端点击查看未读后，PC 端没有同步状态
                        Vue.set(msg, 'receiptResponse', []);
                        msgObserverList.notify(message);
                    }
                } else {
                    const storeKey = getStoreKey('req');
                    const conversationKey = generatorKey([message.conversationType, message.targetId]);

                    const data = store.get(storeKey) || {};
                    const ret = data[conversationKey] || {};
                    const uIds = ret.uIds || [];

                    uIds.push(messageUId);
                    const result = ret[message.senderUserId] || [];
                    ret[message.senderUserId] = result.concat(uIds);
                    data[conversationKey] = ret;

                    store.set(storeKey, data);
                    const type = message.conversationType;
                    const id = message.targetId;
                    const lconv = conversationApi.getLocalOne(type, id);
                    if (lconv) {
                        lconv.requestMsgs = ret;
                        if (lconv.unreadMessageCount === 0) {
                            Message.sendGroupResponse(type, id, ret);
                        }
                        if (message.offLineMessage) {
                            return;
                        }
                        const lconvList = conversationApi.getLocalList();
                        conversationApi.observerList.notify(lconvList);
                    }
                }
            },
            ReadReceiptResponseMessage(message) {
                const key = getCacheKey(message);
                const cacheList = Message._cache[key] = Message._cache[key] || [];
                bindResponseToMessage(message, cacheList);
            },
            RealTimeLocationJoinMessage() {
            },
            RealTimeLocationQuitMessage() {
            },
            RealTimeLocationStatusMessage() {
            },
            KickoffMsg(message) {
                if (message.offLineMessage) {
                    return;
                }
                // 判断消息有效性
                const authId = (RongIM.instance.auth || {}).id;
                const valid = message.senderUserId === authId;
                if (valid) {
                    const status = 'logout-by-otherclient';
                    statusApi.observerList.notify(status);
                }
            },
            ConferenceUpdateMessage(/* message */) {
            // utils.console.info('TODO: 此消息需要处理 ConferenceUpdateMessage', message);
            },
            ConferenceParticipantUpdateMessage(/* message */) {
            // utils.console.info('TODO: ConferenceParticipantUpdateMessage此消息需要处理', message);
            },
            ConferencePingMessage(/* message */) {
            // utils.console.info('TODO: ConferencePingMessage此消息需要处理', message);
            },
            GroupVerifyNotifyMessage(message) {
                groupApi.observerList.notify(message);
            },
            AppNotifyMessage(message) {
            // 公众号关闭通知消息
                if (message.offLineMessage) {
                    return;
                }
                msgObserverList.notify(message);
            },
            MultiClientMessage(message) {
            // 多端登陆，不处理离线消息
                if (message.offLineMessage) {
                    return;
                }
                // 增加判断消息有效性
                const serverConfig = getServerConfig();
                const deviceRobotId = serverConfig.device.device_manage_robot_id;
                if (message.targetId === deviceRobotId) {
                    msgObserverList.notify(message);
                }
            },
            RealTimeLocationStartMessage(message) {
                const params = {
                    conversation: message.conversationType,
                    targetId: message.targetId,
                    messageIds: [message.messageId],
                    notNotify: true,
                };
                Message.removeLocal(params, () => {
                    saveRemovedEarliestMessageTime(message);
                });
            },
            UserTypeChangedMessage(message) {
            // 外部联系人转内部员工通知消息
                if (message.offLineMessage) {
                    return;
                }
                msgObserverList.notify(message);
            },
            EncryptedMessage() {
            // 密聊消息，直接过滤
            },
            EncryptRequestMessage() {
            // 密聊消息，直接过滤
            },
            EncryptResponseMessage() {
            // 密聊消息，直接过滤
            },
            EncryptConfirmMessage() {
            // 密聊消息，直接过滤
            },
            EncryptCancelMessage() {
            // 密聊消息，直接过滤
            },
            EncryptTerminateMessage() {
            // 密聊消息，直接过滤
            },
            SCBurnTimeMessage() {
            // 密聊消息，直接过滤
            },
            BurnNoticeMessage() {
            // 密聊消息，直接过滤
            },
            otherMessage(message) {
                Message._push(message);
                if (isSameConversation(message) || PullMessageStatus.get()) {
                    msgObserverList.notify(message);
                }
            },
        };

        apiList.forEach((api) => {
            if (typeof api.messageCtrol === 'object') {
                $.extend(messageCtrol, api.messageCtrol);
            }
        });

        // var messageFilter = [
        //     'PresenceNotificationMessage',
        //     'SyncReadStatusMessage',
        //     'RecallCommandMessage',
        //     'ReadReceiptRequestMessage',
        //     'ReadReceiptResponseMessage',
        //     'ReadReceiptMessage'
        // ];

        const lastMessageFilter = [
            'GroupMemChangedNotifyMessage',
            'PinNotifyMessage',
            'PinCommentMessage',
            'PinConfirmMessage',
            'PinNewReciverMessage',
            'PinDeletedMessage',
            'PinCommentReadMessage',
            'PinConfirmMultiMessage',
        ];

        let messageObserList = {};
        let isNotifyConvers = false;
        const receiveMessage = function (message, leftCount, hasMore) {
            if (RongIMClient._voipProvider.isVoipMessage && RongIMClient._voipProvider.isVoipMessage(message)) {
                RongIMClient._voipProvider.onReceived(message);
                return;
            }

            if (message.content.burnDuration) {
                const deleteParams = {
                    conversationType: message.conversationType,
                    targetId: message.targetId,
                    messageIds: [message.messageId],
                    notNotify: false,
                };
                Message.removeLocal(deleteParams);
                return;
            }

            // 撤回消息偶尔未同步增加日志记录撤回消息
            if (message.messageType === 'RecallCommandMessage') {
                RongIM.system.appLogger('info', `[ReceiveMessage][RecallCommandMessage]${JSON.stringify(message)}`);
            }

            RongIM.messageTotal += 1;
            const isHandler = !hasMore;
            PullMessageStatus.set(isHandler);
            // 接收离线消息中接收完给出通知
            const offlineMessageReceiving = !isHandler;
            if (RongIM.offlineMessageReceiving !== offlineMessageReceiving) {
                RongIM.offlineMessageReceiving = offlineMessageReceiving;
                if (!RongIM.offlineMessageReceiving) {
                    offlineMsgfinishObserverList.notify();
                }
            }

            // var isCommandMsg = messageFilter.indexOf(message.messageType) >= 0;
            const isLastOpeMsg = lastMessageFilter.indexOf(message.messageType) >= 0;
            const presence = messageCtrol[message.messageType];
            // 群通知专门处理
            const isNotifyGroupMsg = groupApi.getNotifyGroupMsg(message);
            if (!presence || isNotifyGroupMsg) {
                isNotifyConvers = true;
            }
            if (isLastOpeMsg) {
                const isGroupMessage = message.messageType === 'GroupMemChangedNotifyMessage';
                let key = `${message.messageType}-${message.targetId}`;
                if (isGroupMessage) {
                    Message._push(message);
                }
                if (!isGroupMessage) {
                    key = `${message.messageType}-targetId`;
                }
                messageObserList[key] = message;
            } else {
                handleMessage(message);
            }

            if (isHandler) {
                if (!$.isEmptyObject(messageObserList)) {
                    Object.keys(messageObserList).forEach((item) => {
                        handleMessage(messageObserList[item]);
                    });
                    messageObserList = {};
                }
                if (isNotifyConvers) {
                    conversationApi.notifyConversation(null, {
                        receiveMessage: true, // 标识是收到消息触发的notify
                        message,
                    });
                    isNotifyConvers = false;
                }
            }
        };

        // 实际处理方法
        function handleMessage(message) {
        // C++ SDK offLineMessage 标识不准确根据连接返回服务时间和消息发送时间对比判断
        // C++ SDK 已修复屏蔽此行代码 (connect 连接成功为异步先触发接收消息 connectedTime 为 0)
        // message.offLineMessage = message.sentTime < RongIM.instance.connectedTime;
            hackWebSDKMessage(message);
            const notLogin = $.isEmptyObject(Cache.auth) || $.isEmptyObject(Cache.auth.id);
            if (notLogin) {
                return;
            }
            // Web SDK patch 多端同步收到自己发的消息 设置发送状态为发送成功
            if (!message.offLineMessage && message.senderUserId === Cache.auth.id) {
                message.sentStatus = RongIMLib.SentStatus.SENT;
            }
            const messageType = message.messageType;
            const presence = messageCtrol[messageType];
            if (presence) presence(message); else messageCtrol.otherMessage(message);
        }

        RongIMClient.setOnReceiveMessageListener({
            onReceived: receiveMessage,
        });
    };

    function messageUnexist(message, list) {
        const messageUId = message.messageUId;
        if (typeof messageUId === 'undefined') {
            return true;
        }

        const arr = list.filter(item => item.messageUId === messageUId);
        return arr.length === 0;
    }

    // 删除本地存储的消息
    Message.ClearData = function () {
        RongIMClient.getInstance().clearData();
    };

    RongIM.dataModel.Message = Message;
};
