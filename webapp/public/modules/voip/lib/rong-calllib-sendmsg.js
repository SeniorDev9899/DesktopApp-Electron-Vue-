'use strict';
(function(dependencies) {

    // patch c++ SDK 多端时发送一条消息，会再收到一条同样 messageUId 的消息这里记录一下做排除
    var cacheMessageUIdList = [];
    var MAXCACHE = 500;

    var global = dependencies.global;
    var util = {
        noop: function () {},
        forEach: function (obj, callback) {
            if (typeof obj.forEach === 'function') {
                obj.forEach(callback);
            } else {
                for (var key in obj) {
                    callback(obj[key], key, obj);
                }
            }
        }
    };
    function ObserverList() {

        var checkIndexOutBound = function(index, bound) {
            return index > -1 && index < bound;
        };

        this.observerList = [];

        this.add = function(observer, force) {
            force && (this.observerList.length = 0);
            this.observerList.push(observer);
        };

        this.get = function(index) {
            if (checkIndexOutBound(index, this.observerList.length)) {
                return this.observerList[index];
            }
        };

        this.count = function() {
            return this.observerList.length;
        };

        this.removeAt = function(index) {
            checkIndexOutBound(index, this.observerList.length) && this.observerList.splice(index, 1);
        };

        this.remove = function(observer) {
            if (!observer) {
                this.observerList.length = 0;
                return;
            }
            observer = Object.prototype.toString.call(observer) == '[object Function]' ? [observer] : observer;
            for (var i = 0, len = this.observerList.length; i < len; i++) {
                if (this.observerList[i] === observer[i]) {
                    this.removeAt(i);
                    break;
                }
            }
        };

        this.notify = function(val) {
            for (var i = 0, len = this.observerList.length; i < len; i++) {
                this.observerList[i](val);
            }
        };

        this.indexOf = function(observer, startIndex) {
            var i = startIndex || 0,
                len = this.observerList.length;
            while (i < len) {
                if (this.observerList[i] === observer) {
                    return i;
                }
                i++;
            }
            return -1;
        };
    }

    var RongIMLib = dependencies.RongIMLib;
    var RongIMClient = RongIMLib.RongIMClient;

    var messageTypes = {
        AcceptMessage: RongIMLib.AcceptMessage,
        RingingMessage: RongIMLib.RingingMessage,
        SummaryMessage: RongIMLib.SummaryMessage,
        HungupMessage: RongIMLib.HungupMessage,
        InviteMessage: RongIMLib.InviteMessage,
        MediaModifyMessage: RongIMLib.MediaModifyMessage,
        MemberModifyMessage: RongIMLib.MemberModifyMessage
    };

    /*
        根据 MessageType 返回 message 对象
        var params = {
            messageType:'TextMessage',
            content: { content: 'hello'}    // 消息体
        };
        var textMsg = messageFactory(params);
    */
    var messageFactory = function(params) {
        var content = params.content;
        var message = messageTypes[params.messageType] || util.noop;
        return new message(content);
    };

    var sendMessage = function(params, callback) {
        callback = callback || util.noop;

        var msg = messageFactory(params);

        var conversationType = params.conversationType;
        var targetId = params.targetId;

        var im = RongIMClient.getInstance();

        var isMentioned = false;
        var pushText = params.pushText || '';
        var appData = params.appData || '';
        var methodType = null;
        console.debug('[im] [sendMessage]', msg);
        im.sendMessage(conversationType, targetId, msg, {
            onSuccess: function(message) {
                cacheMessageUIdList.unshift(message.messageUId);
                if (cacheMessageUIdList.length > MAXCACHE) {
                    cacheMessageUIdList.pop();
                }
                var error = null;
                callback(error, message);
            },
            onError: function(code) {
                callback(code);
            }
        }, isMentioned, pushText, appData, methodType, params);
    };

    var commandItem = {
        /*
            params.conversationType
            params.targetId
            params.content
         */
        invite: function(params, callback) {
            params.messageType = 'InviteMessage';

            var content = params.content;

            var mediaType = content.mediaType;
            var inviteUserIds = content.inviteUserIds;
            var callId = content.callId;

            var appData = {
                mediaType: mediaType,
                userIdList: inviteUserIds,
                callId: callId
            };

            var pushItem = {
                1: '您有一条音频通话',
                2: '您有一条视频通话'
            };
            params.pushText = pushItem[mediaType];
            params.appData = JSON.stringify(appData);
            params.userIds = inviteUserIds;
            sendMessage(params, callback);
        },
        ringing: function(params, callback) {
            params.messageType = 'RingingMessage';
            sendMessage(params, callback);
        },
        /*
            params.conversationType
            params.targetId
            params.content
         */
        accept: function(params, callback) {
            params.messageType = 'AcceptMessage';
            sendMessage(params, callback);
        },

        /*
           params.conversationType
           params.targetId
           params.content
        */
        hungup: function(params, callback) {
            params.messageType = 'HungupMessage';
            sendMessage(params, callback);
        },
        /*
            params.conversationType
            params.targetId
            params.content
         */
        mediaModify: function(params, callback) {
            params.messageType = 'MediaModifyMessage';
            sendMessage(params, callback);
        },
        memberModify: function(params, callback) {
            params.messageType = 'MemberModifyMessage';
			var content = params.content;
            var userIds = [];
            var inviteUserIds = content.inviteUserIds;
            var existList = content.existedMemberStatusList;

            const crtUserId = RongIMClient.getInstance().getCurrentUserId();

            util.forEach(inviteUserIds, function(userId){
                userIds.push(userId);
            });

            util.forEach(existList, function(user){
                var userId = user.userId;
                userId !== crtUserId && userIds.push(userId);
            });
            params.userIds = userIds;
            sendMessage(params, callback);
        },
        getToken: function(params, callback) {
            callback(null, '');
        }
    };
    /*
        var params = {
            command: 'invite' | 'ringing' | 'accept' | 'hungup' | 'mediaModify' | 'memberModify' | 'getToken',
            data: {
                conversationType: 1,
                targetId: '',
                content: {}
            }
        };
     */
    var sendCommand = function(params, callback) {
        var command = params.command;
        var data = params.data;
        commandItem[command] && commandItem[command](data, callback);
    };

    var watcher = new ObserverList();

    var watch = function(listener) {
        watcher.add(listener);
    };

    // WebSDK VoIP message adapter.
    RongIMClient._voipProvider = {
        onReceived: function(message) {
            console.debug('[im] [received]', message);

            // patch 排除自己发的消息
            var isSelfClientSendMessage = cacheMessageUIdList.indexOf(message.messageUId) > -1;
            if (message.offLineMessage || isSelfClientSendMessage) {
                return;
            }
            watcher.notify(message);
        },
        isVoipMessage (message) {
            return /^RC:VC/.test(message.objectName)
        }
    };

    global.MessageCtrl = {
        sendCommand: sendCommand,
        watch: watch
    };

})({
    global: window,
    RongIMLib: RongIMLib
});
