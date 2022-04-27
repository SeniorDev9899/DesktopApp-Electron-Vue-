/* eslint-disable no-param-reassign */
import encodeUrl from '../../common/encodeUrl';
import highlight from '../../common/highlight';
import filterMark from '../../common/filterMark';

import debounce from '../../utils/debounce';
import getLength from '../../utils/getLength';
import UploadStatus from '../../utils/UploadStatus';
import getPlatform from '../../utils/getPlatform';
import encodeHtmlStr from '../../utils/encodeHtmlStr';
import isEmpty from '../../utils/isEmpty';
import templateFormat from '../../utils/templateFormat';
import getLocaleMixins from '../../utils/getLocaleMixins';

import config from '../../config';
import file from '../../file';
import upload from '../../upload';
import { downloader } from '../../download';
import { messageIfSupportView } from '../../utils/netEnvironment';

const keyNS = 'rong-upload-';
const uploadKeyTmp = '{{0}}-{{1}}-{{2}}-{{3}}';
const debounceResume = debounce(resumeUpload, 300);
const debounceDownload = debounce(download, 300);

const name = 'file-message';
/*
说明：文件消息
功能：
    1. 消息列表中的文件消息
    2. 历史消息中的文件消息
*/
export default {
    name,
    props: ['message', 'keyword', 'collect', 'sendCollect', 'isMultiSelected'],
    data() {
        return {
            size: 0,
            filename: '',
            basename: '',
            extname: '',
            extnameWidth: 0,
            sentStatus: RongIMLib.SentStatus,
            downloadStatus: '',
            downloadProgress: 0,
            fileTimer: null,
        };
    },
    mixins: [getLocaleMixins(name)],
    computed: {
        support() {
            return config.support;
        },
        canceled() {
            return this.message.content.status === 0;
        },
        fileUrl() {
            const str = this.message.content.fileUrl;
            return encodeUrl(str);
        },
        isUpload() {
            // 用来判断当前是下载还是上传
            // 产品需求,只有接收的文件下载才显示已接收
            return this.message.messageType === RongIMClient.MessageType.LocalFileMessage
                || this.message.messageDirection === RongIMLib.MessageDirection.SEND;
        },
        isOverLength() {
            const stateLen = getLength(this.fileState);
            if (this.size.length > 8 && stateLen > 5) {
                return true;
            }
            return false;
        },
        fileState() {
            let state = '';
            const message = this.message;
            if (this.isUpload) {
                // 42186 - 【群聊会话】被禁言后通过拖拽发送文件，发送失败却显示“已发送”
                if (message.sentState === RongIM.utils.sentStatus.FAILED) {
                    state = this.locale.sentFailed;
                    return state;
                }
                switch (message.uploadStatus) {
                case UploadStatus.READY:
                    break;
                case UploadStatus.UPLOADING:
                    state = this.locale.sendingState;
                    break;
                case UploadStatus.SUCCESS:
                    if (message.messageDirection === RongIMLib.MessageDirection.SEND) {
                        state = this.locale.sentState;
                    }
                    break;
                case UploadStatus.FAIL:
                    state = this.locale.cancelState;
                    break;
                case UploadStatus.CANCELLED:
                    state = this.locale.cancelState;
                    break;
                    // 失效  24小时内不操作继续发送，则该文件发送状态置为已失效
                case UploadStatus.EXPIRED:
                    state = this.locale.expiredState;
                    break;
                default:
                    state = this.locale.sentState;
                    break;
                }
                return state;
            }
            switch (this.downloadStatus) {
            case 'READY':
                break;
            case 'DOWNLOADING':
                state = this.locale.downloadState;
                break;
            case 'DOWNLOADED':
                if (message.messageDirection === RongIMLib.MessageDirection.RECEIVE) {
                    state = this.locale.receiveState;
                }
                break;
            case 'CANCELLED':
                state = this.locale.cancelState;
                break;
            default:
                $.noop();
                break;
            }
            return state;
        },
        status() {
            return this.$im().status;
        },
        isWeb() {
            const platform = getPlatform();
            const isWeb = platform.indexOf('web') !== -1;
            return isWeb;
        },
    },
    watch: {
        'message.uploadStatus': function uploadStatusChange(newValue) {
            const message = this.message;
            message.uploadStatus = newValue;
            if (newValue === UploadStatus.SUCCESS && this.downloadStatus !== 'DOWNLOADED') {
                this.downloadStatus = 'READY';
            }
            if (this.isWeb) {
                if (newValue === UploadStatus.UPLOADING) {
                    message.content.status = 1;
                } else if (newValue === UploadStatus.SUCCESS) {
                    message.content.status = null;
                } else {
                    message.content.status = 0;
                    message.sentStatus = -1;
                }
                return;
            }
            const fileTimer = this.fileTimer;
            if (fileTimer) clearInterval(fileTimer);
            if (newValue === UploadStatus.UPLOADING) {
                this.watchFile();
                message.content.status = 1;
                // 更新会话列表中消息发送状态
                // im.$emit('uploadStatusChange', message, 1);
            } else if (newValue === UploadStatus.SUCCESS) {
                message.content.status = null;
            } else {
                message.content.status = 0;
                // im.$emit('uploadStatusChange', message, 0);
            }
        },
        status(newValue) {
            const isConnect = newValue === RongIMLib.ConnectionStatus.CONNECTED;
            const isUploading = this.message.uploadStatus === UploadStatus.UPLOADING;
            if (!isConnect && isUploading) {
                this.cancelUpload();
            }
        },
    },
    created() {
        created(this);
    },
    // 正在上传或正在下载的状态做记录,切换会话时能继续保持原来的状态
    destroyed() {
        const fileTimer = this.fileTimer;
        if (fileTimer) clearInterval(fileTimer);
    },
    methods: {
        getUsername(...args) {
            return this.RongIM.common.getUsername(...args);
        },
        dateFormat(timestamp, format) {
            return moment(timestamp).format(format);
        },
        highlight(text) {
            const str = highlight(text, this.keyword);
            return filterMark(str);
        },
        getFileIconClass(message) {
            const isExpired = message.uploadStatus === UploadStatus.EXPIRED;
            const prefix = 'rong-file-';
            let suffix = '';
            if (isExpired) {
                suffix = '-expired';
            }
            return prefix + message.content.type + suffix;
        },
        pauseDownload() {
            if (this.downloader) {
                this.downloadStatus = 'CANCELLED';
                this.downloader.pause();
            }
        },
        resumeDownload() {
            if (this.downloader) {
                this.downloadStatus = 'DOWNLOADING';
                this.downloader.resume();
            } else {
                this.download(this.message, true);
            }
        },
        isSupportOpenFile() {
            if (this.isMultiSelected) {
                return false;
            }
            // 正在下载中的文件,不应该做处理
            const support = this.support.openFile;
            const isDownloaded = this.downloadStatus === 'DOWNLOADED';
            if (support && (isDownloaded || this.isUpload)) {
                return true;
            }
            return false;
        },
        openFile() {
            if (this.sendCollect !== undefined) {
                return;
            }
            const localPath = this.message.content.localPath;
            const fileExist = file.checkExist(localPath);
            if (localPath && fileExist) {
                file.open(localPath);
            } else {
                this.downloadStatus = 'READY';
                if (this.message.messageDirection === RongIMLib.MessageDirection.RECEIVE) {
                    this.download(this.message);
                } else {
                    this.RongIM.common.toastError('file-404');
                }
            }
        },
        /*
            上传成功后显示,无论源文件是否删除
            下载成功后,如果文件存在则显示,否则显示下载按钮
            */
        isShowOpenFolder(message) {
            const isDownloadOver = this.downloadStatus === 'DOWNLOADED';
            const isUploadOver = message.uploadStatus === UploadStatus.SUCCESS
                || message.messageDirection === RongIMLib.MessageDirection.SEND;
            const isExpired = message.uploadStatus === UploadStatus.EXPIRED;
            const localPath = this.message.content.localPath;
            const fileExist = file.checkExist(localPath);
            return this.support.openFolder && fileExist && !isExpired && (isDownloadOver || isUploadOver);
            // return isUploadOver && !isExpired || this.support.openFolder && fileExist && isDownloadOver;
        },
        openFolder() {
            const localPath = this.message.content.localPath;
            const fileExist = file.checkExist(localPath);
            if (localPath && fileExist) {
                file.openDir(localPath);
            } else {
                this.RongIM.common.toastError('file-404');
                this.downloadStatus = 'READY';
            }
        },
        isCanDownload() {
            if (this.isMultiSelected) {
                return false;
            }
            const message = this.message;
            const localPath = message.content.localPath;
            const fileExist = file.checkExist(localPath);
            // 正在下载中的文件,不应该做处理
            const isUploadOver = message.uploadStatus === UploadStatus.SUCCESS
                || message.messageDirection === RongIMLib.MessageDirection.SEND;
            const isDownloading = this.downloadStatus === 'DOWNLOADING';
            const isCanceled = this.downloadStatus === 'CANCELLED';
            const isDownloaded = this.downloadStatus === 'DOWNLOADED';
            if (isDownloading || isCanceled || (isUploadOver && fileExist) || (isDownloaded && fileExist)) {
                return false;
            }
            return true;
        },
        download(message, isResume, isSaveAs) {
            if (message.noSupportView) {
                this.RongIM.common.toastError('file-environment-error');
                return;
            }
            debounceDownload(message, isResume, this, isSaveAs);
        },
        isUploading() {
            return this.message.uploadStatus === UploadStatus.UPLOADING;
        },
        isCancelUpload() {
            const isCanceled = this.message.uploadStatus === UploadStatus.CANCELLED;
            const isFailed = this.message.uploadStatus === UploadStatus.FAIL;
            return isCanceled || isFailed;
        },
        suspendUpload() {
            const message = this.message;
            message.suspend((errorCode) => {
                if (errorCode) {
                    this.RongIM.common.toastError(errorCode);
                }
            });
        },
        // 取消上传
        cancelUpload() {
            const context = this;
            const message = this.message;
            // 第一次上传需要插入消息;后面续传不需要
            message.cancel((errorCode) => {
                if (errorCode) {
                    this.RongIM.common.toastError(errorCode);
                    return;
                }
                context.message.uploadStatus = UploadStatus.CANCELLED;
            });
        },
        resumeUpload(message) {
            /* if(message.uploadStatus === UploadStatus.UPLOADING){
                    return;
                } */
            debounceResume(this, message);
        },
        // 上传过程中监控上传中的文件是否有变动,有则提示
        watchFile() {
            const fileInstanse = this;
            let fileTimer = fileInstanse.fileTimer;
            // fileTimer && clearInterval(fileTimer);
            // TODO: Interval 风险，需替换算法
            fileTimer = setInterval(() => {
                if (fileInstanse.message.uploadStatus === UploadStatus.SUCCESS) {
                    clearInterval(fileTimer);
                    return;
                }
                const localPath = fileInstanse.message.content.localPath;
                const fileExist = file.checkExist(localPath);
                if (!fileExist) {
                    // fileInstanse.suspendUpload();
                    // fileInstanse.message.uploadStatus = UploadStatus.EXPIRED;
                    fileInstanse.cancelUpload();
                    clearInterval(fileTimer);
                    this.RongIM.common.toastError('file-404');
                }
            }, 6000);
        },
        dblClick() {
            if (this.isSupportOpenFile()) {
                this.openFile();
            }
        },
    },
};

function attachDownloadEvents(downloadTask, context) {
    // 用来标记事件订阅的场景，消息列表，历史消息二处。
    let componentTag = 'message-list';
    /* eslint no-underscore-dangle: 0 */
    if (context.$parent && context.$parent.$options && context.$parent.$options._componentTag) {
        componentTag = context.$parent.$options._componentTag;
        // 任务是谁发起的。
        // if (!downloadTask.firstTag)
        //     downloadTask.firstTag = componentTag;
    }
    const message = context.message;
    const RongIM = context.RongIM;
    const fileApi = RongIM.dataModel.File;
    const common = RongIM.common;
    // 下载准备完毕
    const onReady = () => {
        fileApi.downloadManage.add(message.messageUId, downloadTask);
        context.downloader = downloadTask;
    };

    // 下载中,返回下载进度
    const onProgress = (data) => {
        context.downloadStatus = 'DOWNLOADING';
        context.downloadProgress = (data.loaded / data.total) * 100;
    };
    const onPause = () => {
        context.downloadStatus = 'CANCELLED';
    };
    const onResume = () => {
        context.downloadStatus = 'DOWNLOADING';
    };
    // 下载完成
    const onComplete = (data) => {
        fileApi.downloadManage.remove(message.messageUId);
        context.downloader = null;

        context.downloadStatus = 'DOWNLOADED';
        if (!data.path) {
            return;
        }
        if (message.content) {
            message.content.localPath = data.path;
            const rongInstance = RongIMClient.getInstance();
            let messageId;
            const content = message.content;
            if (context.collect) {
                RongIM.dataModel.Message.getOne(message.messageId, (errorCode, result) => {
                    messageId = result.messageId;
                    rongInstance.setMessageContent(messageId, content, '');
                });
            } else {
                messageId = message.messageId;
                rongInstance.setMessageContent(messageId, content, '');
            }
        }
        context.downloadProgress = 0;
        const isFolder = message.content.isFolder || false;
        if (isFolder) {
            file.unzip({ src: data.path }, (err, info) => {
                console.debug(err, info);
            });
        }
        // 498 - 【丹东】【PC客户端】PC端产品能力演进
        // 功能优化：PC端会话详情文件下载成功后不直接打开文件
        /* if (downloadTask.isDirectDownload) {
            const localPath = message.content.localPath;
            const fileExist = file.checkExist(localPath);
            if (localPath && fileExist) {
                file.open(localPath);
            }
        } */
    };
    const onCompleteStatus = () => {
        context.downloadStatus = 'DOWNLOADED';
    };

    const onError = (error) => {
        fileApi.downloadManage.remove(message.messageUId);
        context.downloader = null;
        console.warn('download-error', error);
        const errorCode = ['ebusy', 'eperm'].indexOf(error) > -1 ? error : 'error';
        common.toastError(`download-${errorCode}`);
        if (context.downloadProgress === 0) {
            context.downloadStatus = 'READY';
        } else {
            context.downloadStatus = 'CANCELLED';
        }
    };

    const onErrorStatus = () => {
        if (context.downloadProgress === 0) {
            context.downloadStatus = 'READY';
        } else {
            context.downloadStatus = 'CANCELLED';
        }
    };

    // 41210 - 【文件】MAC-下载文件后，再次另存为，已下载的文件图标显示为未下载图标
    const onCancel = () => {
        if (context.downloadStatus !== 'DOWNLOADED') {
            context.downloadStatus = 'READY';
        }
    };

    // 考虑到用户手动切换不会海量切换， 所以这里直接简单粗暴地做事件的叠加。
    if (!downloadTask.onPause) {
        downloadTask.onPause = onPause;
        downloadTask.onPauseCount = 1;
    } else {
        const onPause0 = downloadTask.onPause;
        downloadTask.onPause = (data) => {
            onPause0(data);
            onPause(data);
        };
        downloadTask.onErrorCount += 1;
    }

    if (!downloadTask.onResume) {
        downloadTask.onResume = onResume;
        downloadTask.onResumeCount = 1;
    } else {
        const onResume0 = downloadTask.onResume;
        downloadTask.onResume = (data) => {
            onResume0(data);
            onResume(data);
        };
        downloadTask.onErrorCount += 1;
    }

    if (!downloadTask.onCancel) {
        downloadTask.onCancel = onCancel;
        downloadTask.onCancelCount = 1;
    } else {
        const onCancel0 = downloadTask.onCancel;
        downloadTask.onCancel = (data) => {
            onCancel0(data);
            onCancel(data);
        };
        downloadTask.onCancelCount += 1;
    }

    if (!downloadTask.onReady) {
        downloadTask.onReady = onReady;
        downloadTask.onReadyCount = 1;
    } else {
        const onReady0 = downloadTask.onReady;
        downloadTask.onReady = () => {
            onReady0();
            onReady();
        };
        downloadTask.onReadyCount += 1;
    }

    // 以下是不能重复累加的事件，需要按来源处理一下。
    if (!downloadTask.onError) {
        downloadTask.onError = onError;
        downloadTask.onErrorCount = 1;
        downloadTask.onErrors = {};
        downloadTask.onErrors[componentTag] = onError;
    } else if (downloadTask.onErrors[componentTag]) {
        // 此来源已经订阅，则覆盖就好
        downloadTask.onError = onError;
        downloadTask.onErrors[componentTag] = onError;
    } else {
        // 否则就累加
        downloadTask.onErrors[componentTag] = onErrorStatus;
        downloadTask.onErrorCount += 1;
    }

    downloadTask.onError = (data) => {
        Object.keys(downloadTask.onErrors).forEach(key => downloadTask.onErrors[key](data));
    };

    if (!downloadTask.onComplete) {
        downloadTask.onComplete = onComplete;
        downloadTask.onCompleteCount = 1;
        downloadTask.onCompletes = {};
        downloadTask.onCompletes[componentTag] = onComplete;
    } else if (downloadTask.onCompletes[componentTag]) {
        // 此来源已经订阅，则覆盖就好
        downloadTask.onCompletes[componentTag] = onCompleteStatus;
    } else {
        // 否则就累加
        downloadTask.onCompletes[componentTag] = onCompleteStatus;
        downloadTask.onCompleteCount += 1;
    }
    downloadTask.onComplete = (data) => {
        Object.keys(downloadTask.onCompletes).forEach(key => downloadTask.onCompletes[key](data));
    };


    if (!downloadTask.onProgress) {
        downloadTask.onProgressCount = 1;
        downloadTask.onProgresses = {};
        downloadTask.onProgresses[componentTag] = onProgress;
    } else if (downloadTask.onProgresses[componentTag]) {
        // 此来源已经订阅，则覆盖就好
        downloadTask.onProgresses[componentTag] = onProgress;
    } else {
        // 否则就累加
        downloadTask.onProgresses[componentTag] = onProgress;
        downloadTask.onProgressCount += 1;
    }
    downloadTask.onProgress = (data) => {
        Object.keys(downloadTask.onProgresses).forEach(key => downloadTask.onProgresses[key](data));
    };
}

function created(context) {
    const im = context.$im();
    const fileApi = im.dataModel.File;
    const message = context.message;

    const [url, noSupportView] = messageIfSupportView(message.content.fileUrl);
    message.content.fileUrl = url;
    message.noSupportView = noSupportView;

    context.size = size(context.message);
    context.filename = context.message.content.name;

    const index = context.filename.lastIndexOf('.');
    let extname = '';
    if (index > -1) {
        // 扩展名前多显示2个字
        const prefix = 2;
        const chPatrn = /[\u4E00-\u9FA5]|[\uFE30-\uFFA0]|[\u0391-\uFFE5]/gi;
        extname = context.filename.slice(Math.max(0, index - prefix));
        extname = chPatrn.exec(extname) ? extname.substring(1) : extname;
    }
    context.extname = encodeHtmlStr(extname);

    let end = 0 - context.extname.length;
    if (end === 0) {
        end = context.filename.length;
    }
    const basename = context.filename.slice(0, end);
    // context.basename = encodeHtmlStr(basename);
    context.basename = basename;

    context.extnameWidth = context.RongIM.common.getTextRenderWidth(context.extname, 14);

    const localPath = message.content.localPath;
    const fileExist = file.checkExist(localPath);
    const isUpload = isEmpty(message.content.fileUrl);
    if (isUpload) {
        if (!context.isWeb && fileExist) {
            initUploadState(context, message);
            if (message.uploadStatus === UploadStatus.UPLOADING) {
                context.watchFile();
            }
            return;
        }
        const uploader = fileApi.uploadManage.get(message.content.uploadId);
        message.uploadStatus = uploader ? uploader.uploadStatus : UploadStatus.CANCELLED;
        return;
    }

    initDownloadState(context, message);
}

/*
    1. 判断文件是否存在,不存在则返回(如果改名,此步已过滤掉)
    2. localPath + size + lastModified + uploadId
*/
function initUploadState(context, message) {
    let fileState;
    const localPath = message.content.localPath;
    const uploadId = message.content.uploadId;
    // 发送成功的消息
    if (!uploadId) {
        return;
    }
    // 本地路径已失效
    if (!file.checkExist(localPath)) {
        // message.uploadStatus = UploadStatus.SUCCESS;
        return;
    }
    const conf = config.upload.file;
    const fileInfo = file.getFileStat(localPath);
    let key = templateFormat(uploadKeyTmp, localPath, fileInfo.size, +fileInfo.mtime, uploadId);
    key = keyNS + RongIMLib.RongUtil.MD5(key).slice(8, 16);
    // key = keyNS + key;
    fileState = upload.getItem(key) || {};
    if ($.isEmptyObject(fileState)) {
        let uploadExpired = message.messageType === RongIMClient.MessageType.LocalFileMessage || !message.messageId;
        uploadExpired = uploadExpired && message.uploadStatus !== UploadStatus.UPLOADING;
        if (uploadExpired) {
            message.uploadStatus = UploadStatus.CANCELLED;
        }
        return;
    }
    try {
        fileState = JSON.parse(fileState);
    } catch (ex) {
        fileState = {};
    }
    fileState = fileState || {};
    // 判断文件超过24小时未操作则失效
    if (fileState.updateTime) {
        const nowDate = new Date().getTime();
        let span = nowDate - fileState.updateTime;
        span /= (1000 * 3600);
        const validity = conf.validity || 0;
        if (validity > 0 && span > validity) {
            // upload.removeItem(key); //过期暂不删除,否则无法区分是取消时无记录还是过期了
            message.uploadStatus = UploadStatus.EXPIRED;
            return;
        }
    }
    fileState = fileState.data || {};
    const isUploading = context.RongIM.dataModel.File.uploadManage.get(uploadId);
    message.uploadStatus = isUploading ? UploadStatus.UPLOADING : UploadStatus.CANCELLED;
    message.progress = Math.floor(fileState.offset / fileInfo.size * 100);
    message.content.size = fileInfo.size;
    message.content.uniqueName = fileState.sessionId;
}

function initDownloadState(fileInstance, message) {
    const fileApi = fileInstance.$im().dataModel.File;
    const localPath = message.content.localPath;
    const uploadDone = message.uploadStatus === UploadStatus.SUCCESS;
    const isDownload = isEmpty(message.uploadStatus) || uploadDone;
    let downloadStatus = '';
    if (message.content.status === 0) {
        // 已取消
    } else if (getFileExists(localPath)) {
        downloadStatus = 'DOWNLOADED';
    } else if (isDownload) {
        downloadStatus = 'READY';
    }
    fileInstance.downloadStatus = downloadStatus;
    const isWeb = fileInstance.isWeb;
    if (isWeb) {
        return;
    }

    const fileState = downloader.getProgress(message.messageUId);
    if (!$.isEmptyObject(fileState)) {
        fileInstance.downloadStatus = 'CANCELLED';
        fileInstance.downloadProgress = (fileState.offset / message.content.size) * 100;
        const task = fileApi.downloadManage.get(message.messageUId);
        if (downloader && task) {
            fileInstance.downloadProgress = (task.stats.offset / message.content.size) * 100;
            attachDownloadEvents(task, fileInstance);
            fileInstance.downloader = task;
            if (!task.isPause) {
                fileInstance.downloadStatus = 'DOWNLOADING';
            }
        }
    }
}

function getFileExists(fileUrl) {
    let existed = false;
    if (!isEmpty(fileUrl)) {
        existed = file.checkExist(fileUrl);
    }
    return existed;
}

function size(message) {
    const filesize = Number(message.content.size) || 0;
    let sizeStr = '';
    const unit = 1024;
    const G = unit ** 3;
    const M = unit ** 2;
    const K = unit ** 1;
    if (filesize > G) {
        sizeStr = `${(filesize / G).toFixed(2)} GB`;
    } else if (filesize > M) {
        sizeStr = `${(filesize / M).toFixed(2)} MB`;
    } else if (filesize > K) {
        sizeStr = `${(filesize / K).toFixed(2)} KB`;
    } else {
        sizeStr = `${filesize} B`;
    }
    return sizeStr;
}

function checkExist(message, common) {
    const localPath = message.content.localPath;
    const fileExist = file.checkExist(localPath);
    if (!fileExist) {
        // message.uploadStatus = UploadStatus.EXPIRED;
        common.toastError('file-404');
        return false;
    }
    return true;
}

function resumeUpload(context, uploadMessage) {
    const common = context.RongIM.common;
    if (!checkExist(uploadMessage, common)) {
        return;
    }
    const fileApi = context.RongIM.dataModel.File;
    uploadMessage.dataType = RongIMLib.FileType.FILE;
    const filePath = uploadMessage.content.localPath;
    const fileSize = uploadMessage.content.size;
    const resume = function resume(reUploadMessage) {
        fileApi.resumeUpload(reUploadMessage, config.upload.file, (errorCode, _uploadMessage, data) => {
            if (errorCode) {
                common.messageToast({
                    type: 'error',
                    message: config.currentLocale().components.addAttachment.uploadFaild,
                });
                return;
            }
            fileApi.addFileUrl(_uploadMessage, data, (error, sendUploadMessage) => {
                fileApi.send(sendUploadMessage, (err, message) => {
                    if (err) {
                        const errMsg = common.getErrorMessage(`lib-${err}`);
                        console.warn('fileApi.resumeUpload', errMsg, message);
                    }
                    context.$im().$emit('sendMessage');
                });
            });
        });
    };
    // uploadMessage.data = uploadMessage.data || file.getBlobs([filePath])[0];
    /*
        fetchType === 0 通过 nodejs 获取文件对象. 优点: 速度快 缺点: 文件大小有限制,具体参考 https://cnodejs.org/topic/56499568d28aa64101600fdc
        fetchType === 1 通过 XMLHttpRequest 获取文件对象. 优点: 不限制文件大小 缺点: 文件加载比较慢
     */
    let fetchType = 0;
    if (fileSize > 500 * 1024 * 1024) {
        fetchType = 1;
    }

    if (!uploadMessage.data) {
        if (fetchType === 1) {
            file.getBlob(filePath).then((data) => {
                uploadMessage.uploadStatus = UploadStatus.READY;
                uploadMessage.data = data;
                resume(uploadMessage);
            }, (err) => {
                common.toastError('file-error');
                console.warn('file.getBlob error', err);
            });
            uploadMessage.uploadStatus = UploadStatus.UPLOADING;
            uploadMessage.sentStatus = RongIMLib.SentStatus.SENDING;
            return;
        }
        uploadMessage.data = file.getBlobs([filePath])[0];
    }
    resume(uploadMessage);
}

function download(message, isContinue, instance, isSaveAs) {
    const context = instance;
    const RongIM = context.RongIM;
    RongIM.dataModel.File.getFileDownloadToken((error, token) => {
        if (error) {
            RongIM.common.toastError('download-error');
            return;
        }
        let url = message.content.fileUrl;
        if (url.indexOf('?') !== -1) {
            url += `&token=${token}`;
        } else {
            url += `?token=${token}`;
        }
        // 42709 - 【文件】接收一个0kb的文件，点击下载提示：当前环境无法查收
        if (message.content.size > 0){
            const task = downloader.load({
                uId: message.messageUId,
                url,
                name: message.content.name,
                size: message.content.size,
            });
            attachDownloadEvents(task, context);
            // 41210 - 【文件】MAC-下载文件后，再次另存为，已下载的文件图标显示为未下载图标
            if (context.downloadStatus !== 'DOWNLOADED') {
                context.downloadStatus = 'DOWNLOADING';
            }
            if (isContinue) {
                task.continue();
                return;
            }
            if (isSaveAs) {
                task.saveAs();
            } else {
                task.directDownload();
            }
        } else {
            RongIM.common.messageToast({
                type: 'error',
                message: context.locale.tips.fileDownloadError,
            })
        }
        

        // task.saveAs();
    });
}
