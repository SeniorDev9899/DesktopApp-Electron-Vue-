import IMWin from '../../browserWindow';
import { getAppKey, getNaviURL } from '../../cache/helper';

/* eslint-disable */

export default function(RongIM) {

var dataModel = RongIM.dataModel;

var utils = RongIM.utils;
var common = RongIM.common;
var ConversationType = RongIM.utils.conversationType;
var voipInviteMember = RongIM.dialog.voipInviteMember;
var getUserInfo = dataModel.User.get;
var insertMessage = dataModel.Message.insertMessage;

var ErrorCode = {
    uninit: 1,
    busying: 2
};
// 正在音视频中
var busying = false;
// 窗口打开加载中
var loading = false;
// 音视频被禁用，直接不处理相关消息
var disabled = false;
// 窗口打开加载过程中收到的消息存在队列里
var messageCache = [];
var current = null;

function regListener(listenerKey, callback) {
    RongDesktop.ipcRenderer.on(listenerKey, callback);
}

function unRegListener(listenerKey) {
    var events = RongDesktop.ipcRenderer._events[listenerKey];
    if (events instanceof Function) {
        RongDesktop.ipcRenderer.removeListener(listenerKey, events);
    } else if (events instanceof Array) {
        events.forEach(function(event) {
            RongDesktop.ipcRenderer.removeListener(listenerKey, event);
        });
    }
}

var CallWin = {
    openWin: function (callback) {
        RongDesktop.voipOpener.open({
            userid: RongIM.instance.auth.id,
            locale: RongIM.instance.config.locale,
            appkey: getAppKey(),
            navi: getNaviURL(),
            token: RongIM.instance.auth.token
        });
        var openCallback = function () {
            unRegListener('onVoipReady', openCallback);
            callback();
        };
        regListener('onVoipReady', openCallback);
    },
    IMRequest: function (params) {
        RongDesktop.voipOpener.IMRequest(params);
    },
    regonVoipReady: function (callback) {
        regListener('onVoipReady', callback);
    },
    unregonVoipReady: function (callback) {
        unRegListener('onVoipReady', callback);
    },
    regVoipRequest: function (callback) {
        regListener('onVoipRequest', callback);
    },
    unregVoipRequest: function () {
        unRegListener('onVoipRequest');
    },
    regClose: function (callback) {
        regListener('onClose', callback);
    },
    unregClose: function () {
        unRegListener('onClose');
    }
};

var voipCommandHandler = {
    addMember: function(params) {
        var req = {
            type: 'commandCallback',
            data: {
                command: params.command
            }
        };
        IMWin.focus();
        if (voipCommandHandler.busy) {
            return ;
        }
        voipCommandHandler.busy = true;
        voipInviteMember(params.targetId, params.memberIdList, params.type).done(function (list) {
            req.data.error = null;
            req.data.result = list;
            CallWin.IMRequest(req);
        }).fail(function () {
            req.data.error = 'no choose';
            CallWin.IMRequest(req);
        }).always(function () {
            voipCommandHandler.busy = false;
        });
    },
    summary: function (params, messageApi) {
        var message = params.message;
        insertSummaryMessage(message, messageApi);
    },
    other: function (params) {
        MessageCtrl.sendCommand(params, function (error, result) {
            var req = {
                type: 'commandCallback',
                data: {
                    command: params.command,
                    error: error,
                    result: result
                }
            };
            CallWin.IMRequest(req);
        });
    }
};

var voipMessageHandler = {
    InviteMessage: function(req) {
        var selfId = RongIM.instance.auth.id;
        var message = req.data;
        if (message.messageDirection === RongIMLib.MessageDirection.SEND) {
            /*多端同步自己发起邀请*/
            return;
        }
        var inviteIdList = message.content.inviteUserIds;
        var hasSelf = inviteIdList.indexOf(selfId) !== -1;
        if (!hasSelf) {
            return;
        }
        // 39239 - 【音视频】群禁言时，收到音视频消息应不能接听
        // If targetId is group then check if the group is banned
        const targetId = message.targetId;
        const groupApi = dataModel.Group;
        groupApi.getNewGroup(targetId, (error, group) => {
            if (!error || !utils.isEmpty(group) || targetId === group.id) {
                const members = group.groupMembers;
                const selfInfo = members.filter(member => member.id === selfId)[0] || {};
                const isCantNotSpeak = group.is_all_mute && selfInfo.mute_status !== 2 && selfInfo.id !== group.admin_id;
                const isBanned = selfInfo.mute_status === 1;
                const isRole = selfInfo.role === 1;
                if ((isCantNotSpeak || isBanned) && !isRole) {
                    return;
                }
            }
            var senderUserId = message.senderUserId;
            var ids = inviteIdList.concat(senderUserId);
            getUserInfo(ids, function (errorCode, list) {
                message.senderUser = list.pop();
                message.inviteUserList = list;
                message.self = list.filter(function (item) {
                    if (item.id === selfId) {
                        return true;
                    }
                    return false;
                })[0];
                if (loading) {
                    messageCache.push(req);
                    return;
                }
                if (busying) {
                    CallWin.IMRequest(req);
                    return;
                }
                loading = true;
                console.log('[voip] [InviteMessage] openWin');
                CallWin.openWin(function () {
                    console.log('[voip] [InviteMessage] openWin callback');
                    openCallback(req);
                });
            });
        });
    },
    MemberModifyMessage: function (req) {
        var selfId = RongIM.instance.auth.id;
        var message = req.data;
        if (message.messageDirection === RongIMLib.MessageDirection.SEND) {
            /*多端同步自己发起成员添加*/
            return;
        }
        // fix: 移动端与 PC 端属性名称不一致
        if (message.content.existedUserPofiles) {
            message.content.existedMemberStatusList = message.content.existedUserPofiles;
        }
        var existedIdList = message.content.existedMemberStatusList.filter(function (item) {
            return item.callStatus !== common.RCCallStatus.RCCallHangup;
        }).map(function (item) {
            return item.userId;
        });

        var inviteIdList = message.content.inviteUserIds;
        var isInvited = inviteIdList.indexOf(selfId) !== -1;
        var alreadExist = existedIdList.indexOf(selfId) !== -1;
        if (!isInvited && !alreadExist) {
            return;
        }
        var idList = inviteIdList.concat(existedIdList);
        getUserInfo(idList, function (errorCode, list) {
            if (errorCode) {
                return ;
            }
            req.data.self = list.filter(function (item) {
                if (item.id === selfId) {
                    return true;
                }
                return false;
            })[0];
            req.data.inviteUserList = list.filter(function (item) {
                if (inviteIdList.indexOf(item.id) > -1) {
                    return true;
                }
                return false;
            });
            req.data.existedUserList = list.filter(function (item) {
                if (existedIdList.indexOf(item.id) > -1) {
                    return true;
                }
                return false;
            });
            if (loading) {
                messageCache.push(req);
                return;
            }
            if (busying) {
                CallWin.IMRequest(req);
                return;
            }
            if (isInvited) {
                loading = true;
                CallWin.openWin(function () {
                    openCallback(req);
                });
            }
        });
    },
    HungupMessage: function (req) {
        var message = req.data;
        // if (message.messageDirection === RongIMLib.MessageDirection.SEND) {
        //     /*多端同步自己挂断*/
        //     return;
        // }
        CallWin.IMRequest(req);
    },
    other: function (req) {
        CallWin.IMRequest(req);
    }
};

function openCallback(req) {
    CallWin.IMRequest(req);

    loading = false;
    busying = true;
    messageCache.forEach(function (item) {
        CallWin.IMRequest(item);
    });
    messageCache = [];
}

function insertSummaryMessage(message) {
    var content = message.content;
    var receivedStatus = RongIMLib.ReceivedStatus.READ;
    var sentStatus = RongIMLib.SentStatus.READ;
    var summaryCode = content.status;
    // 1 取消 15 对方未接听
    var receiverUnread = [1, 15].indexOf(summaryCode) !== -1;
    if (receiverUnread) {
        sentStatus = RongIMLib.SentStatus.SENT;
    }
    // 5 未接听 11 对方已取消
    var selfUnread = [5, 11].indexOf(summaryCode) !== -1;
    if (selfUnread) {
        receivedStatus = RongIMLib.ReceivedStatus.UNREAD;
    }
    var params = {
        conversationType: message.conversationType,
        targetId: message.targetId,
        messageType: 'VideoSummaryMessage',
        content: content,
        senderUserId: message.senderUserId,
        sentStatus: sentStatus,
        receivedStatus: receivedStatus,
        direction: message.messageDirection
    };
    insertMessage(params);
}

function init() {
    CallWin.regVoipRequest(function (event, params) {
        var handle = voipCommandHandler[params.command] || voipCommandHandler.other;
        handle(params);
    });

    MessageCtrl.watch(function (message) {
        utils.console.log('[voip][MessageCtrl.watch]', message);
        if (disabled) {
            return;
        }
        var req = {
            type: 'message',
            data: message
        };
        if (loading) {
            messageCache.push(req);
            return ;
        }
        var handle = voipMessageHandler[message.messageType] || voipMessageHandler.other;
        handle(req);
    });

    CallWin.regClose(function () {
        busying = false;
        // 41358 -  【在线会议】音视频通话中，创建会议或者加入参与过的会议，仍可加入
        window.localStorage.setItem('videoCall', 'notOn');
    });
}

function startVoip(params) {
    if (busying || loading) {
        return;
    }
    loading = true;
    console.log('[voip] [start] openWin');
    CallWin.openWin(function () {
        console.log('[voip] [start] openWin callback');
        openCallback(params);
    });
}

function start(params, callback) {
    callback = callback || $.noop;
    if (busying) {
        return callback(ErrorCode.busying, current);
    }
    current = params;

    var conversation = params.conversation;
    var isPrivate = conversation.conversationType === ConversationType.PRIVATE;
    var selfId = RongIM.instance.auth.id;
    var arg = {
        type: 'message',
        data: {
            messageType: 'Call',
            conversationType: conversation.conversationType,
            targetId: conversation.targetId,
            self: {},
            mediaType: params.type
        }
    };
    if (isPrivate) {
        var inviteUserIds = [conversation.targetId, selfId];
        getUserInfo(inviteUserIds, function (errorCode, list) {
            arg.data.self = list.pop();
            arg.data.inviteUserList = list;
            startVoip(arg);
        });
    } else {
        getUserInfo(selfId, function (errorCode, selfInfo) {
            arg.data.self = selfInfo;
            var targetId = conversation.targetId;
            voipInviteMember(targetId, [], params.type).done(function (memberList) {
                arg.data.inviteUserList = memberList;
                startVoip(arg);
            });
        });
    }
}

function disable(value) {
    disabled = !!value;
}

function destroy() {
    // 解绑监听销毁数据
}

function getStatus() {
    return {
        isBusying: busying,
        current: current
    };
}

function close() {
    var params = {
        type: 'message',
        data: {
            messageType: 'Close'
        }
    };
    CallWin.IMRequest(params);
}

window.RCCall = {
    ErrorCode: ErrorCode,
    init: init,
    start: start,
    close: close,
    disable: disable,
    destroy: destroy,
    getStatus: getStatus
};

}
