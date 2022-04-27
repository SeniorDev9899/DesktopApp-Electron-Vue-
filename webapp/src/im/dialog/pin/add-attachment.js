/* eslint-disable no-param-reassign */
import getPlatform from '../../utils/getPlatform';
import debounce from '../../utils/debounce';
import UploadStatus from '../../utils/UploadStatus';
import formatFileSize from '../../utils/formatFileSize';
import templateFormat from '../../utils/templateFormat';
import isChinese from '../../utils/isChinese';
import getFileType from '../../utils/getFileType';
import console from '../../utils/console';
import config from '../../config';
import file from '../../file';
import { getServerConfigByChainedKey } from '../../cache/helper';

/*
文件变更检测:
    1. 上传时,文件变更能检测到
    2. 继续上传时,能检测到
    3. 非上传中状态不做检测
*/
/* addPin为 添加pin弹框组件 */
export default function (context) {
    const addPin = context;
    const options = {
        name: 'add-attachment',
        template: 'templates/pin/add-attachment.html',
        data() {
            return {
                show: true,
                fileTimer: null,
            };
        },
        computed: {
            attachments() {
                return addPin.attachments;
            },
            isAttachFull() {
                return addPin.isAttachFull;
            },
            getAttachCount() {
                const count = addPin.attachments.length;
                const attachFormat = config.currentLocale().components.newPin.attaCount;
                return this.localeFormat(attachFormat, count);
            },
            /*
                是否显示重新下载按钮
                断网状态不显示
                */
            isShowRenew() {
                return this.$im().status === RongIMLib.ConnectionStatus.CONNECTED;
            },
            isWeb() {
                const platform = getPlatform();
                const isWeb = platform.indexOf('web') !== -1;
                return isWeb;
            },
        },
        mounted() {
            watchConnectStatus(this);
            if (!this.isWeb) watchAttach(this);
        },
        destroyed() {
            const fileTimer = this.fileTimer;
            if (fileTimer) clearInterval(fileTimer);
        },
        methods: getMethods(addPin.$im(), addPin),
    };
    window.RongIM.common.mountDialog(options);
}

const debounceResume = debounce(resumeUpload, 200);

function watchAttach(addPin) {
    let fileTimer = addPin.fileTimer;
    if (fileTimer) clearInterval(fileTimer);
    fileTimer = setInterval(() => {
        const attachments = addPin.attachments.filter(attachment => attachment.uploadStatus === UploadStatus.UPLOADING);
        for (let i = 0; i < attachments.length; i += 1) {
            const item = attachments[i];
            checkExist(item, addPin);
        }
    }, 6000);
}

function checkExist(item, addPin) {
    const localPath = item.data.path;
    const fileExist = file.checkExist(localPath);
    if (!fileExist) {
        // item.uploadStatus = UploadStatus.EXPIRED;
        addPin.cancelUpload(item);
        addPin.toastError('file-404');
        return false;
    }
    return true;
}

/* addPin为 添加pin弹框组件 */
function getMethods(im, addPin) {
    return {
        toast(params) {
            params.el = this.$el.firstChild;
            addPin.RongIM.common.messageToast(params);
        },
        toastError(errorCode) {
            let el = null;
            if (this.$el) {
                el = this.$el.firstChild;
            }
            addPin.RongIM.common.toastError(errorCode, el);
        },
        renewDownload(attach) {
            const attachments = addPin.attachments;
            const index = attachments.indexOf(attach);
            attachments.splice(index, 1);
            const mockEvent = { target: { files: [attach.data] } };
            this.addAttachment(mockEvent);
        },
        close() {
            this.show = false;
            const fileTimer = this.fileTimer;
            if (fileTimer) clearInterval(fileTimer);
        },
        addAttachment(event) {
            const fileSize = getServerConfigByChainedKey('media.max_file_size') * 1024 * 1024;
            const fileMaxSize = fileSize ? formatFileSize(fileSize) : '';
            const message = fileMaxSize ? templateFormat(addPin.locale.tips.overSize, fileMaxSize) : '';
            const maxAttachCount = getServerConfigByChainedKey('pin.max_attachment_count');
            const fileList = event.target.files;
            if (!checkAttachInBound(addPin, fileList)) {
                this.toast({
                    type: 'error',
                    message: templateFormat(addPin.locale.components.newPin.mostAtta, maxAttachCount),
                });
                return;
            }
            const sizeState = checkAttachSize(fileList, fileSize);
            if (sizeState === 1 || sizeState === 2) {
                const showMsg = sizeState === 1 ? addPin.locale.tips.zeroSize : message;
                this.toast({
                    type: 'error',
                    message: showMsg,
                });
            }
            for (let i = 0; i < fileList.length; i += 1) {
                const tmpFile = fileList[i];
                if (tmpFile.size > 0 && tmpFile.size <= fileSize) {
                    upload(tmpFile, addPin);
                }
            }
            resetInputFileValue('rongAddAttachmentInDetail');
        },
        formatFileSize,
        removeAttachment(attachment) {
            addPin.attachments = addPin.attachments.filter(atta => attachment !== atta);
            // console.log('todo: 如果有上传的分片记录,删除');
        },
        getFileIconClass(name) {
            const prefix = 'rong-pin-file-';
            const getPointTotal = name.split('.').length - 1;
            const splitArr = name.split('.');
            const isExpired = false;
            let suffix = '';
            if (isExpired) {
                suffix = '-expired';
            }
            return prefix + splitArr[getPointTotal] + suffix;
        },
        getProgressWidth(attach) {
            attach.progress = attach.progress || 0;
            return `${attach.progress}%`;
        },
        isShowProgress(attach) {
            const isCanceled = attach.uploadStatus === UploadStatus.CANCELLED;
            const isUploading = attach.uploadStatus === UploadStatus.UPLOADING;
            return isCanceled || isUploading;
        },
        isFaild(attach) {
            return attach.progress === -1;
        },
        getProgress(attach) {
            return `${parseInt(attach.progress)}%`;
        },
        getAttachName(name) {
            const length = getNameLength(name);
            if (length > 27) {
                const splitLength = name.length * 27 / length / 2;
                const head = name.substring(0, splitLength);
                const foot = name.substring(name.length - splitLength, name.length);
                return `${head}...${foot}`;
            }
            return name;
        },
        cancelUpload(item) {
            item.cancel();
            if (this.isWeb) {
                this.removeAttachment(item);
            }
        },
        isCancelUpload(item) {
            const isCanceled = item.uploadStatus === UploadStatus.CANCELLED;
            const isFailed = item.uploadStatus === UploadStatus.FAIL;
            return isCanceled || isFailed;
        },
        resumeUpload(item) {
            if (item.uploadStatus === UploadStatus.UPLOADING) {
                return;
            }
            if (!checkExist(item, this)) {
                return;
            }
            debounceResume(item);
        },
        isShowCancel(item) {
            return item.uploadStatus === UploadStatus.UPLOADING;
        },
        isShowRemove(item) {
            const isCanceled = item.uploadStatus === UploadStatus.CANCELLED;
            const isComplete = item.uploadStatus === UploadStatus.SUCCESS;
            return isCanceled || isComplete;
        },
        fileState(item) {
            let state = '';
            switch (item.uploadStatus) {
            case UploadStatus.READY:
                break;
            case UploadStatus.UPLOADING:
                state = this.locale.uploading;
                break;
            case UploadStatus.SUCCESS:
                state = this.locale.uploaded;
                break;
            case UploadStatus.FAIL:
                state = this.locale.cancelled;
                break;
            case UploadStatus.CANCELLED:
                state = this.locale.cancelled;
                break;
                // 失效  24小时内不操作继续发送，则该文件发送状态置为已失效
            case UploadStatus.EXPIRED:
                state = this.locale.expired;
                break;
            default:
                state = this.locale.uploaded;
                break;
            }
            return state;
        },
    };
}

function getNameLength(name) {
    let mark = 0;
    for (let i = 0; i < name.length; i += 1) {
        const cName = name[i];
        mark += isChinese(cName) ? 2 : 1;
    }
    return mark;
}

function resetInputFileValue(inputId) {
    const $inputFile = $(`#${inputId}`);
    $inputFile.val('');
}

function checkAttachInBound(context, fileList) {
    const attachCount = context.attachments.length + fileList.length;
    const isBeyond = attachCount > 10;
    return !isBeyond;
}

function checkAttachSize(fileList, fileSize) {
    let hasZero = 0;
    /* eslint-disable no-restricted-syntax */
    // eslint-disable-next-line guard-for-in
    for (const key in fileList) {
        if (fileList[key].size === 0) {
            hasZero = 1;
            break;
        }
        if (fileList[key].size > fileSize) {
            hasZero = 2;
            break;
        }
    }
    /* eslint-enable no-restricted-syntax */
    return hasZero;
}

function upload(tmpFile, context) {
    const dataModel = context.$im().dataModel;
    const pinApi = dataModel.Pin;
    const fileType = getFileType(tmpFile.name);
    const attach = {
        data: tmpFile,
        progress: 0,
        url: null,
        uploadId: Date.now(),
        uploadStatus: UploadStatus.READY,
        rawSize: tmpFile.size,
    };
    context.attachments.push(attach);
    pinApi.uploadAttach(fileType, tmpFile, attach, (err) => {
        if (err) {
            console.warn('上传失败');
            return;
        }
        saveLocalAttach(attach.data, attach.data.path, pinApi);
    });
}

function resumeUpload(attach) {
    const dataModel = window.RongIM.dataModel;
    const fileType = getFileType(attach.data.name);
    const pinApi = dataModel.Pin;
    pinApi.uploadAttach(fileType, attach.data, attach, (err) => {
        if (err) {
            console.warn('上传失败');
        }
    });
}

function watchConnectStatus(context) {
    const im = context.$im();
    im.$watch('status', (status) => {
        if (status !== RongIMLib.ConnectionStatus.CONNECTED) {
            context.attachments.forEach((attach) => {
                const isUploading = attach.uploadStatus === UploadStatus.UPLOADING;
                if (isUploading) {
                    context.cancelUpload(attach);
                }
            });
        }
    });
}

function saveLocalAttach(attach, localPath, pinApi) {
    pinApi.addPinLocalAttach(attach.name, localPath);
}
