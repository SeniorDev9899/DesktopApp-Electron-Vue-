/* eslint-disable no-param-reassign */
/* eslint-disable no-underscore-dangle */
/* eslint-disable func-names */
import syncdata from '../syncdata';
import { getServerConfig } from '../cache/helper';

export default (RongIM) => {
    const Http = RongIM.dataModel._Http;
    const Cache = RongIM.dataModel._Cache;
    const ObserverList = RongIM.dataModel._ObserverList;
    const httpRequest = RongIM.dataModel._httpRequest;

    const utils = RongIM.utils;
    const common = RongIM.common;

    let orgApi = null;
    let userApi = null;
    let conversationApi = null;
    let messageApi = null;

    const Group = {
        observerList: new ObserverList(),
    };

    const groupObserverList = Group.observerList;

    Cache.group = {
        _defer: {},
    };

    Group.cleanCache = function () {
        Cache.group = {
            _defer: {},
        };
    };

    Group.loadApi = function () {
        const dataModel = RongIM.dataModel;
        orgApi = dataModel.Organization;
        userApi = dataModel.User;
        conversationApi = dataModel.Conversation;
        messageApi = dataModel.Message;
    };

    Group.registerMessage = function () {
        // 群成员变化消息
        let messageName = 'GroupMemChangedNotifyMessage';
        let objectName = 'RCE:GrpMemChanged';
        let messageTag = new RongIMLib.MessageTag(false, true);
        let properties = ['action', 'operatorUser', 'targetGroup', 'targetUsers', 'extra'];
        RongIMClient.registerMessageType(messageName, objectName, messageTag, properties);

        // 群信息更新消息
        messageName = 'GroupNotifyMessage';
        objectName = 'RCE:GrpNtfy';
        messageTag = new RongIMLib.MessageTag(false, true);
        properties = ['action', 'data', 'operatorUser', 'targetGroup', 'targetUsers'];
        RongIMClient.registerMessageType(messageName, objectName, messageTag, properties);

        // 群组命令消息
        messageName = 'GroupCmdMessage';
        objectName = 'RCE:GrpCmd';
        messageTag = new RongIMLib.MessageTag(false, false);
        properties = ['action', 'operatorUser', 'targetGroup'];
        RongIMClient.registerMessageType(messageName, objectName, messageTag, properties);

        messageName = 'GroupVerifyNotifyMessage';
        objectName = 'RCE:GrpRcvNtfy';
        messageTag = new RongIMLib.MessageTag(false, false);
        properties = ['operatorUser', 'targetGroup', 'action', 'targetUser', 'lastReceiver'];
        RongIMClient.registerMessageType(messageName, objectName, messageTag, properties);
    };

    /* 收到被踢, 被禁言消息时, clear草稿 */
    function clearDraft(message) {
        const conversationType = message.conversationType;
        const targetId = message.targetId;
        conversationApi = conversationApi || RongIM.dataModel.Conversation;
        let targetIds;
        let isSelf;
        let action;
        let isQuit;
        let isBanned;
        let isClear;
        let isBannedAll;
        switch (message.messageType) {
        case 'GroupMemChangedNotifyMessage':
            action = message.content.action;
            isQuit = action === 3;
            targetIds = message.content.targetUsers.map(item => item.id);
            if (RongIM.instance.auth) {
                isSelf = targetIds.indexOf(RongIM.instance.auth.id);
            } else {
                isSelf = false;
            }
            if (isQuit && isSelf) {
                conversationApi.clearDraft(conversationType, targetId);
            }
            break;
        case 'GroupNotifyMessage':
            action = message.content.action;
            isBanned = action === 23;
            isClear = isBanned;
            if (isBanned) {
                targetIds = message.content.targetUsers.map(item => item.id);
                isSelf = targetIds.indexOf(Cache.auth.id);
                isClear = isClear && isSelf;
            }
            isBannedAll = action === 21;
            if (isClear || isBannedAll) {
                conversationApi.clearDraft(conversationType, targetId);
            }
            break;
        default:
            break;
        }
    }

    Group.messageCtrol = {
        GroupMemChangedNotifyMessage(message) {
            clearDraft(message);
            updateGroupNotify(message);
        },
        GroupNotifyMessage(message) {
            clearDraft(message);
            updateGroup(message);
            messageApi.observerList.notify(message);
            conversationApi.notifyConversation();
        },
        GroupCmdMessage(message) {
            if (message.offLineMessage) {
                return;
            }
            updateGroup(message);
        },
    };
    Group.create = function (params, callback) {
        callback = callback || $.noop;
        const data = {
            type: params.type,
            name: params.name,
            portrait_url: '',
            member_ids: params.member_ids,
        };
        Http.post('/groups', data).done((result) => {
            Group.getOne(result.id, (errorCode, group) => {
                if (errorCode) {
                    callback(errorCode);
                    return;
                }
                const arg = {
                    conversationType: RongIMLib.ConversationType.GROUP,
                    targetId: group.id,
                };
                conversationApi.add(arg);
                callback(null, group);
            });
        }).fail(callback);
    };

    Group.addToFav = function (idList, callback) {
        const data = {
            ids: idList,
        };
        Http.post('/favgroups', data, callback);
    };

    Group.removeFromFav = function (idList, callback) {
        const data = {
            ids: idList,
        };
        Http.del('/favgroups', data, callback);
    };

    Group.rename = function (groupId, name, callback) {
        const data = {
            name,
        };
        Http.put(`/groups/${groupId}/name`, data, callback);
    };

    Group.getMember = function (memberId) {
        return Cache.user[memberId] ? Cache.user[memberId].name : `user<${memberId}>`;
    };

    Group.getNewGroup = function (groupId, callback) {
        callback = callback || $.noop;
        if (utils.isEmpty(groupId)) {
            callback('params error: groupId invalid');
            return;
        }
        getGroups([groupId], (errorCode, groupList) => {
            if (errorCode) {
                callback(errorCode);
                return;
            }
            const group = groupList[0] || {};
            Http.get(`/groups/${groupId}/members`, (error, result) => {
                const list = [];
                if (error) {
                    callback(error);
                    return;
                }
                result.data.forEach((item) => {
                    const user = {
                        id: item.id,
                        name: item.name,
                        avatar: item.portrait_url,
                        state: item.state,
                        type: item.user_type,
                        groupAlias: item.alias,
                        createDt: item.create_dt,
                        portrait_big_url: item.portrait_big_url,
                        mute_status: item.mute_status,
                    };
                    list.push(user);
                    if (item.id === group.admin_id) {
                        group.creator_name = item.name;
                    }
                });
                group.groupMembers = list;
                group.member_id_list = list.map(item => item.id);
                callback(null, group);
                updateConversationGroup(group);
            });
        }, {
            isRemote: true,
        });
    };

    // 更新会话中的群信息，会话中群信息为啥没有保持引用不不清楚
    function updateConversationGroup(group) {
        const _conversation = conversationApi.getLocalOne(RongIMLib.ConversationType.GROUP, group.id);
        if (_conversation) {
            _conversation.group = group;
        }
    }

    // 获取群组内所有成员
    Group.getAllMembers = function (groupId, callback, isRefresh) {
        if (isRefresh) {
            delete Cache.group[groupId];
        }
        getGroups([groupId], (errorCode, groupList) => {
            if (errorCode) {
                callback(errorCode);
                return;
            }
            const group = groupList[0] || {};
            if (!isRefresh && group.groupMembers && group.groupMembers.length > 0) {
                callback(null, group.groupMembers, group);
                return;
            }
            Http.get(`/groups/${groupId}/members`, (error, result) => {
                const list = [];
                if (error) {
                    callback(error);
                    return;
                }
                result.data.forEach((item) => {
                    const user = {
                        id: item.id,
                        name: item.name,
                        avatar: item.portrait_url,
                        state: item.state,
                        type: item.user_type,
                        groupAlias: item.alias,
                        createDt: item.create_dt,
                        portrait_big_url: item.portrait_big_url,
                        mute_status: item.mute_status,
                    };
                    list.push(user);
                    if (group.admin_id === item.id) {
                        group.creator_name = item.name;
                    }
                });
                group.groupMembers = list;
                group.member_id_list = list.map(item => item.id);
                callback(null, list, group);
            });
        });
    };

    Group.addMembers = function (groupId, memberIdList, callback) {
        const data = {
            ids: memberIdList,
        };
        Http.post(`/groups/${groupId}/invite`, data, callback);
    };

    Group.removeMembers = function (groupId, memberIdList, callback) {
        const data = {
            ids: memberIdList,
        };
        Http.post(`/groups/${groupId}/remove`, data, callback);
    };

    /*
设置群昵称 PUT
删除群昵称 DELETE
*/
    Group.modifyMemberAlias = function (groupId, memberId, name, callback) {
        const data = {
            alias: name,
        };
        const url = `/groups/${groupId}/members/${memberId}/alias`;
        const method = name === '' ? 'DELETE' : 'PUT';
        httpRequest(method, url, data, (errorCode) => {
            if (errorCode) {
                callback(errorCode);
                return;
            }
            Cache.group[groupId].groupMembers.forEach((member) => {
                if (member.id === memberId) {
                    member.groupAlias = name;
                }
            });
            callback(null);
        });
    };

    Group.watch = function (handle) {
        groupObserverList.add(handle);
    };

    Group.unwatch = function (handle) {
        groupObserverList.remove(handle);
    };

    Group.quit = function (groupId, callback) {
        Http.post(`/groups/${groupId}/quit`).done((result) => {
            callback(null, result);
        }).fail(callback);
    };

    Group.dismiss = function (groupId, callback) {
        Http.del(`/groups/${groupId}`).done((result) => {
            callback(null, result);
        }).fail(callback);
    };

    // 38862 - 【群组】重新加入群组，置顶聊天设置自动生效
    // 说明： 取消置顶
    // 参数： @param {sring} groupId 群组 ID
    Group.removeFromTop = function (groupId, callback) {
        Http.put('/conversation/top', {
            conversation_type: 3,
            target_id: groupId,
            top: 0,
        }).done((result) => {
            callback(null, result);
        }).fail(callback);
    };

    Group.getOne = function (groupId, callback, isRemote) {
        callback = callback || $.noop;
        const error = null;
        const group = Cache.group[groupId];
        if (group) {
            callback(error, group);
            return;
        }
        getGroups([groupId], (errorCode, list) => {
            if (errorCode) {
                callback(errorCode);
                return;
            }
            callback(error, list[0]);
        }, { isRemote });
    };

    Group.getList = function (callback) {
        callback = callback || $.noop;
        /**
     * 实现过程
     * 1. 获取收藏群组列表
     * 2. 从`Cache.group`中获取群组信息
     * 3. 缓存中没有从服务器获取群组信息，群成员信息，更新缓存`Cache.group`
     * 4. 根据 memberId 获取群成员信息 userApi.getBatch([userId], callback)
     */
        Http.get('/favgroups', (errorCode, result) => {
            if (errorCode) {
                callback(errorCode);
                return;
            }
            const idList = result.data
                .sort((a, b) => a.create_dt < b.create_dt)
                .map(group => group.id);
            getGroups(idList, callback);
        });
    };

    Group.getBatch = function (idsList, callback) {
        callback = callback || $.noop;
        getGroups(idsList, callback);
    };

    Group.search = function (keyword, callback) {
        keyword = keyword.replace('%', item => encodeURI(item));
        Http.post('/groups/search', {
            keywords: [keyword],
        }).done((result) => {
            const ids = result.map(item => item.id);
            Group.getBatchGroups(ids).then(() => {
                getGroups(ids, callback, null, result);
            });
        }).fail(callback);
    };

    Group.bannedAll = function (params, callback) {
        const id = params.id;
        const url = `/groups/${id}/gag/set_all_mute`;
        Http.post(url, {
            mute_status: params.status,
        }).done((result) => {
            const error = null;
            callback(error, result);
        }).fail(callback);
    };
    /*
    params = {
        id: '',
        members = [{
            memberId: 'dka12d',
            status: 1
        }]
    }
*/
    Group.banned = function (params, callback) {
        const members = params.members.map(item => ({
            member_id: item.memberId,
            mute_status: item.status,
        }));
        Http.post(`/groups/${params.id}/gag/set_member_mute`, {
            data: members,
        }).done((result) => {
            const error = null;
            callback(error, result);
        }).fail(callback);
    };

    Group.getApproveList = function (callback) {
        const url = '/groups/receivers';
        Http.get(url).done((result) => {
            addUserToList(result, 'receiver_id').done(() => {
                callback(null, result);
            });
        }).fail(callback);
    };

    Group.setPermission = function (groupId, params, callback) {
        const url = `/groups/${groupId}/permission`;
        Http.put(url, params).done(() => {
            syncdata.groupById(groupId, callback);
        }).fail(callback);
    };

    /* 审批, status: 1为通过, 5为删除 */
    Group.approve = function (groupId, userId, status, callback) {
        const url = `/groups/${groupId}/approve_receiver/${userId}`;
        const data = {
            approve_status: status,
        };
        Http.post(url, data).done(() => {
            callback(null);
        }).fail(callback);
    };

    Group.clearApprove = function (callback) {
        const url = '/groups/clear_receiver';
        Http.post(url, callback);
    };

    Group.getApproveUnread = function (callback) {
        const url = '/groups/receiver_unread';
        Http.get(url).done((result) => {
            const unreadCount = result.unread_count;
            callback(null, unreadCount);
        }).fail(callback);
    };

    Group.clearApproveUnRead = function (callback) {
        const url = '/groups/clear_receiver_unread';
        Http.post(url).done(() => {
            callback(null);
        }).fail(callback);
    };

    /*
    params.id
    params.manager
*/
    Group.transfer = function (params, callback) {
        const id = params.id;
        const manager = params.manager;
        const url = `/groups/${id}/transfer_manager`;
        Http.put(url, {
            id: manager,
        }).done((result) => {
            callback(null, result);
        }).fail(callback);
    };

    Group.createQRCode = function (node, userId, groupId, size) {
        let text = utils.templateFormat('rce://group/join?code&{{0}}&{{1}}', groupId, userId);
        text = encodeURIComponent(text);
        const shareUrls = getServerConfig().qrcode.share_urls;
        const isHttps = window.location.href.startsWith('https');
        let imUrl = shareUrls[0];
        const configIsHttps = imUrl.startsWith('https');
        if ((isHttps && !configIsHttps) || (!isHttps && configIsHttps)) {
            imUrl = shareUrls[1];
        }
        text = `${imUrl}?key=${text}`;
        $(node).empty();
        // eslint-disable-next-line no-new
        new QRCode(node, {
            text,
            width: size.width,
            height: size.height,
            correctLevel: QRCode.CorrectLevel.L,
        });
    };

    function addUserToList(list, key) {
        const def = $.Deferred();
        let count = 0;
        if (list.length === 0) {
            def.resolve();
        } else {
            const ids = list.map(item => item[key]);
            userApi.get(ids, (errorCode, userList) => {
                userList = [].concat(userList);
                userList.forEach((user) => {
                    count += 1;
                    list.forEach((data) => {
                        if (user && user.id === data[key]) {
                            data.user = user;
                        }
                    });
                    if (count === userList.length) def.resolve();
                });
            });
        }
        return def;
    }

    // 返回不在缓存里的keys
    function filterCache(cache, keys) {
        const list = [];
        keys.forEach((key) => {
            if (!cache[key]) list.push(key);
        });
        return list;
    }

    /**
 * getGroups
 * @param  {array}   idList
 * @param  {function} callback
 * @param  {object}   option: isRemote(是否从服务器获取)
 * @param  {array}   searchInfo: 搜索群组结果
 */
    function getGroups(idList, callback, option, searchInfo) {
        callback = callback || $.noop;
        option = option || {};
        const isRemote = option.isRemote;
        if (idList.length <= 0) {
            return callback(null, []);
        }
        let newIdList = idList;
        if (!isRemote) {
            newIdList = filterCache(Cache.group, idList);
        }
        if (newIdList <= 0) {
            let groups = [];
            if (searchInfo) {
                groups = searchInfo.map((item) => {
                    const _group = Cache.group[item.id];
                    _group.user_list = item.user_list;
                    return _group;
                });
            } else {
                groups = idList.map(id => Cache.group[id]);
            }
            return callback(null, groups);
        }
        const promiseList = newIdList.map(id => getOneGroup(id));
        return $.when.apply(null, promiseList).then(() => {
            const groupList = idList.map(id => Cache.group[id]);
            callback(null, groupList);
            return groupList;
        });
    }
    Group.getGroups = getGroups;

    const groupUpdateTimer = {};
    function updateGroupNotify(message) {
        const requireClear = requireClearGroup(message);

        if (requireClear.group) {
            Group.removeFromFav([message.targetId]);
        }
        if (requireClear.conversation) {
            conversationApi.remove(RongIMLib.ConversationType.GROUP, message.targetId);
        }

        messageApi = messageApi || RongIM.dataModel.Message;

        const authId = Cache.auth.id;
        let isTargetUsers = false;
        message.content.targetUsers.forEach((item) => {
            if (item.id === authId) {
                isTargetUsers = true;
            }
        });
        if (message.offLineMessage) {
            return;
        }
        const groupId = message.targetId;
        clearTimeout(groupUpdateTimer[groupId]);
        groupUpdateTimer[groupId] = setTimeout(() => {
            syncdata.groupById(groupId, () => {
                if (message.content.action === 3 && isTargetUsers) {
                    Group.getNewGroup(groupId, (errorCode, group) => {
                        if (!errorCode) groupObserverList.notify(group);
                    });
                } else {
                    Group.getAllMembers(groupId, (errorCode, members, group) => {
                        if (errorCode) {
                            return;
                        }
                        groupObserverList.notify(group);
                        // pc端会话列表群组信息不更新，web端有更新，不知道为啥 zhaokeyang
                        updateConversationGroup(group);
                        // messageApi._push(message);
                    }, true);
                }
            });
        }, 1000);
    }

    // 群通知消息单独处理
    Group.getNotifyGroupMsg = function (message) {
        if (message.messageType !== 'GroupMemChangedNotifyMessage') {
            return false;
        }

        const isMe = RongIM.dataModel._Cache.auth.id;
        const group = message.content.targetGroup;
        // 操作行为类型
        const messageAction = message.content.action;
        // 群组减员通知：3，被移除；4，主动退出
        if (messageAction === 3 || messageAction === 4) {
            const groupId = message.targetId;
            const conversationType = message.conversationType;
            conversationApi.unmute(conversationType, groupId);
            conversationApi.untop(conversationType, groupId);
            // 非操作者，后台操作时，操作者 id 为群主
            const isNotOperatorUser = message.content.operatorUser.id !== isMe;
            // 非被操作者
            const isNotTargetUsers = !message.content.targetUsers.some(item => item.id === isMe);
            const isManager = group.manager_id === isMe;
            const params = {
                conversation: message.conversationType,
                targetId: message.targetId,
                messageId: message.messageId,
                notNotify: true,
            };
            // 无关消息，不显示
            if (isNotOperatorUser && isNotTargetUsers && !isManager) {
                delayRemoveLocalMessage(params);
                return false;
            }
            // 群组减员消息，只通知群主且群必须为自建群，部门群等不通知
            if (!isManager || group.type !== 0) {
                delayRemoveLocalMessage(params);
                return false;
            }
        }
        return true;
    };

    let delayRemoveList = [];
    function deayHandel() {
        removeLocalMessageBatch(delayRemoveList);
        delayRemoveList = [];
        messageApi.unwatchOfflineReceivefinish(deayHandel);
    }
    // 收离线消息时延时执行当收完离线消息时执行
    function delayRemoveLocalMessage(params) {
        if (RongIM.offlineMessageReceiving) {
            if (delayRemoveList.length === 0) {
                messageApi.watchOfflineReceivefinish(deayHandel);
            }
            delayRemoveList.push(params);
            return;
        }
        removeLocalMessageBatch([params]);
    }
    function removeLocalMessageBatch(paramsList) {
        // eslint-disable-next-line no-console
        console.debug('removeLocalMessageBatch', paramsList.length);
        const messageIds = [];
        paramsList.forEach((params) => {
            messageIds.push(params.messageId);
            const key = `${params.conversationType}_${params.targetId}`;
            const list = messageApi._cache[key];
            if (!list || list.length === 0) {
                return;
            }
            for (let i = 0, length = list.length; i < length; i += 1) {
                const msg = list[i];
                if (msg.messageId === params.messageId) {
                    list.splice(i, 1);
                    return;
                }
            }
        });
        RongIMClient.getInstance().deleteLocalMessages('', '', messageIds, {
            onSuccess() { },
            onError() { },
        });
    }

    function updateGroup(message) {
        const requireClear = requireClearGroup(message);

        if (message.offLineMessage && requireClear.conversation) {
            conversationApi.remove(RongIMLib.ConversationType.GROUP, message.targetId);
            return;
        }

        if (requireClear.group) {
            Group.removeFromFav([message.targetId]);
        }
        if (requireClear.conversation) {
            conversationApi.remove(RongIMLib.ConversationType.GROUP, message.targetId);
        }
        if (message.messageType !== 'GroupCmdMessage') {
            messageApi._push(message);
        }
        if (message.offLineMessage) {
            return;
        }
        const groupId = message.targetId;
        clearTimeout(groupUpdateTimer[groupId]);
        groupUpdateTimer[groupId] = setTimeout(() => {
            syncdata.groupById(groupId, () => {
                // 23 群组禁言黑名单添加操作 24 群组禁言黑名单删除操作
                const isUpdateMember = message.messageType === 'GroupNotifyMessage' && [23, 24].indexOf(message.content.action) > -1;
                if (isUpdateMember) {
                    Group.getAllMembers(groupId, (errorCode, members, group) => {
                        if (errorCode) {
                            return;
                        }
                        groupObserverList.notify(group);
                    }, true);
                } else {
                    Group.getNewGroup(groupId, (errorCode, group) => {
                        if (!errorCode) groupObserverList.notify(group);
                    });
                }
            });
        });
    }

    function requireClearGroup(message) {
        const actionMap = {
            GroupMemChangedNotifyMessage: {
                1: 'Invite',
                2: 'Join',
                3: 'Kick',
                4: 'Quit',
            },
            GroupNotifyMessage: {
                1: 'Create',
                2: 'Dismiss',
                4: 'Rename',
            },
            GroupCmdMessage: {
                1: 'UpdPortrait',
                2: 'UpdManager',
            },
        };
        const action = message.content.action;
        const actionText = actionMap[message.messageType][action];
        const list = ['Kick', 'Quit', 'Dismiss'];
        const targetUsers = message.content.targetUsers;
        let includeMe = false;
        if (targetUsers) {
            includeMe = targetUsers.filter(item => item.id === Cache.auth.id).length > 0;
        } else {
            includeMe = true;
        }

        const clearGroup = list.indexOf(actionText) >= 0 && includeMe;

        const isOperator = message.content.operatorUser.id === Cache.auth.id;
        let clearConversation = false;
        if (actionText === 'Quit' && isOperator) {
            clearConversation = true;
        }
        const isSender = (message.messageDirection === RongIMLib.MessageDirection.SEND);
        if (actionText === 'Dismiss' && isSender) {
            clearConversation = true;
        }
        // 如果是部门群解散，直接删除群组
        // getGroups([message.targetId], function (errorCode, groupList) {
        //     if (errorCode) {
        //         return;
        //     }
        //     var group = groupList[0];
        //     if (+group.type !== 0 && actionText === 'Dismiss') {
        //         conversationApi.remove(RongIMLib.ConversationType.GROUP, message.targetId);
        //     }
        // });
        Group.concatRequest(message.targetId).then((group) => {
            if (!group) {
                // eslint-disable-next-line no-console
                console.error('group is undefined!!', message);
                return;
            }
            if (+group.type !== 0 && actionText === 'Dismiss') {
                conversationApi.remove(RongIMLib.ConversationType.GROUP, message.targetId);
            }
        });
        // clearConversation = clearConversation || (['Kick'].indexOf(actionText) >=0 && includeMe);
        return {
            group: clearGroup,
            conversation: clearConversation,
        };
    }

    Group.batchMembers = function (idList) {
        const url = '/groups/batch/members';
        const data = {
            ids: idList,
        };
        const defer = $.Deferred();
        Http.post(url, data).done((result) => {
            let notHaveUserInfo = [];
            result.forEach((group) => {
                notHaveUserInfo = notHaveUserInfo.concat(group.member_infos.filter(member => !member.name));
            });
            if (notHaveUserInfo.length === 0) {
                defer.resolve(result);
                return;
            }
            const notHaveInfoUserId = notHaveUserInfo.map(member => member.id);
            userApi.getBatch(notHaveInfoUserId, () => {
                notHaveUserInfo.forEach((member) => {
                    const user = Cache.user[member.id];
                    if (user) {
                        member.name = user.name;
                        member.portrait_url = user.avatar;
                    }
                });
                defer.resolve(result);
            });
        });
        return defer.promise();
    };

    // 不提供回调，获取后直接在缓存中获取
    Group.getBatchGroups = function (idList, isCover) {
        const requestIdList = [];
        const promiseList = [];
        idList.forEach((id) => {
            let defer = Cache.group._defer[id];
            const group = Cache.group[id];
            if (defer) {
                promiseList.push(defer.promise());
            } else if (utils.isEmpty(group) || isCover) {
                defer = $.Deferred();
                promiseList.push(defer.promise());
                requestIdList.push(id);
                Cache.group._defer[id] = defer;
            }
        });

        if (requestIdList.length > 0) {
            const url = '/groups/batch';
            // 复制一份防止被修改
            const data = {
                ids: requestIdList.concat(),
            };
            Http.post(url, data).done((groups) => {
                const groupIds = [];
                groups.forEach((group) => {
                    group.avatar = group.portrait_url;
                    group.admin_id = group.manager_id;
                    groupIds.push(group.id);
                    const organization = orgApi.getLocalDept(group.organization_id);
                    if (organization.type === common.OrgType.COMPANY) {
                        const co = orgApi.getLocalCompany(group.organization_id) || {};
                        organization.fullName = co.fullName;
                    }
                    group.organization = organization;
                    group.groupMembers = [];
                    group.member_id_list = [];
                    group.creator_name = '';
                    group.is_creator = group.admin_id === Cache.auth.id;
                });
                Group.batchMembers(groupIds).then((result) => {
                    const groupFirstNine = {};
                    result.forEach((item) => {
                        groupFirstNine[item.group_id] = item.member_infos.map(member => ({
                            id: member.id,
                            name: member.name,
                            avatar: member.portrait_url,
                        }));
                    });
                    groups.forEach((group) => {
                        group.firstNine = groupFirstNine[group.id];
                        Cache.group[group.id] = group;
                    });
                    requestIdList.forEach((id) => {
                        Cache.group._defer[id].resolve();
                        delete Cache.group._defer[id];
                    });
                }, (error) => {
                    requestIdList.forEach((id) => {
                        Cache.group._defer[id].reject(error);
                        delete Cache.group._defer[id];
                    });
                });
            }).fail((error) => {
                requestIdList.forEach((id) => {
                    Cache.group._defer[id].reject(error);
                    delete Cache.group._defer[id];
                });
            });
        }

        const groupDefer = $.Deferred();
        $.when.apply(null, promiseList).then(() => {
            groupDefer.resolve();
        }).fail((errorCode) => {
            groupDefer.reject(errorCode);
        });
        return groupDefer.promise();
    };

    function getOneGroup(id) {
        if (Cache.group._defer[id]) {
            return Cache.group._defer[id].promise();
        }

        const defer = $.Deferred();
        Cache.group._defer[id] = defer;
        const url = `/groups/${id}`;
        Http.get(url).then((group) => {
            group.avatar = group.portrait_url;
            group.admin_id = group.manager_id;
            const organization = orgApi.getLocalDept(group.organization_id);
            if (organization.type === common.OrgType.COMPANY) {
                const co = orgApi.getLocalCompany(group.organization_id) || {};
                organization.fullName = co.fullName;
            }
            group.organization = organization;
            Group.batchMembers([group.id]).then((result) => {
                group.firstNine = ((result[0] || {}).member_infos || []).map(item => ({
                    id: item.id,
                    name: item.name,
                    avatar: item.portrait_url,
                }));
                group.member_id_list = [];
                group.creator_name = '';
                group.is_creator = group.admin_id === Cache.auth.id;
                group.groupMembers = [];
                Cache.group[id] = group;
                defer.resolve(group);
            }, (error) => {
                defer.reject(error);
            });
        }).fail(() => {
            utils.console.warn('getGroup', id);
            const group = {
                id,
                firstNine: [],
                member_id_list: [],
            };
            const thisGroup = Cache.group[id] || group;
            // Cache.group[id] = thisGroup;
            defer.resolve(thisGroup);
        }).always(() => {
            delete Cache.group._defer[id];
        });
        return defer.promise();
    }

    // 获取群昵称
    Group.getGroupAlias = function (userId, members) {
        let groupAlias = '';
        members.forEach((member) => {
            if (member.id === userId) {
                groupAlias = member.alias;
            }
        });
        return groupAlias;
    };

    // 更新某个群成员的信息
    Group.updateGroupMember = function (user) {
        const groups = Cache.group;
        Object.keys(groups).forEach((item) => {
            if (item !== '_defer') {
                const group = groups[item];
                const index = group.member_id_list.indexOf(user.id);
                if (index > -1 && group.groupMembers) {
                    $.extend(group.groupMembers[index], user);
                }
            }
        });
    };

    let timeoutConcatRequest = null;
    let delayGroupIdList = [];
    const concatRequestDefer = {};
    Group.concatRequest = function (groupId) {
        let defer = concatRequestDefer[groupId];
        if (!defer) {
            concatRequestDefer[groupId] = $.Deferred();
            defer = concatRequestDefer[groupId];
        }
        clearTimeout(timeoutConcatRequest);
        delayGroupIdList.push(groupId);
        timeoutConcatRequest = setTimeout(() => {
            const idList = [].concat(delayGroupIdList);
            delayGroupIdList = [];
            Group.getBatchGroups(idList).then(() => {
                idList.forEach((id) => {
                    if (concatRequestDefer[id]) {
                        concatRequestDefer[id].resolve(Cache.group[id]);
                        concatRequestDefer[id] = null;
                    }
                });
            }, () => {
                idList.forEach((id) => {
                    if (concatRequestDefer[id]) {
                        concatRequestDefer[id].reject();
                        concatRequestDefer[id] = null;
                    }
                });
            });
        }, 500);
        return defer.promise();
    };

    RongIM.dataModel.Group = Group;
};
