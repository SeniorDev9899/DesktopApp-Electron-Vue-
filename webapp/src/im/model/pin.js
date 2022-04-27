/* eslint-disable no-param-reassign */
/* eslint-disable no-underscore-dangle */
/* eslint-disable func-names */

import UploadStatus from '../utils/UploadStatus';
import store from '../utils/cache';

export default (RongIM) => {
    const Http = RongIM.dataModel._Http;
    const Cache = RongIM.dataModel._Cache;
    const ObserverList = RongIM.dataModel._ObserverList;
    const common = RongIM.common;

    let userApi = RongIM.dataModel.User;
    const fileApi = RongIM.dataModel.File;

    const Pin = {
        observerList: new ObserverList(),
    };
    const pinObserverList = Pin.observerList;

    Cache.pin = {
        attach: {},
    };

    Pin.cleanCache = function () {
        Cache.pin = {
            attach: {},
        };
    };

    Pin.loadApi = function () {
        userApi = RongIM.dataModel.User;
    };

    function addUserToList(list, key) {
        const def = $.Deferred();
        let count = 0;
        if (list.length === 0) {
            def.resolve();
            return def;
        }
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
        return def;
    }

    Pin.registerMessage = function () {
    // Pin消息创建
        let messageName = 'PinNotifyMessage';
        let objectName = 'RCE:Pin';
        let messageTag = new RongIMLib.MessageTag(false, false);
        let properties = ['creatorUid', 'pinUid', 'timestamp', 'content'];
        RongIMClient.registerMessageType(messageName, objectName, messageTag, properties);

        // Pin被评论
        messageName = 'PinCommentMessage';
        objectName = 'RCE:PinComment';
        messageTag = new RongIMLib.MessageTag(false, false);
        properties = ['publisherUid', 'pinUid', 'timestamp', 'comment'];
        RongIMClient.registerMessageType(messageName, objectName, messageTag, properties);

        // Pin被确认
        messageName = 'PinConfirmMessage';
        objectName = 'RCE:PinConfirm';
        messageTag = new RongIMLib.MessageTag(false, false);
        properties = ['operatorUid', 'pinUid', 'timestamp'];
        RongIMClient.registerMessageType(messageName, objectName, messageTag, properties);

        // Pin新添加了联系人
        messageName = 'PinNewReciverMessage';
        objectName = 'RCE:PinNewReceiver';
        messageTag = new RongIMLib.MessageTag(false, false);
        properties = ['pinUid', 'timestamp', 'receivers'];
        RongIMClient.registerMessageType(messageName, objectName, messageTag, properties);

        // Pin一端删除，其他端收到该消息
        messageName = 'PinDeletedMessage';
        objectName = 'RCE:PinDeleted';
        messageTag = new RongIMLib.MessageTag(false, false);
        properties = ['pinUid', 'timestamp'];
        RongIMClient.registerMessageType(messageName, objectName, messageTag, properties);

        // pin评论阅读状态，多端同步消息
        messageName = 'PinCommentReadMessage';
        objectName = 'RCE:PinCommentRead';
        messageTag = new RongIMLib.MessageTag(false, false);
        properties = ['pinUid', 'timestamp'];
        RongIMClient.registerMessageType(messageName, objectName, messageTag, properties);
    };

    function notifyPin(message) {
        pinObserverList.notify(message);
    }

    Pin.messageCtrol = {
        PinNotifyMessage(message) {
            notifyPin(message);
        },
        PinCommentMessage(message) {
            notifyPin(message);
        },
        PinConfirmMessage(message) {
            if (message.content && Cache.auth && message.content.operatorUid !== Cache.auth.id) {
                notifyPin(message);
            }
            Pin.notifyUnReadCount(message.content.pinUid);
        },
        PinNewReciverMessage(message) {
            notifyPin(message);
        },
        PinDeletedMessage(message) {
            notifyPin(message);
        },
        PinCommentReadMessage(message) {
            notifyPin(message);
        // Pin.notifyUnReadCount(message.content.pinUid);
        },
    };

    Pin.create = function (params, callback) {
        Http.post('/pins', params)
            .then((result) => {
                callback(null, result);
            }).fail(callback);
    };

    Pin.getInbox = function (timestamp, callback) {
        let url = '/pins/inbox?limit=20&start=0';
        url += timestamp ? `&end=${timestamp}` : '';
        Http.get(url)
            .then((result) => {
                $.when(addUserToList(result.data, 'creator_uid'))
                    .done(() => {
                        callback(null, result);
                    });
            }).fail(callback);
    };

    Pin.getOutbox = function (timestamp, callback) {
        let url = '/pins/outbox?limit=20&start=0';
        url += timestamp ? `&end=${timestamp}` : '';
        Http.get(url)
            .then((result) => {
                $.when(addUserToList(result.data, 'creator_uid'))
                    .done(() => {
                        callback(null, result);
                    });
            }).fail(callback);
    };

    Pin.getInboxUnRead = function (callback) {
        const url = '/pins/inbox/unread';
        Http.get(url)
            .then((result) => {
                $.when(addUserToList(result, 'creator_uid'))
                    .done(() => {
                        callback(null, result);
                    });
            }).fail(callback);
    };

    Pin.getOutboxUnRead = function (callback) {
        const url = '/pins/outbox/unread';
        Http.get(url)
            .then((result) => {
                $.when(addUserToList(result, 'creator_uid'))
                    .done(() => {
                        callback(null, result);
                    });
            }).fail(callback);
    };

    Pin.getPinDetail = function (id, callback) {
        const url = `/pins/${id}`;
        Http.get(url)
            .then((result) => {
                $.when(addUserToList([result], 'creator_uid'))
                    .done(() => {
                        callback(null, result);
                    });
            }).fail(callback);
    };
    Pin.getReceiverList = function (uid, callback) {
        const url = `/pins/${uid}/receivers`;
        Http.get(url)
            .then((result) => {
                result.forEach((item) => {
                    item.user = {
                        id: item.receiver_uid,
                        name: item.name,
                        avatar: item.portrait_url,
                    };
                });
                const notUserInfo = result.filter(item => !item.name);
                $.when(addUserToList(notUserInfo, 'receiver_uid'))
                    .done(() => {
                        callback(null, result);
                    });
            }).fail(callback);
    };
    Pin.getCommentList = function (uid, callback) {
        const url = `/pins/${uid}/comments`;
        Http.get(url)
            .then((result) => {
                $.when(addUserToList(result, 'publisher_uid'))
                    .done(() => {
                        callback(null, result);
                    });
            }).fail(callback);
    };

    Pin.deletePin = function (uid, callback) {
        const url = `/pins/${uid}`;
        Http.del(url)
            .then((result) => {
                callback(null, result);
            }).fail(callback);
    };

    Pin.comment = function (uid, comment, parentCommentUid, callback) {
        const params = { comment };
        if (parentCommentUid) {
            params.parent_comment_uid = parentCommentUid;
        }
        const url = `/pins/${uid}/comments`;
        Http.post(url, params)
            .then((result) => {
                callback(null, result);
            }).fail(callback);
    };

    Pin.confirm = function (uid, callback) {
        const url = `/pins/${uid}/confirm`;
        Http.post(url)
            .then((result) => {
                callback(null, result);
            }).fail(callback);
    };

    Pin.getUnReadCount = function (callback) {
        const url = '/pins/unreadcommentcount';
        Http.get(url)
            .then((result) => {
                console.log('unreadcommentcount-result', result);
                callback(null, result);
            }).fail(callback);
    };

    Pin.getUnConfirmCount = function (callback) {
        const url = '/pins/unconfirmedcount';
        Http.get(url)
            .then((result) => {
                console.log('unconfirmedcount-result', result);
                callback(null, result);
            }).fail(callback);
    };

    Pin.getAttachments = function (uid, callback) {
        const url = `/pins/${uid}/attachments`;
        Http.get(url)
            .then((result) => {
                callback(null, result);
            }).fail(callback);
    };

    Pin.addReceivers = function (uid, ids, callback) {
        const url = `/pins/${uid}/receivers`;
        const params = {
            ids,
        };
        Http.post(url, params)
            .then((result) => {
                callback(null, result);
            });
    };

    Pin.addPinLocalAttach = function (name, path) {
        const key = 'pin-attachs';
        const local = store.get(key) || {};
        local[name] = path;
        store.set(key, local);
    };

    Pin.getToken = function (callback) {
        const url = '/user/media_token/1';
        Http.get(url)
            .then((result) => {
                callback(null, result);
            }).fail(callback);
    };

    function expendUploadAttach(attach, uploadFile, uploadCallback) {
        // 标识上传id,用于断点续传
        attach.data.uploadId = attach.uploadId;
        attach.cancel = function (callback) {
            callback = callback || $.noop;
            attach.uploadStatus = UploadStatus.CANCELLED;
            uploadFile.cancel();
            callback();
        };
        attach.upload = function () {
            if (attach.uploadStatus === UploadStatus.READY || attach.uploadStatus === UploadStatus.CANCELLED) {
                attach.uploadStatus = UploadStatus.UPLOADING;
                uploadFile.upload(attach.data, uploadCallback);
            }
        };
    }

    Pin.uploadAttach = function (type, fileData, attach, callback) {
        const config = RongIM.config.upload[type] || RongIM.config.upload.file;
        config.timeout = RongIM.config.upload.timeout;
        config.chunk_size = RongIM.config.upload.file.chunkSize;
        const domain = '';
        if (type === 'base64') {
            config.data = UploadClient.dataType.data;
        }
        config.getToken = function (done) {
            const fileType = type === 'image' ? RongIMLib.FileType.IMAGE : RongIMLib.FileType.FILE;
            fileApi.getFileToken(done, fileType);
        };
        const actionMap = {
            file: 'initFile',
            image: 'initImage',
            base64: 'initImgBase64',
        };
        const action = actionMap[type];
        const uploadCallback = {
            onBeforeUpload() {
            },
            onProgress(loaded, total) {
                const percent = Math.floor(loaded / total * 100);
                attach.progress = percent;
            },
            onCompleted(data) {
                let url = common.getDownloadUrl(RongIM.config, data);
                url = url || `${window.location.protocol}//${domain}/${data.key}`;
                attach.progress = 100;
                attach.uploadStatus = UploadStatus.SUCCESS;
                attach.url = url;
                if (callback) callback(null);
            },
            onError(errorCode) {
                if (callback) callback(`upload-${errorCode}`);
            },
        };

        UploadClient[action](config, (uploadFile) => {
            expendUploadAttach(attach, uploadFile, uploadCallback);
            attach.upload();
        });
    };

    Pin.getPinLocalAttach = function (name) {
        const key = 'pin-attachs';
        const local = store.get(key) || {};
        return local[name];
    };

    Pin.removeLocalAttach = function (name) {
        const key = 'pin-attachs';
        const local = store.get(key) || {};
        delete local[name];
        store.set(key, local);
    };

    Pin.watch = function (listener) {
        pinObserverList.add(listener);
    };

    Pin.unwatch = function (listener) {
        pinObserverList.remove(listener);
    };

    Pin.MessageType = {
        PinNotifyMessage: 'PinNotifyMessage',
        PinCommentMessage: 'PinCommentMessage',
        PinConfirmMessage: 'PinConfirmMessage',
        PinNewReciverMessage: 'PinNewReciverMessage',
        PinDeletedMessage: 'PinDeletedMessage',
        PinCommentReadMessage: 'PinCommentReadMessage',
    };

    Pin.notifyUnReadCount = function (pinUid) {
        pinUid = pinUid || '';
        const message = {
            messageType: Pin.MessageType.PinCommentReadMessage,
            content: {
                pinUid,
            },
        };
        pinObserverList.notify(message);
    };

    RongIM.dataModel.Pin = Pin;
};
