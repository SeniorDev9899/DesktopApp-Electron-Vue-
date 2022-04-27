/* eslint-disable no-param-reassign */
/* eslint-disable no-underscore-dangle */
/* eslint-disable func-names */
import isAvailableData from '../isAvailableData';
import appCache, { Type as APP_CACHE } from '../cache/app';
import browserWindow from '../browserWindow';

export default (RongIM) => {
    const Http = RongIM.dataModel._Http;
    const Cache = RongIM.dataModel._Cache;
    const ObserverList = RongIM.dataModel._ObserverList;
    const util = RongIM.dataModel.util;
    const store = RongIM.utils.cache;
    const generatorKey = util.generatorKey;
    const getStoreKey = util.getStoreKey;
    const getLibErrorCode = util.getLibErrorCode;
    const utils = RongIM.utils;

    let getCurrentConnectionStatus;

    let groupApi = null;
    let userApi = null;
    let friendApi = null;
    let messageApi = null;
    let statusApi = null;

    const Conversation = {
        isPullMessageFinished: true,
        draft: {},
        observerList: new ObserverList(),
        active: {
            conversationType: 0,
            targetId: '',
        },
    };

    const converObserverList = Conversation.observerList;

    Cache.conversation = {
        searchTempList: [],
    };

    Conversation.cleanCache = function () {
        Cache.conversation = {
            searchTempList: [],
        };
        Conversation.draft = {};
    };

    Conversation.clearMessages = function (conversationType, targetId) {
        const params = {
            conversationType,
            targetId,
        };
        messageApi.clearMessages(params, () => {
            // 删除成功
            console.log('clearMessage result:ok------------');
        });
    };

    Conversation.loadApi = function () {
        const dataModel = RongIM.dataModel;
        groupApi = dataModel.Group;
        userApi = dataModel.User;
        friendApi = dataModel.Friend;
        messageApi = dataModel.Message;
        statusApi = dataModel.Status;
        getCurrentConnectionStatus = statusApi.getCurrentConnectionStatus;
    };

    function isGroup(conversationType) {
        return +conversationType === 3;
    }

    function debounceConversation(...args) {
        converObserverList.notify(...args);
    }

    /*
    获取置顶的会话
 */
    const getTopListFromRemote = function (callback) {
        const data = Cache.conversation;
        if (data.isSetting) {
            const settings = data.settings;
            callback(null, settings);
            return;
        }
        if (data._defer) {
            data._defer
                .done((result) => {
                    callback(null, result);
                })
                .fail(callback);
            return;
        }
        data._defer = $.Deferred();
        Http.get('/conversation')
            .done((result) => {
                const conversationSettings = result.settings;
                data.settings = conversationSettings;
                data.isSetting = true;

                callback(null, conversationSettings);
                data._defer.resolve(conversationSettings);
            })
            .fail((error) => {
                callback(error);
                data._defer.reject(error);
            });
    };

    // 判断 source 与 target 是否是同一会话
    const checkConversation = function (source, target) {
        return (
            +source.conversation_type === +target.conversationType
            && source.target_id === target.targetId
        );
    };

    const delDuplicate = function (arr) {
        return arr.reduce(
            (p, c) => {
                // create an identifying id from the object values
                const id = [c.conversation_type, c.target_id].join('|');

                // if the id is not found in the temp array
                // add the object to the output array
                // and add the key to the temp array
                if (p.temp.indexOf(id) === -1) {
                    p.out.push(c);
                    p.temp.push(id);
                }
                return p;

                // return the deduped array
            }, {
                temp: [],
                out: [],
            },
        ).out;
    };

    /*
    1. 取出置顶会话
    2. 将置顶会话合并到会话中
    3. 会话排序
*/
    function splitTopConversation(list, callback) {
        // 1、获取置顶数组 √
        // 2、匹配会话列表 List √
        // 3、按 sentTime 排序置顶 √
        // 4、追加到 list 中，保证操作的是同一个对象 √
        const tempList = [];

        const mergeConversation = function (topList) {
            if (util.isArray(topList)) {
                const idxs = [];
                for (let i = 0; i < topList.length; i += 1) {
                    const topConversation = topList[i];
                    for (let j = 0; j < list.length; j += 1) {
                        const conversation = list[j];
                        if (checkConversation(topConversation, conversation)) {
                            conversation.isTop = topConversation.top;
                            conversation.notificationStatus = topConversation.not_disturb;
                            if (conversation.isTop) {
                                idxs.push(j);
                                tempList.push(conversation);
                            }
                        }
                    }
                }

                idxs.sort((a, b) => b - a);
                for (let k = 0; k < idxs.length; k += 1) {
                    list.splice(idxs[k], 1);
                }
            }
        };

        const buildConversationList = function (result) {
            mergeConversation(result);
            tempList.sort((a, b) => b.sentTime - a.sentTime);
            tempList.reverse();
            // TODO 暂时做法，后期会话列表统一优化
            list.sort((a, b) => b.sentTime - a.sentTime);
            for (let i = 0, len = tempList.length; i < len; i += 1) {
                list.unshift(tempList[i]);
            }
            callback([].concat(list));
        };

        getTopListFromRemote((errorCode, result) => {
            if (errorCode) {
                utils.console.warn(errorCode);
                // callback(errorCode);
                return;
            }
            // utils.console.info(result);
            // 服务端 toplist 有重复,需加入排重
            const _list = delDuplicate(result);
            if (!Cache.conversation.topList) {
                Cache.conversation.topList = _list;
            }
            buildConversationList(Cache.conversation.topList);
        });
    }
    Conversation.splitTopConversation = splitTopConversation;

    // 会话列表分页，置顶会话缺失，获取缺失的会话
    function getOtherTopList(list, callback) {
        const _list = [];
        let tempIdList = [];
        tempIdList = list.map(con => con.targetId + con.conversationType);
        console.info('获取置顶列表----开始');
        getTopListFromRemote((errorCode, result) => {
            console.info('获取置顶列表----结束', errorCode);
            if (errorCode) {
                utils.console.warn(errorCode);
                return;
            }
            // utils.console.info(result);
            // 服务端 toplist 有重复,需加入排重
            const _result = delDuplicate(result);

            const allTopList = _result.filter(con => con.top);
            const otherTopList = allTopList.filter(
                con => tempIdList.indexOf(con.target_id + con.conversation_type)
                    < 0,
            );
            if (otherTopList.length === 0) {
                callback(null, []);
                return;
            }
            console.info(
                'otherTopList foreach  Conversation.getOneWithoutInfo----开始',
            );
            const promiseList = [];
            const deferList = [];
            for (let i = 0; i < otherTopList.length; i += 1) {
                const defer = $.Deferred();
                const promise = defer.promise();
                deferList.push(defer);
                promiseList.push(promise);
            }
            otherTopList.forEach((con, index) => {
                Conversation.getOneWithoutInfo(
                    con.conversation_type,
                    con.target_id,
                    (error, conversation) => {
                        if (error) {
                            utils.console.warn(error);
                            deferList[index].reject(error);
                            return;
                        }
                        // 38849 - 【会话列表】老帐号进行登录，会话列表一直在loading中
                        if (conversation && conversation.latestMessage) {
                            _list.push(conversation);
                        }
                        deferList[index].resolve();
                    },
                );
            });
            $.when
                .apply(null, promiseList)
                .done(() => {
                    console.info(
                        'otherTopList foreach all  Conversation.getOneWithoutInfo----完成',
                    );
                    callback(null, _list);
                })
                .fail((error) => {
                    console.info(
                        'otherTopList foreach all  Conversation.getOneWithoutInfo----失败',
                        error,
                    );
                    callback(error);
                });
        });
    }

    function addConversationUserInfo(list, callback) {
        callback = callback || $.noop;
        const ConversationType = RongIMLib.ConversationType;
        const isGroupConversation = function (item) {
            return item.conversationType === ConversationType.GROUP;
        };
        const isUser = function (item) {
            return (
                item.conversationType === ConversationType.PRIVATE
                || item.conversationType === ConversationType.SYSTEM
            );
        };
        const isPublic = function (item) {
            return (
                item.conversationType === ConversationType.APP_PUBLIC_SERVICE
            );
        };

        const bindInfo = function () {
            const addMessageUserInfo = function (latestMessage, groupAlias) {
                if (!latestMessage) return;
                messageApi.fixSendMessageBug(latestMessage);
                const senderUserId = latestMessage.senderUserId;
                userApi.get(senderUserId, (errorCode, user) => {
                    if (errorCode) {
                        utils.console.warn(
                            `获取用户信息失败（错误码：${errorCode}）`,
                        );
                        latestMessage.user = {};
                    } else if (groupAlias) {
                        const _user = $.extend({}, user);
                        _user.groupAlias = groupAlias;
                        latestMessage.user = _user;
                    } else {
                        latestMessage.user = user;
                    }
                });
            };

            list.forEach((item) => {
                if (isGroupConversation(item)) {
                    item.group = {};
                    groupApi.getOne(item.targetId, (errorCode, group) => {
                        if (errorCode) {
                            utils.console.warn(
                                `获取群组信息失败, groupId=${item.targetId}（错误码：${errorCode}）`,
                            );
                            groupApi.getOne(
                                item.targetId,
                                (_errorCode, _group) => {
                                    if (_errorCode) {
                                        utils.console.warn(
                                            `获取群组信息失败, groupId=${item.targetId}（错误码：${_errorCode}）`,
                                        );
                                    } else {
                                        item.group = _group;
                                        let groupAlias = '';
                                        if (
                                            _group.members
                                            && item.latestMessage
                                        ) {
                                            groupAlias = groupApi.getGroupAlias(
                                                item.latestMessage.senderUserId,
                                                _group.members,
                                            );
                                        }
                                        addMessageUserInfo(
                                            item.latestMessage,
                                            groupAlias,
                                        );
                                    }
                                },
                            );
                        } else {
                            item.group = group;
                            let groupAlias = '';
                            if (group.members && item.latestMessage) {
                                groupAlias = groupApi.getGroupAlias(
                                    item.latestMessage.senderUserId,
                                    group.members,
                                );
                            }
                            addMessageUserInfo(item.latestMessage, groupAlias);
                        }
                    });
                } else if (isUser(item) || isPublic(item)) {
                    if (friendApi.isFileHelper(item.targetId)) {
                        item.user = friendApi.getFileHelper();
                    } else {
                        item.user = {};
                    }
                    const userId = item.targetId;
                    userApi.get(userId, (errorCode, user) => {
                        if (errorCode) {
                            utils.console.warn(
                                `获取用户信息失败, userId=${userId}(错误码：${errorCode})`,
                            );
                            userApi.get(userId, (_errorCode, _user) => {
                                if (_errorCode) {
                                    utils.console.warn(
                                        `获取用户信息失败, userId=${userId}(错误码：${_errorCode})`,
                                    );
                                } else {
                                    item.user = _user;
                                }
                                if (!_user) {
                                    Conversation.remove(
                                        item.conversationType,
                                        item.targetId,
                                    );
                                    // TODO: 确定是否是要做过滤，若是需修改算法，不要 forEach
                                    list.forEach((conv, index) => {
                                        if (util.sameConversation(item, conv)) {
                                            list.splice(index, 1);
                                        }
                                    });
                                }
                                addMessageUserInfo(item.latestMessage);
                            });
                        } else {
                            item.user = user;
                            if (!user) {
                                Conversation.remove(
                                    item.conversationType,
                                    item.targetId,
                                );
                                // TODO: 确认是否是要过滤，如果是要过滤，不要用 forEach
                                list.forEach((conv, index) => {
                                    if (util.sameConversation(item, conv)) {
                                        list.splice(index, 1);
                                    }
                                });
                            }
                            addMessageUserInfo(item.latestMessage);
                        }
                    });
                }
            });
            const error = null;
            callback(error, list);
        };

        const getIds = function (items) {
            return items.map(item => item.targetId);
        };

        const groups = list.filter(isGroupConversation);
        const groupIds = getIds(groups);

        const users = list.filter(isUser);
        let userIds = getIds(users);

        const senderIds = list.map(item => (item.latestMessage ? item.latestMessage.senderUserId : ''));
        userIds = userIds.concat(senderIds);
        const unique = function (arr) {
            const tmp = {};
            return arr.filter((item) => {
                if (tmp[item]) {
                    return false;
                }
                tmp[item] = true;
                return true;
            });
        };
        userIds = unique(userIds);

        $.when(
            groupApi.getBatchGroups(groupIds),
            userApi.getUsers(userIds),
        ).then(() => {
            bindInfo();
        });
    }

    // 监听置顶和免打扰状态的变化
    const initConversationStatusListener = () => {
        const params = {
            // status 标识当前监听到的会话状态
            onChanged(status) {
                const {
                    conversationType, targetId, notificationStatus, isTop,
                } = status[0];
                const top = isTop ? 1 : 0;
                topToggleCallback(conversationType, targetId, top)();
                muteToggleCallback(conversationType, targetId, notificationStatus)();
            },
        };
        RongIMClient.setConversationStatusListener(params);
    };

    /**
     * @params.count 返回 count 个会话;如果会话总数 total < count 则返回 total 个会话
     */
    const getInitConversationList = function (
        count,
        callback,
        callbackHasUserinfo,
    ) {
        callback = callback || $.noop;
        if (!Conversation.isPullMessageFinished) {
            return;
        }
        const switchFlag = Conversation.getTopAndMuteSwitch();
        //if (!switchFlag) {
        //    initConversationStatusListener();
        //}
        initConversationStatusListener();
        if (!isAvailableData()) {
            const status = getCurrentConnectionStatus();
            const errorCode = `status-${status}`;
            callback(errorCode);
            return;
        }
        const ConversationType = RongIMLib.ConversationType;
        // var isGroup = function (type) {
        //     return type === ConversationType.GROUP;
        // };
        // const isUser = function (type) {
        //     return type === ConversationType.PRIVATE;
        // };
        // const isPublic = function (type) {
        //     return type === ConversationType.APP_PUBLIC_SERVICE;
        // };
        const isSystem = function (type) {
            return type === ConversationType.SYSTEM;
        };
        console.info('调用sdk.getConversationsByPage接口----开始');
        RongIMClient.getInstance().callExtra(
            'getConversationsByPage', {
                onSuccess(list) {
                // eslint-disable-next-line array-callback-return
                    list.every((item) => {
                        item.latestMessage = item.latestMessage || {
                            messageType: 'TextMessage',
                            content: {
                                content: '',
                            },
                        };
                    });
                    console.info('调用sdk.getConversationsByPage接口----成功');
              
                    getOtherTopList(list, (error, _otherList) => {
                        // 排除系统会话，会话列表不显示系统会话(朋友圈的消息)
                        // list = list.filter(
                        //     item => !isSystem(item.conversationType),
                        // );
                        if (count > 0) {
                            list.length = list.length < count ? list.length : count;
                        }
                        list = list.concat(_otherList);
                        const searchList = Cache.conversation.searchTempList;
                        const searchObj = {};
                        const keys = [];

                        searchList.forEach((item) => {
                            const key = generatorKey([
                                item.conversationType,
                                item.targetId,
                            ]);
                            searchObj[key] = 1;
                        });
                        let index = 0;
                        const len = list.length;
                        if (len === 0) {
                            setInfo();
                        } else {
                            console.info('getInfo----------开始');
                            list.forEach((item) => {
                                messageApi.hackWebSDKMessage(
                                    item.latestMessage,
                                );
                                const type = item.conversationType;
                                const targetId = item.targetId;
                                const key = generatorKey([type, targetId]);
                                const has = key in searchObj;
                                if (has) {
                                    keys.push(key);
                                }
                                // 置顶和免打扰置为默认值 false, 然后从缓存中匹配置顶和免打扰设置
                                // 直接设置为false，会覆盖原有的值，设置false为默认值
                                if (switchFlag) {
                                    item.isTop = false;
                                    item.notificationStatus = false;
                                } else {
                                    item.isTop = item.isTop || false;
                                    item.notificationStatus = item.notificationStatus === 1;
                                }
                                // if (isUser(type) || isPublic(type)) {
                                //     if (friendApi.isFileHelper(targetId)) {
                                //         item.user = friendApi.getFileHelper();
                                //     } else {
                                //         item.user = Cache.user[targetId] || {};
                                //     }
                                // }

                                // const targetId = conversation.targetId;

                                const getInfo = isGroup(type)
                                    ? groupApi.getOne
                                    : userApi.getVisitors;
                                getInfo(targetId, done, true);

                                function done(errorCode, result) {
                                    index += 1;
                                    if (errorCode) {
                                        if (index === len) {
                                            console.info(
                                                'getInfo----------结束',
                                            );
                                            setInfo();
                                        }
                                        return;
                                    }
                                    Cache.user[result.id] = result;
                                    item.user = result;
                                    const message = item.latestMessage;
                                    if (message) {
                                        const senderUserId = message.senderUserId;
                                        const msgUser = Cache.user[senderUserId] || {};
                                        if (isGroup(type)) {
                                            item.group = Cache.group[targetId] || {};
                                            let groupAlias = '';
                                            if (item.group.members) {
                                                groupAlias = groupApi.getGroupAlias(
                                                    senderUserId,
                                                    item.group.members,
                                                );
                                            }
                                            const _user = $.extend({}, msgUser);
                                            _user.groupAlias = groupAlias;
                                            message.user = _user;
                                        } else {
                                            message.user = msgUser;
                                        }
                                    }
                                    item.draft = Conversation.getDraft(
                                        item.conversationType,
                                        item.targetId,
                                    );
                                    if (index === len) {
                                        console.info('getInfo----------结束');
                                        setInfo();
                                    }
                                }
                            });
                        }

                        function setInfo() {
                            searchList.forEach((item, itemIndex) => {
                                item.isTop = false;
                                item.notificationStatus = item.notificationStatus || false;
                                const type = item.conversationType;
                                const targetId = item.targetId;
                                keys.forEach((key) => {
                                    if (
                                        generatorKey([type, targetId]) === key
                                    ) {
                                        searchList.splice(itemIndex, 1);
                                    }
                                });
                                item.draft = Conversation.getDraft(
                                    item.conversationType,
                                    item.targetId,
                                );
                            });
                            list = searchList.concat(list);
                            console.info('splitTopConversation----------开始');
                            splitTopConversation(list, (result) => {
                                console.info(
                                    'splitTopConversation----------结束',
                                );
                                Cache.conversation.list = result;
                                bindConversationRequestMsgs(result);
                                console.info(
                                    'addConversationUserInfo----------开始',
                                );
                                addConversationUserInfo(
                                    result,
                                    callbackHasUserinfo,
                                );
                                console.info(
                                    'addConversationUserInfo----------结束',
                                );
                                callback(null, result);
                            });
                        }
                    });
                },
                onError(error) {
                    console.info(
                        '调用sdk.getConversationsByPage接口----失败',
                        error,
                    );
                    callback(getLibErrorCode(error));
                },
            },
            [1, 2, 3, 5, 6, 7, 8],
            0,
            count,
        );
    };

    // 返回全部会话
    const getConversationList = function (callback, callbackHasUserinfo) {
        callback = callback || $.noop;
        getInitConversationList(300, callback, callbackHasUserinfo);
    };

    // todo: bindConversationRequestMsgs 备注
    function bindConversationRequestMsgs(list) {
        const storeKey = getStoreKey('req');
        const data = store.get(storeKey) || {};
        list.forEach((item) => {
            const conversationKey = generatorKey([
                item.conversationType,
                item.targetId,
            ]);
            item.requestMsgs = data[conversationKey];
        });
    }

    // 获取会话详细信息
    function getConversationInfo(conversation, callback) {
        const {
            targetId, conversationType,
        } = conversation;
        const getInfo = isGroup(conversationType)
            ? groupApi.getOne
            : userApi.getVisitors;
        getInfo(targetId, done, true);

        function done(errorCode, result) {
            /**
             * 35307 - 【会话窗口】偶现-断网后切换窗口时，会话列表和窗口的名称对不上
             * 断网后切换窗口时,如果点击的会话不是群组，传唤 callback函数与conversation
             */
            if (errorCode) {
                if (!isGroup(conversationType)) {
                    const user = Cache.user[targetId];
                    conversation.user = user;
                    callback(errorCode, conversation);
                } else {
                    callback(errorCode);
                }
                return;
            }
            const type = isGroup(conversationType) ? 'group' : 'user';
            conversation[type] = result || {};
            bindConversationRequestMsgs([conversation]);
            const switchFlag = Conversation.getTopAndMuteSwitch();
            if (switchFlag) {
                Conversation.getExpandInfo(conversation, (error, topMute) => {
                    if (Object.keys(topMute).length) {
                        conversation.isTop = topMute.top;
                        conversation.notificationStatus = topMute.not_disturb;
                    }
                    callback(null, conversation);
                });
            } else { // false走sdk
                callback(null, conversation);
            }
        }
    }

    // 获取会话详情 currentItem:当前会话
    Conversation.getConversationDetial = function (currentItem, callback) {
        const getInfo = isGroup(currentItem.conversationType)
        ? groupApi.getOne
        : userApi.getVisitors;
        getInfo(currentItem.targetId, done, true);

        function done(errorCode, result) {
            if (errorCode) {
                callback(errorCode)
                return;
            }
            // 更新缓存
            Cache.user[result.id] = result;
            // 扩展会话的user属性
            currentItem.user = result;
            const message = currentItem.latestMessage;
            if (message) {
                const senderUserId = message.senderUserId;
                const msgUser = Cache.user[senderUserId] || {};
                // 群组会话
                if (isGroup(currentItem.conversationType)) {
                    // 扩展会话的group属性
                    currentItem.group = Cache.group[currentItem.targetId] || {};
                    let groupAlias = '';
                    if (currentItem.group.members) {
                        // 同步api
                        groupAlias = groupApi.getGroupAlias(
                            senderUserId,
                            currentItem.group.members,
                        );
                    }
                    const _user = $.extend({}, msgUser);
                    _user.groupAlias = groupAlias;
                    // 扩展会话的latestMessage的user属性
                    message.user = _user;
                } else {
                    message.user = msgUser;
                }
            }
            // 扩展会话的draft属性（同步api）
            currentItem.draft = Conversation.getDraft(
                currentItem.conversationType,
                currentItem.targetId,
            );
            callback(null, currentItem)
        }
    }

    Conversation.notifyConversation = RongIM.utils.throttle(
        (...args) => debounceConversation(...args),
        600,
    );

    // 创建一条新会话
    const createConversation = function (params) {
        const reset = util.reset;
        const sentTime = +new Date();
        const data = {
            conversationType: 0,
            isTop: false,
            latestMessage: {
                sentTime,
                messageType: 'TextMessage',
                content: '',
            },
            notificationStatus: false,
            receivedStatus: 0,
            targetId: '',
            sentTime,
            unreadMessageCount: 0,
        };
        reset(data, params);
        const conversation = new RongIMLib.Conversation();
        reset(conversation, data);
        messageApi.get({
            targetId: conversation.targetId,
            conversationType: conversation.conversationType,
        },
        (error, list) => {
            if (list && list.length > 0) {
                conversation.latestMessage = list[list.length - 1];
            }
        });
        return conversation;
    };

    // 插入一条新会话
    Conversation.add = function (params, callback) {
        callback = callback || $.noop;
        const type = params.conversationType;
        const targetId = params.targetId;
        const isSame = function (item) {
            return item.conversationType === type && item.targetId === targetId;
        };
        const filter = function (item) {
            return isSame(item);
        };
        let cacheList = Cache.conversation.list || [];
        const list = cacheList.filter(filter);
        const isExist = list.length > 0;
        if (!isExist) {
            const conversation = createConversation(params);
            const callbackFunc = () => {
                Cache.conversation.searchTempList.unshift(conversation);
                // cacheList.push(conversation); // isTop=true
                const topList = cacheList.filter(item => item.isTop === true);
                const otherList = cacheList.filter(item => !topList.includes(item));
                Cache.conversation.list = [...topList, conversation, ...otherList];
                cacheList = Cache.conversation.list || [];
                getConversationInfo(conversation, () => {
                    converObserverList.notify(cacheList, {
                        add: true, // 标识是添加会话的notify
                        conversation,
                    });
                    callback(conversation);
                });
            };
            RongIMClient.getInstance().sendReceiptResponse(type, targetId, {
                onSuccess: callbackFunc,
                onError: callbackFunc,
            });
        }
    };

    // 增加文件助手
    Conversation.addFileHelper = function () {
        const key = `phoneLogined-${Cache.auth.id}`;
        const isLogined = store.get(key);
        if (!isLogined) {
            friendApi.getFileHelper((err, fileHelper) => {
                if (!err) {
                    const params = {
                        targetId: fileHelper.id,
                        conversationType: RongIMLib.ConversationType.PRIVATE,
                        user: fileHelper,
                    };
                    Conversation.add(params, () => {
                        const arg = {
                            targetId: params.targetId,
                            conversationType: params.conversationType,
                            objectName: 'RC:InfoNtf',
                            sentStatus: RongIMLib.SentStatus.SENT,
                            content: {
                                message: RongIM.config.currentLocale()
                                    .components.getFileHelper.desc,
                            },
                        };
                        messageApi.insertMessage(arg);
                    });
                    const list = Cache.conversation.list || [];
                    converObserverList.notify(list);
                    store.set(key, true);
                }
            });
        }
    };

    Conversation.getInitList = function (count, callback) {
        getInitConversationList(count, callback);
    };

    Conversation.getList = function (callback, callbackHasUserinfo) {
        getConversationList(callback, callbackHasUserinfo);
    };

    // 返回缓存中的会话
    Conversation.getLocalList = function () {
        return Cache.conversation.list || [];
    };

    /*
    获取原始会话数据
    主要用于计算未读消息数; 搜索时判断会话是否存在以保证能正确定位
*/
    Conversation.getNativeList = function (callback) {
        callback = callback || $.noop;
        if (!isAvailableData()) {
            const status = getCurrentConnectionStatus();
            const errorCode = `status-${status}`;
            callback(errorCode);
            return;
        }
        const ConversationType = RongIMLib.ConversationType;
        const isSystem = function (type) {
            return type === ConversationType.SYSTEM;
        };
        RongIMClient.getInstance().getConversationList({
            onSuccess(list) {
                list.latestMessage = list.latestMessage || {
                    messageType: 'TextMessage',
                    content: {
                        content: '',
                    },
                };
                // 排除系统会话，会话列表不显示系统会话(朋友圈的消息)
                list = list.filter(
                    item => !isSystem(item.conversationType),
                );
                callback(null, list);
            },
            onError(error) {
                callback(getLibErrorCode(error));
            },
        }, null);
    };

    // 根据 conversationType, targetId 获取缓存会话
    Conversation.getLocalOne = function (conversationType, targetId) {
        let conversation = null;
        const list = Conversation.getLocalList();
        list.some((item) => {
            const sameConversation = +item.conversationType === +conversationType
                && item.targetId === targetId;
            if (sameConversation) {
                conversation = item;
            }
            return sameConversation;
        });
        return conversation;
    };

    // 根据 conversationType, targetId 从接口获取会话
    Conversation.getOne = function (conversationType, targetId, callback) {
        callback = callback || $.noop;
        // const lconv = Conversation.getLocalOne(conversationType, targetId);
        // if (lconv) {
        //     callback(null, lconv);
        //     return;
        // }
        RongIMClient.getInstance().getConversation(
            +conversationType,
            targetId, {
                onSuccess(conversation) {
                    if (!conversation) {
                    // 会话不存在新建一个
                        conversation = {
                            targetId,
                            conversationType,
                            unreadMessageCount: 0,
                        };
                    }
                    getConversationInfo(conversation, callback);
                },
                onError(errorCode) {
                    callback(errorCode);
                },
            },
        );
    };

    Conversation.getOneWithoutInfo = function (
        conversationType,
        targetId,
        callback,
    ) {
        callback = callback || $.noop;
        const lconv = Conversation.getLocalOne(conversationType, targetId);
        if (lconv) {
            callback(null, lconv);
            return;
        }
        RongIMClient.getInstance().getConversation(
            +conversationType,
            targetId, {
                onSuccess(conversation) {
                    if (!conversation) {
                    // 会话不存在新建一个
                        conversation = {
                            targetId,
                            conversationType,
                            unreadMessageCount: 0,
                        };
                    }
                    callback(null, conversation);
                },
                onError(errorCode) {
                    callback(errorCode);
                },
            },
        );
    };

    // 获取单条会话未读数
    Conversation.getUnreadCount = async function (conversation) {
        const type = conversation.conversationType || conversation.conversation_type;
        const targetId = conversation.targetId || conversation.target_id;
        return new Promise((resolve) => {
            RongIMClient.getInstance().getUnreadCount(+type, targetId, {
                onSuccess: resolve,
            });
        });
    };

    // 获取总未读数
    Conversation.getTotalUnreadCount = function (list, callback) {
        callback = callback || $.noop;
        const conversationTypes = [
            RongIMLib.ConversationType.PRIVATE,
            RongIMLib.ConversationType.GROUP,
            RongIMLib.ConversationType.APP_PUBLIC_SERVICE,
            RongIMLib.ConversationType.SYSTEM
        ];
        let total = 0;
        list.forEach((item) => {
            if (
                !item.notificationStatus
                && conversationTypes.indexOf(item.conversationType) !== -1
            ) {
                total += item.unreadMessageCount;
            }
        });
        if (list.length > 0) {
            callback(null, total);
            return;
        }
        Conversation.getList((errorCode, list) => {
            if (errorCode) {
                return callback(errorCode);
            }
            const targetConvers = list.filter(conver => conversationTypes.indexOf(conver.conversationType) > -1);
            // 3、根据筛选出的会话计算未读数
            let targetUnreadCount = 0;
            targetConvers.forEach((conver) => {
                if (conver.unreadMessageCount > 0 && !conver.notificationStatus) {
                    targetUnreadCount += conver.unreadMessageCount;
                }
            });
            callback(null, targetUnreadCount);
        });
        // 40401 - 【会话列表】群组开启消息免打扰，收到新消息显示消息未读数
        // 该方法已弃用
        // RongIMClient.getInstance().getTotalUnreadCount({
        //     onSuccess(count) {
        //         total = count;
        //         getTopListFromRemote(async (error, settingList) => {
        //             if (error) {
        //                 callback(error, settingList);
        //                 return;
        //             }
        //             let muteCount = 0;
        //             if (settingList.length > 0) {
        //                 const notDisturbArr = await Promise.all(settingList.map((conversation) => {
        //                     if (conversation.not_disturb) {
        //                         return Conversation.getUnreadCount(conversation);
        //                     }
        //                     return Promise.resolve(0);
        //                 }));
        //                 notDisturbArr.forEach((num) => {
        //                     muteCount += num;
        //                 });
        //             }
        //             total = Math.max(0, total - muteCount);
        //             callback(error, total);
        //         });
        //     },
        // },
        // conversationTypes);
    };

    Conversation.clearUnReadCount = function (
        conversationType,
        targetId,
        callback,
    ) {
        callback = callback || $.noop;
        // 类型转换 SDK 要求 number 类型
        conversationType = +conversationType;
        RongIMClient.getInstance().getConversation(conversationType, targetId, {
            onSuccess(conversation) {
                if (!conversation) {
                    return;
                }
                bindConversationRequestMsgs([conversation]);
                if (conversation.unreadMessageCount > 0 && browserWindow.isVisible()) {
                    clearUnreadCount(conversationType, targetId, callback);
                    if (
                        conversationType === RongIMLib.ConversationType.PRIVATE
                    ) {
                        messageApi.sendReadStatus(conversation.latestMessage);
                    } else {
                        messageApi.sendSyncReadStatusMessage(
                            conversation.latestMessage,
                        );
                    }
                    if (isGroup(conversationType) && conversation.requestMsgs) {
                        messageApi.sendGroupResponse(
                            conversationType,
                            targetId,
                            conversation.requestMsgs,
                        );
                    }
                }
            },
            onError(errorCode) {
                callback(errorCode);
            },
        });
    };

    function clearUnreadCount(conversationType, targetId, callback) {
        callback = callback || $.noop;
        RongIMClient.getInstance().clearUnreadCount(
            conversationType,
            targetId, {
                onSuccess() {
                    const list = Conversation.getLocalList();
                    const conversation = Conversation.getLocalOne(
                        conversationType,
                        targetId,
                    );
                    if (conversation) {
                        conversation.unreadMessageCount = 0;
                        converObserverList.notify(list, {
                            clearUnreadCount: true, // 标识是清除未读数的notify
                            conversationType,
                            targetId,
                        });
                    }
                    callback();
                },
                onError(errorCode) {
                    callback(getLibErrorCode(errorCode));
                },
            },
        );
    }

    Conversation.clearUnreadCount = clearUnreadCount;

    Conversation.getDraft = function (conversationType, targetId) {
        const path = `${conversationType}/${targetId}`;
        return Conversation.draft[path] || {
            content: '',
            atMembers: [],
        };
    };

    Conversation.setDraft = function (conversationType, targetId, draft) {
        const path = `${conversationType}/${targetId}`;
        Conversation.draft[path] = draft;
        const conversation = Conversation.getLocalOne(
            conversationType,
            targetId,
        );
        if (conversation) {
            conversation.draft = draft;
            // 42568 - 【逐条转发】消息逐条转发后，删除输入框中的草稿切换至其他会话，草稿消息显示在会话列表
            const list = Conversation.getLocalList();
            converObserverList.notify(list, {
                setDraft: true,
                conversation,
            });
        }
    };

    Conversation.clearDraft = function (conversationType, targetId) {
        Conversation.setDraft(conversationType, targetId, '');
        const conversation = Conversation.getLocalOne(
            conversationType,
            targetId,
        );
        if (conversation) {
            conversation.draft = {
                atMembers: [],
                content: '',
                editTime: 0,
            };
            const list = Conversation.getLocalList();
            converObserverList.notify(list, {
                setDraft: true,
                conversation,
            });
        }
    };

    Conversation.remove = function (conversationType, targetId, callback) {
        callback = callback || $.noop;
        if (!isAvailableData()) {
            const status = getCurrentConnectionStatus();
            const errorCode = `status-${status}`;
            callback(errorCode);
            return;
        }
        const isSame = function (item) {
            return (
                item.conversationType === conversationType
                && item.targetId === targetId
            );
        };
        const searchList = Cache.conversation.searchTempList;
        searchList.forEach((item, index) => {
            if (isSame(item)) {
                searchList.splice(index, 1);
            }
        });
        RongIMClient.getInstance().removeConversation(
            conversationType,
            targetId, {
                onSuccess() {
                    const list = Conversation.getLocalList();
                    const item = Conversation.getLocalOne(
                        conversationType,
                        targetId,
                    );
                    const index = list.indexOf(item);
                    if (index > -1) {
                        list.splice(index, 1);
                    }
                    converObserverList.notify(list);
                    callback();
                },
                onError(error) {
                    callback(getLibErrorCode(error));
                },
            },
        );
    };

    /*
正在会话的会话，切换会话时调用
var active = {
    conversationType: 1,
    targetId: ''
};
*/
    Conversation.setActive = function (active) {
        Conversation.active = active;
    };

    const toggleTop = function (conversationType, targetId, isTop, callback) {
        callback = callback || $.noop;
        const item = {
            1() {
                const topObj = {
                    conversation_type: conversationType,
                    target_id: targetId,
                    top: true,
                    not_disturb: false,
                };
                let notHave = true;
                const topList = Cache.conversation.topList || [];
                for (let i = 0; i < topList.length; i += 1) {
                    const temp = topList[i];
                    if (
                        +temp.conversation_type === +conversationType
                        && temp.target_id === targetId
                    ) {
                        temp.top = true;
                        notHave = false;
                    }
                }
                if (notHave) topList.push(topObj);
            },
            0() {
                const topList = Cache.conversation.topList || [];
                for (let i = 0; i < topList.length; i += 1) {
                    const temp = topList[i];
                    if (
                        +temp.conversation_type === +conversationType
                        && temp.target_id === targetId
                    ) {
                        if (temp.not_disturb) {
                            temp.top = false;
                        } else {
                            topList.splice(i, 1);
                        }
                    }
                }
            },
        };
        Http.put('/conversation/top', {
            conversation_type: conversationType,
            target_id: targetId,
            top: isTop,
        })
            .done((result) => {
                // if(isTop === 1){
                //     Cache.conversation.isSetting = false;
                //     Cache.conversation._defer = null;
                // }
                item[isTop]();
                callback(null, result);
                // Conversation.getList(function (errorCode, list) {
                //     if (errorCode) {
                //         return callback( errorCode);
                //     }
                //     converObserverList.notify(list);
                // });
            })
            .fail(callback);
    };

    // 1.9.0版本改为调用sdk方法实现置顶逻辑
    const toggleTopSdk = function (conversationType, targetId, isTop, callback) {
        callback = callback || $.noop;
        const isTopMap = {
            1: true,
            0: false,
        };
        const statusItem = {
            isTop: isTopMap[isTop],
        };
        RongIMClient.getInstance().setConversationStatus(conversationType, targetId, statusItem, {
            onSuccess(result) {
                topToggleCallback(conversationType, targetId, isTop, result, callback)();
            },
            onError(error) {
                callback(error);
            },
        });
    };

    // 修改缓存中免打扰状态更新UI(应该是, 猜测。整理的原有代码)
    function topToggleCallback(conversationType, targetId, isTop, result, callback) {
        const topItem = {
            1() {
                const topObj = {
                    conversation_type: conversationType,
                    target_id: targetId,
                    top: true,
                    not_disturb: false,
                };
                let notHave = true;
                const topList = Cache.conversation.topList || [];
                for (let i = 0; i < topList.length; i += 1) {
                    const temp = topList[i];
                    if (
                        +temp.conversation_type === +conversationType
                        && temp.target_id === targetId
                    ) {
                        temp.top = true;
                        notHave = false;
                    }
                }
                if (notHave) topList.push(topObj);
                converObserverList.notify();
                if (callback) {
                    callback(null, result);
                }
            },
            0() {
                const topList = Cache.conversation.topList || [];
                for (let i = 0; i < topList.length; i += 1) {
                    const temp = topList[i];
                    if (
                        +temp.conversation_type === +conversationType
                        && temp.target_id === targetId
                    ) {
                        if (temp.not_disturb) {
                            temp.top = false;
                        } else {
                            topList.splice(i, 1);
                        }
                    }
                }
                converObserverList.notify();
                if (callback) {
                    callback(null, result);
                }
            },
        };
        return topItem[isTop];
    }

    /**
     * 获取会话置顶和免打扰使用sdk或者接口开关
     * false走sdk，true走原来老的逻辑(serve 接口)
     */
    Conversation.getTopAndMuteSwitch = function () {
        const flag = appCache.get(APP_CACHE.SERVER_CONFIG).conversation_setting.sync_conversation_status_from_rce;
        return flag;
    };

    // 置顶
    Conversation.top = function (conversationType, targetId, callback) {
        const switchFlag = Conversation.getTopAndMuteSwitch();
        if (switchFlag) {
            toggleTop(conversationType, targetId, 1, callback);
        } else { // false走sdk
            toggleTopSdk(conversationType, targetId, 1, callback);
        }
    };
    // 取消置顶
    Conversation.untop = function (conversationType, targetId, callback) {
        const switchFlag = Conversation.getTopAndMuteSwitch();
        if (switchFlag) {
            toggleTop(conversationType, targetId, 0, callback);
        } else {
            toggleTopSdk(conversationType, targetId, 0, callback);
        }
    };

    Conversation.search = function (keyword, callback) {
        callback = callback || $.noop;
        if (!isAvailableData()) {
            const status = getCurrentConnectionStatus();
            const errorCode = `status-${status}`;
            callback(errorCode);
            return;
        }

        RongIMClient.getInstance().searchConversationByContent(
            keyword, {
                onSuccess(conversationList) {
                    addConversationUserInfo(conversationList, (error, list) => {
                    // 补充搜索到几条消息。TODO: 希望 SDK 可以支持
                        if (error) {
                            callback(getLibErrorCode(error));
                            return;
                        }
                        callback(null, list);
                    });
                },
                onError(code) {
                    callback(code);
                },
            },
            undefined,
            ['RCE:GrpNoticeNtfy'],
        );
    };

    const toggleMute = function (conversationType, targetId, isMute, callback) {
        callback = callback || $.noop;
        const item = {
            1() {
                const topObj = {
                    conversation_type: conversationType,
                    target_id: targetId,
                    top: false,
                    not_disturb: true,
                };
                let notHave = true;
                const topList = Cache.conversation.topList || [];
                for (let i = 0; i < topList.length; i += 1) {
                    const temp = topList[i];
                    if (
                        +temp.conversation_type === +conversationType
                        && temp.target_id === targetId
                    ) {
                        temp.not_disturb = true;
                        notHave = false;
                    }
                }
                if (notHave) topList.push(topObj);
            },
            0() {
                const topList = Cache.conversation.topList || [];
                for (let i = 0; i < topList.length; i += 1) {
                    const temp = topList[i];
                    if (
                        +temp.conversation_type === +conversationType
                        && temp.target_id === targetId
                    ) {
                        if (temp.top || temp.not_disturb) {
                            temp.not_disturb = false;
                        } else {
                            topList.splice(i, 1);
                        }
                    }
                }
            },
        };
        Http.put('/conversation/notdisturb', {
            conversation_type: conversationType,
            target_id: targetId,
            not_disturb: isMute,
        })
            .done((result) => {
                // if(isMute === 1){
                //     Cache.conversation.isSetting = false;
                //     Cache.conversation._defer = null;
                // }
                item[isMute]();
                callback(null, result);

                const list = Conversation.getLocalList();
                const conversation = Conversation.getLocalOne(
                    conversationType,
                    targetId,
                );
                // TODO: conversation 可能是空值，需要排查空值的原因
                // 复现方式：删除会话列表中的公众号，通过搜索该公众号公众号会话窗口，点击弹出公众号设置面板，操作 switch 组件
                if (conversation) {
                    conversation.notificationStatus = isMute === 1;
                    converObserverList.notify(list);
                }
            })
            .fail(callback);
    };

    // 1.9.0版本改为调用sdk方法实现消息免打扰逻辑
    const toggleMuteSdk = function (conversationType, targetId, isMute, callback) {
        callback = callback || $.noop;
        // 是否免打扰： 1 开启免打扰 | 2 关闭免打扰
        const statusItem = {
            notificationStatus: isMute,
        };
        RongIMClient.getInstance().setConversationStatus(conversationType, targetId, statusItem, {
            onSuccess() {
                muteToggleCallback(conversationType, targetId, isMute, callback);
            },
            onError(error) {
                callback(error);
            },
        });
    };

    // 修改缓存中免打扰状态更新UI(应该是, 猜测。整理的原有代码)
    function muteToggleCallback(conversationType, targetId, isMute, callback) {
        const muteItem = {
            1() {
                const topObj = {
                    conversation_type: conversationType,
                    target_id: targetId,
                    top: false,
                    not_disturb: true,
                };
                let notHave = true;
                const topList = Cache.conversation.topList || [];
                for (let i = 0; i < topList.length; i += 1) {
                    const temp = topList[i];
                    if (
                        +temp.conversation_type === +conversationType
                        && temp.target_id === targetId
                    ) {
                        temp.not_disturb = true;
                        notHave = false;
                    }
                }
                if (notHave) topList.push(topObj);
                callback(null);
            },
            2() {
                const topList = Cache.conversation.topList || [];
                for (let i = 0; i < topList.length; i += 1) {
                    const temp = topList[i];
                    if (
                        +temp.conversation_type === +conversationType
                        && temp.target_id === targetId
                    ) {
                        if (temp.top || temp.not_disturb) {
                            temp.not_disturb = false;
                        } else {
                            topList.splice(i, 1);
                        }
                    }
                }
                callback(null);
            },
        };
        muteItem[isMute]();
        const list = Conversation.getLocalList();
        const conversation = Conversation.getLocalOne(
            conversationType,
            targetId,
        );
        // TODO: conversation 可能是空值，需要排查空值的原因
        // 复现方式：删除会话列表中的公众号，通过搜索该公众号公众号会话窗口，点击弹出公众号设置面板，操作 switch 组件
        if (conversation) {
            conversation.notificationStatus = isMute === 1;
            converObserverList.notify(list);
        }
    }

    function getExpandInfo(type, id) {
        let result = {};
        Cache.conversation.topList.forEach((item) => {
            if (+item.conversation_type === +type && item.target_id === id) {
                result = item;
            }
        });
        return result;
    }

    /*
会话相关详细信息
params.conversationType 会话类型
params.targetId 会话 Id
*/
    Conversation.getExpandInfo = function (params, callback) {
        const type = params.conversationType;
        const id = params.targetId;
        callback = callback || $.noop;

        if (Cache.conversation.topList) {
            const expandInfo = getExpandInfo(type, id);
            if (Object.keys(expandInfo).length) {
                callback(null, expandInfo);
            } else {
                getTopListFromRemote((errorCode, list) => {
                    Cache.conversation.topList = list || [];
                    const result = getExpandInfo(type, id);
                    callback(null, result);
                });
            }
        } else {
            getTopListFromRemote((errorCode, list) => {
                Cache.conversation.topList = list || [];
                const result = getExpandInfo(type, id);
                callback(null, result);
            });
        }
    };

    // 免打扰
    Conversation.mute = function (conversationType, targetId, callback) {
        const switchFlag = Conversation.getTopAndMuteSwitch();
        if (switchFlag) {
            toggleMute(conversationType, targetId, 1, callback);
        } else {
            toggleMuteSdk(conversationType, targetId, 1, callback);
        }
    };
    // 取消免打扰
    Conversation.unmute = function (conversationType, targetId, callback) {
        const switchFlag = Conversation.getTopAndMuteSwitch();
        if (switchFlag) {
            toggleMute(conversationType, targetId, 0, callback);
        } else {
            toggleMuteSdk(conversationType, targetId, 2, callback);
        }
    };

    Conversation.watch = function (handle) {
        converObserverList.add(handle);
    };

    Conversation.unwatch = function (handle) {
        converObserverList.remove(handle);
    };

    Conversation.getUnreadMentionedMessages = function (params) {
        return RongIMClient.getInstance().getUnreadMentionedMessages(params.conversationType, params.targetId);
    };

    RongIM.dataModel.Conversation = Conversation;
};
