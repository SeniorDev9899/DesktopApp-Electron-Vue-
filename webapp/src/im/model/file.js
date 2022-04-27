/* eslint-disable no-multi-assign */
/* eslint-disable no-console */
/* eslint-disable no-param-reassign */
/* eslint-disable no-underscore-dangle */

import UploadStatus from '../utils/UploadStatus';
/* 文件上传/下载 */
export default (RongIM) => {
    const Cache = RongIM.dataModel._Cache;
    let { config } = RongIM.dataModel;

    const utils = RongIM.utils;
    const common = RongIM.common;

    let messageApi = null;
    let conversationApi = null;

    const File = {};

    // token 缓存并维持，避免频繁获取
    const TokenCache = {};

    File.loadApi = function loadApi() {
        messageApi = RongIM.dataModel.Message;
        conversationApi = RongIM.dataModel.Conversation;
        config = RongIM.dataModel.config;
    };

    function getTokenHandle(callback, type, isDownload) {
    // 上传与下载场景下 token 不可共用，需分开缓存
        const key = `${type}_${Boolean(isDownload)}`;
        const cache = TokenCache[key];
        // 优先使用缓存，维系 50 分钟
        if (cache && Date.now() - cache.timestamp < 50 * 60 * 1000) {
            callback(null, cache.token);
            return;
        }
        // 缓存强制失效
        TokenCache[key] = null;

        RongIMClient.getInstance().getFileToken(type, {
            onSuccess(data) {
                let token = data.token;
                if (isDownload) {
                    token = utils.base64Encode(token);
                }
                // 缓存 token 数据
                TokenCache[key] = {
                    timestamp: Date.now(),
                    token,
                };
                callback(null, token);
            },
            onError(error) {
                callback(error);
            },
        });
    }
    function getToken(callback, type, isDownload) {
        getTokenHandle((error, token) => {
            if (error) {
                common.toastError('network-error');
                return;
            }
            callback(token);
        }, type, isDownload);
    }
    File.getFileToken = getToken;

    function getFileDownloadToken(callback) {
        getTokenHandle(callback, RongIMLib.FileType.FILE, true);
    }
    File.getFileDownloadToken = getFileDownloadToken;

    function getImageDownloadToken(callback) {
        getToken(callback, RongIMLib.FileType.IMAGE, true);
    }
    File.getImageDownloadToken = getImageDownloadToken;

    function expendUploadMessage(uploadMessage, uploadFile, uploadCallback) {
        const uploadId = uploadMessage.content.uploadId;
        File.uploadManage.add(uploadId, uploadMessage);
        // 标识上传id,用于断点续传
        const isFile = uploadMessage.dataType === RongIMLib.FileType.FILE;
        if (isFile) {
            uploadMessage.data.uploadId = uploadId;
        }
        uploadMessage.suspend = function suspend(callback) {
            callback = callback || $.noop;
            uploadFile.cancel();
            callback();
        };
        uploadMessage.cancel = function cancel(callback) {
            File.uploadManage.remove(uploadId, uploadMessage);
            callback = callback || $.noop;
            uploadMessage.uploadStatus = UploadStatus.CANCELLED;
            uploadFile.cancel();
            callback();
        };
        uploadMessage.upload = function upload() {
            // TODO: expendUploadMessage 中判断需优化
            // console.log('todo: expendUploadMessage 中判断需优化');
            if (
                uploadMessage.uploadStatus === UploadStatus.READY
                || uploadMessage.uploadStatus === UploadStatus.FAIL
                || uploadMessage.uploadStatus === UploadStatus.CANCELLED
                || uploadMessage.isSuspend
            ) {
                uploadMessage.isSuspend = false;
                uploadMessage.uploadStatus = UploadStatus.UPLOADING;
                uploadFile.upload(uploadMessage.data, uploadCallback);
            }
        };
    }

    function getDataType(data) {
        let fileType = RongIMLib.FileType.FILE;
        const isBase64 = (typeof data === 'string');
        // var isImage =  (/^image\/(png|jpg|jpeg|gif|webp|x-icon)/i.test(data.type));
        const isImage = (/^image\/(png|jpg|jpeg|gif)/i.test(data.type));
        const configSize = config.upload.file.imageSize / 1024 / 1024 * 1000 * 1000;
        const isNormalSize = (data.size < configSize);
        if ((isImage && isNormalSize) || isBase64) {
            fileType = RongIMLib.FileType.IMAGE;
        }
        return fileType;
    }

    function getGifMessageContent(params, callback) {
        const content = {
            width: 0,
            height: 0,
            remoteUrl: '',
            gifDataSize: params.data.size,
        };
        let img = new Image();
        img.src = params.localPath;
        img.onload = () => {
            content.width = img.width;
            content.height = img.height;
            img = null;
            callback(content);
            // callback({width: img.width, height: img.height});
            // img = null;
        };
    }
    /*
    params.targetId
    params.conversationType
    params.data 上传的数据
    params.data.localPath 为了兼容复制的本地文件,File 的 path 属性只读
    */
    File.createUploadMessage = function createUploadMessage(params, cb) {
    // console.log('File.createUploadMessage => params: ' + JSON.stringify(params, null, '\t'));
        const message = {
            senderUserId: Cache.auth.id,
            targetId: params.targetId,
            conversationType: params.conversationType,
            messageDirection: RongIM.utils.messageDirection.SEND,
            uploadStatus: UploadStatus.READY,
            sentStatus: RongIM.utils.sentStatus.SENDING,
            sentTime: new Date().getTime(),
            messageType: '',
            progress: 0,
            dataType: getDataType(params.data),
            localPath: params.localPath,
            data: params.data,
            isFolder: params.isFolder,
        };
        if (message.dataType === RongIMLib.FileType.IMAGE) {
            if (params.giftImageInfo) {
                message.messageType = RongIMClient.MessageType.GIFMessage;
                message.content = params.giftImageInfo;
                cb(message);
            }
            if (message.data.type === 'image/gif') {
                message.messageType = RongIMClient.MessageType.GIFMessage;
                getGifMessageContent(params, (content) => {
                    message.content = content;
                    cb(message);
                });
            } else {
                message.messageType = RongIMClient.MessageType.ImageMessage;
                if (typeof params.data === 'string') {
                    // base64 图片
                    message.content = {
                        content: params.data,
                        imageUri: '',
                        messageName: message.messageType,
                        localPath: '',
                    };
                } else {
                // 图片文件上传
                    message.content = {
                        content: '',
                        imageUri: '',
                        messageName: message.messageType,
                        localPath: params.localPath,
                    };
                }
                cb(message);
            }
        } else {
            message.messageType = RongIMClient.MessageType.FileMessage;
            const type = RongIM.utils.getFilenameExtension(params.data.name);
            message.content = {
                name: params.data.name,
                size: params.data.size,
                type,
                fileUrl: '',
                localPath: params.data.path || params.data.localPath,
                uploadId: getUploadId(),
                messageName: message.messageType,
            };
            console.debug('createUploadMessage uploadId', message.content.uploadId);
            cb(message);
        }

        return message;
    };

    function getUploadId() {
        return Date.now();
    }

    function getChunkSize(filetype) {
        const platform = RongIM.utils.getPlatform();
        let isWeb = false;
        if (platform.startsWith('web')) {
            isWeb = true;
        }
        const fileConfig = config.upload.file;
        if (filetype === RongIMLib.FileType.FILE && !isWeb) {
            return fileConfig.chunkSize;
        }
        return fileConfig.fileSize;
    }

    function checkVideo(content) {
    // web 处理逻辑有问题暂屏蔽
        const platform = RongIM.utils.getPlatform();
        let isWeb = false;
        if (platform.startsWith('web')) {
            isWeb = true;
        }
        return content.type === 'mp4' && content.size <= 20 * 1024 * 1024 && !isWeb;
    }

    /*
    获取小视频的 时长duration, 缩略图content
 */
    function getVideoInfo(localPath, callback) {
        callback = callback || $.noop;
        const video = document.createElement('video');
        video.setAttribute('src', localPath);
        video.setAttribute('controls', 'controls');
        video.currentTime = 1;
        video.onloadeddata = function onloadeddata() {
            const maxWidth = 220;
            let scale = 1;
            const canvas = document.createElement('canvas');
            if (video.videoHeight === 0) {
                callback();
                return;
            }
            if (video.videoWidth > maxWidth) {
                scale = maxWidth / video.videoWidth;
            }
            if (video.videoHeight > maxWidth) {
                scale = Math.min(maxWidth / video.videoHeight, scale);
            }
            canvas.width = Math.ceil(video.videoWidth * scale);
            canvas.height = Math.ceil(video.videoHeight * scale);
            canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
            const poster = canvas.toDataURL('image/png', 0.4);
            utils.console.log('video Base64 length', poster.length);
            video.setAttribute('poster', poster);
            const info = {
                content: utils.Base64.replace(poster),
                duration: Math.round(video.duration),
            };
            document.body.removeChild(video);
            callback(info);
        };
        document.body.appendChild(video);
    }

    File.upload = function upload(uploadMessage, uploadConfig, callback) {
        callback = callback || $.noop;
        const platform = RongIM.utils.getPlatform();
        let isWeb = false;
        if (platform.startsWith('web')) {
            isWeb = true;
        }
        const isVideo = checkVideo(uploadMessage.content);
        const insertMessage = function insertMessage(insertUploadMessage, _callback) {
            const im = RongIM.instance;
            const content = insertUploadMessage.content;
            _callback = _callback || $.noop;
            const params = {
                conversationType: insertUploadMessage.conversationType,
                targetId: insertUploadMessage.targetId,
                sendUserId: im.auth.id,
                messageDirection: 1,
                progress: insertUploadMessage.progress,
                uploadStatus: UploadStatus.UPLOADING,
                sentStatus: RongIM.utils.sentStatus.SENDING,
                content: {
                    messageName: 'FileMessage',
                    type: content.type,
                    name: content.name,
                    size: content.size,
                    localPath: content.localPath,
                    uploadId: content.uploadId,
                    status: 0,
                },
                objectName: 'LRC:fileMsg',
            };
            if (isVideo && uploadMessage.isVideo) {
                params.content.content = content.content;
                params.content.duration = content.duration;
                params.content.sightUrl = content.sightUrl;
                params.objectName = 'RC:SightMsg';
                params.content.messageName = RongIMClient.MessageType.SightMessage;
            }
            messageApi.insertMessage(params, (errorCode, message) => {
                if (errorCode) {
                    console.warn('insertMessage', errorCode);
                    _callback(errorCode);
                    return;
                }
                const setParams = {
                    messageId: message.messageId,
                    status: message.sentStatus,
                };

                messageApi.setMessageSentStatus(setParams, null);
                _callback(null, message);
            });
        };
        const uploadCallback = {
            onBeforeUpload(data) {
                if (uploadMessage.dataType === RongIMLib.FileType.IMAGE && !uploadConfig.isEmoji) {
                    uploadMessage.content.content = data;
                }
                const key = messageApi.getCacheKey(uploadMessage);
                const cacheList = messageApi._cache[key] = messageApi._cache[key] || [];
                messageApi.addSendUserInfo(uploadMessage, (errorCode, msg) => {
                    if (errorCode) {
                        callback(errorCode);
                        return;
                    }
                    if (uploadMessage.dataType === RongIMLib.FileType.FILE && !isWeb) {
                        insertMessage(msg, (errCode, _message) => {
                            if (errCode) {
                                console.warn(errCode);
                                return;
                            }
                            _message.dataType = uploadMessage.dataType;
                            _message.data = uploadMessage.data;
                            _message.cancel = uploadMessage.cancel;
                            _message.suspend = uploadMessage.suspend;
                            _message.upload = uploadMessage.upload;
                            _message.isVideo = uploadMessage.isVideo;
                            uploadMessage = _message;
                            const uploadId = uploadMessage.content.uploadId;
                            File.uploadManage.add(uploadId, uploadMessage);
                        });
                    } else {
                        const uploadId = uploadMessage.content.uploadId;
                        File.uploadManage.add(uploadId, uploadMessage);
                        // 增加一个自定义的 messageId 用于删除消息，发送消息时使用真实 messageId 覆盖此次生成 id
                        msg.messageId = RongIM.utils.createUid();
                        cacheList.push(msg);
                    }
                });
            },
            onProgress(loaded, total) {
                const percent = Math.floor(loaded / total * 100);
                uploadMessage.progress = percent;
            },
            onCompleted(data) {
                const uploadId = uploadMessage.content.uploadId;
                File.uploadManage.remove(uploadId);
                // name 非空表示上传成功（取消上传为空）
                let undef;
                let condition = data.name;
                if (config.upload.type === 'RongCloud') {
                    condition = data.rc_url;
                }
                if (condition !== undef) {
                    if (uploadMessage.messageType === RongIMClient.MessageType.LocalFileMessage) {
                        uploadMessage.messageType = RongIMClient.MessageType.FileMessage;
                        uploadMessage.content.messageName = RongIMClient.MessageType.FileMessage;
                    }
                    uploadMessage.uploadStatus = UploadStatus.SUCCESS;
                    callback(null, uploadMessage, data);
                }
            },
            onError(errorCode) {
                const uploadId = uploadMessage.content.uploadId;
                File.uploadManage.remove(uploadId);
                uploadMessage.uploadStatus = UploadStatus.FAIL;
                // 上传失败同发送失败显示效果
                uploadMessage.sentStatus = RongIM.utils.sentStatus.FAILED;
                callback(`upload-${errorCode}`, uploadMessage);
            // insertMessage(uploadMessage);
            },
        };

        uploadConfig.getToken = function get(tokenCallback) {
            getToken(tokenCallback, uploadMessage.dataType);
        };

        uploadConfig.timeout = config.upload.timeout;
        uploadConfig.chunk_size = getChunkSize(uploadMessage.dataType);
        if (uploadMessage.dataType === RongIMLib.FileType.FILE) {
            UploadClient.initFile(uploadConfig, (uploadFile) => {
                if (isVideo) {
                    getVideoInfo(`file://${uploadMessage.content.localPath}`, (info) => {
                        if (info) {
                            uploadMessage.content.content = info.content;
                            uploadMessage.content.duration = info.duration;
                            uploadMessage.content.sightUrl = `file://${uploadMessage.content.localPath}`;
                            uploadMessage.isVideo = true;
                        } else {
                            uploadMessage.isVideo = false;
                        }
                        expendUploadMessage(uploadMessage, uploadFile, uploadCallback);
                        uploadMessage.upload();
                    });
                    return;
                }
                expendUploadMessage(uploadMessage, uploadFile, uploadCallback);
                uploadMessage.upload();
            });
        } else if (typeof uploadMessage.data === 'string') {
            uploadConfig.chunk_size = config.upload.file.fileSize;
            UploadClient.initImgBase64(uploadConfig, (uploadFile) => {
                expendUploadMessage(uploadMessage, uploadFile, uploadCallback);
                uploadMessage.upload();
            });
        } else {
            UploadClient.initImage(uploadConfig, (uploadFile) => {
                expendUploadMessage(uploadMessage, uploadFile, uploadCallback);
                uploadMessage.upload();
            });
        }
    };

    File.MergedMsgHtmlUpload = function MergedMsgHtmlUpload(uploadMessage, uploadConfig, callback) {
        callback = callback || $.noop;
        const platform = RongIM.utils.getPlatform();
        let isWeb = false;
        if (platform.startsWith('web')) {
            isWeb = true;
        }
        const uploadCallback = {
            onBeforeUpload(data) {
                const uploadId = uploadMessage.content.uploadId;
                File.uploadManage.add(uploadId, uploadMessage);
            },
            onProgress(loaded, total) {
                const percent = Math.floor(loaded / total * 100);
                uploadMessage.progress = percent;
            },
            onCompleted(data) {
                const uploadId = uploadMessage.content.uploadId;
                File.uploadManage.remove(uploadId);
                let undef;
                let condition = data.name;
                if (config.upload.type === 'RongCloud') {
                    condition = data.rc_url;
                }
                if (condition !== undef) {
                    if (uploadMessage.messageType === RongIMClient.MessageType.LocalFileMessage) {
                        uploadMessage.messageType = RongIMClient.MessageType.FileMessage;
                        uploadMessage.content.messageName = RongIMClient.MessageType.FileMessage;
                    }
                    uploadMessage.uploadStatus = UploadStatus.SUCCESS;
                    callback(null, uploadMessage, data);
                }
            },
            onError(errorCode) {
                const uploadId = uploadMessage.content.uploadId;
                File.uploadManage.remove(uploadId);
                uploadMessage.uploadStatus = UploadStatus.FAIL;
                // 上传失败同发送失败显示效果
                uploadMessage.sentStatus = RongIM.utils.sentStatus.FAILED;
                callback(`upload-${errorCode}`, uploadMessage);
            },
        };

        uploadConfig.getToken = function get(tokenCallback) {
            getToken(tokenCallback, uploadMessage.dataType);
        };

        uploadConfig.timeout = config.upload.timeout;
        uploadConfig.chunk_size = getChunkSize(uploadMessage.dataType);
        UploadClient.initFile(uploadConfig, (uploadFile) => {
            expendUploadMessage(uploadMessage, uploadFile, uploadCallback);
            uploadMessage.upload();
        });
    };

    File.resumeUpload = function resumeUpload(uploadMessage, uploadConfig, callback) {
        callback = callback || $.noop;
        const uploadCallback = {
            onBeforeUpload() {
                uploadMessage.sentStatus = RongIM.utils.sentStatus.SENDING;
            },
            onProgress(loaded, total) {
                const percent = Math.floor(loaded / total * 100);
                uploadMessage.progress = percent;
                uploadMessage.uploadStatus = UploadStatus.UPLOADING;
            },
            onCompleted(data) {
            // name 非空表示上传成功（取消上传为空）
                let undef;
                let condition = data.name;
                if (config.upload.type === 'RongCloud') {
                    condition = data.rc_url;
                }
                if (condition !== undef) {
                    if (uploadMessage.messageType === RongIMClient.MessageType.LocalFileMessage) {
                        uploadMessage.messageType = RongIMClient.MessageType.FileMessage;
                    }
                    uploadMessage.uploadStatus = UploadStatus.SUCCESS;
                    callback(null, uploadMessage, data);
                }
            },
            onError(errorCode) {
                uploadMessage.uploadStatus = UploadStatus.FAIL;
                // 上传失败同发送失败显示效果
                uploadMessage.sentStatus = RongIM.utils.sentStatus.FAILED;
                callback(errorCode, uploadMessage);
            },
        };

        uploadConfig.getToken = function get(tokenCallback) {
            getToken(tokenCallback, uploadMessage.dataType);
        };
        uploadConfig.chunk_size = getChunkSize(uploadMessage.dataType);

        if (uploadMessage.dataType === RongIMLib.FileType.FILE) {
            UploadClient.initFile(uploadConfig, (uploadFile) => {
                expendUploadMessage(uploadMessage, uploadFile, uploadCallback);
                uploadMessage.upload();
            });
        }
    };

    File.addFileUrl = function addFileUrl(uploadMessage, data, callback) {
    // 获取下载路径
        const url = common.getDownloadUrl(RongIM.config, data);
        if (url) {
            dealFileUrl(url, uploadMessage, callback);
            return;
        }
        RongIMClient.getInstance().getFileUrl(uploadMessage.dataType, data.filename, data.name, {
            onSuccess(result) {
                const fileUrl = result.downloadUrl;
                dealFileUrl(fileUrl, uploadMessage, callback);
            },
            onError() {
                uploadMessage.uploadStatus = UploadStatus.FAIL;
                utils.console.log('获取URL失败');
            },
        });
    };

    function dealFileUrl(url, uploadMessage, callback) {
        uploadMessage.sentStatus = RongIM.utils.sentStatus.SENDING;
        const content = uploadMessage.content;
        if (uploadMessage.dataType === RongIMLib.FileType.IMAGE) {
            if (uploadMessage.messageType === RongIMClient.MessageType.GIFMessage) {
                content.remoteUrl = url;
            } else {
                content.imageUri = url;
            }
        } else {
            content.fileUrl = url;
        }
        if (content.sightUrl) {
            content.sightUrl = url;
        }
        callback(null, uploadMessage);
    }

    File.send = function send(uploadMessage, callback) {
        callback = callback || $.noop;
        const conversationType = Number(uploadMessage.conversationType);
        const targetId = uploadMessage.targetId;
        let message;
        let isFile = false;
        if (uploadMessage.messageType === RongIMLib.RongIMClient.MessageType.ImageMessage) {
            message = common.buildMessage.ImageMessage(uploadMessage.content);
        } else if (uploadMessage.messageType === RongIMLib.RongIMClient.MessageType.GIFMessage) {
            message = common.buildMessage.GIFMessage(uploadMessage.content);
        } else if (uploadMessage.messageType === RongIMLib.RongIMClient.MessageType.FileMessage) {
            message = common.buildMessage.FileMessage(uploadMessage.content);
            isFile = true;
        }
        const oldMessageId = uploadMessage.messageId;
        // 判断是否视频文件且小于 20M, 是则发小视频消息
        const isVideo = checkVideo(uploadMessage.content);

        if (isVideo && uploadMessage.isVideo) {
            const msgContent = $.extend({}, uploadMessage.content);
            msgContent.MessageName = 'SightMessage';
            message = common.buildMessage.SightMessage(msgContent);
        }

        RongIMClient.getInstance().sendMessage(conversationType, targetId, message, {
            onBefore(messageId) {
                uploadMessage.messageId = messageId;
            },
            onSuccess(serverMessage) {
                uploadMessage.sentStatus = RongIM.utils.sentStatus.SENT;
                uploadMessage.sentTime = serverMessage.sentTime;
                uploadMessage.messageUId = serverMessage.messageUId;
                uploadMessage.messageId = serverMessage.messageId;
                const im = RongIM.instance;
                im.$emit('messagechange');
                callback(null, uploadMessage);
                if (serverMessage.content) {
                    serverMessage.content.localPath = uploadMessage.content.localPath;
                }
                RongIMClient.getInstance().setMessageContent(serverMessage.messageId, serverMessage.content, '');

                // 文件消息需删除原消息
                if (oldMessageId !== serverMessage.messageId && isFile) {
                // 删除
                    const params = {
                        conversationType: uploadMessage.conversationType,
                        targetId: uploadMessage.targetId,
                        messageIds: [oldMessageId],
                        notNotify: true,
                    };
                    messageApi.removeLocal(params, (errorCode) => {
                        if (errorCode) {
                            return;
                        }
                        messageApi.saveRemovedEarliestMessageTime(message);
                    });
                }
            },
            onError(errorCode) {
            // 文件消息需删除原消息
                if (oldMessageId !== uploadMessage.messageId && isFile) {
                // 删除
                    const params = {
                        conversationType: uploadMessage.conversationType,
                        targetId: uploadMessage.targetId,
                        messageIds: [oldMessageId],
                        notNotify: true,
                    };
                    messageApi.removeLocal(params, (error) => {
                        if (error) {
                            return;
                        }
                        messageApi.saveRemovedEarliestMessageTime(message);
                    });
                }
                uploadMessage.sentStatus = RongIM.utils.sentStatus.FAILED;
                // fix SDK 发送失败 3016 消息状态为发送中
                messageApi.setMessageSentStatus({
                    messageId: uploadMessage.messageId,
                    status: RongIM.utils.sentStatus.FAILED,
                });

                callback(errorCode, uploadMessage);
                const conversation = conversationApi.getLocalOne(uploadMessage.conversationType, uploadMessage.targetId);
                if (conversation) {
                    conversation.latestMessage = uploadMessage;
                    const list = conversationApi.getLocalList();
                    conversationApi.observerList.notify(list);
                }
            },
        });
    };

    function Manage() {
        this._cache = {};
    }
    Manage.prototype = {
        add(id, downloader) {
            this._cache[id] = downloader;
        },
        get(id) {
            return this._cache[id];
        },
        remove(id) {
            delete this._cache[id];
        },
    };
    // 存放下载中的文件
    File.downloadManage = new Manage();
    File.downloadManage.abortAll = function abortAll() {
        const self = this;
        const keys = Object.keys(this._cache);
        keys.forEach((key) => {
            const item = self._cache[key];
            item.abort();
        });
        self._cache = {};
    };

    // 存放上传中的文件
    File.uploadManage = new Manage();
    File.uploadManage.abortAll = function abortAll2() {
        const self = this;
        const keys = Object.keys(this._cache);
        keys.forEach((key) => {
            const item = self._cache[key];
            item.cancel();
        });
        self._cache = {};
    };

    File.getFileType = function getFileType(type) {
        switch (type) {
        case 0:
            type = 'qiniu';
            break;
        case 1:
            type = 'RongCloud';
            break;
        case 2:
            type = 'RongCloud';
            break;
        default:
            type = 'qiniu';
            break;
        }
        return type;
    };

    RongIM.dataModel.File = File;
};
