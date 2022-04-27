/* eslint-disable no-param-reassign */
// var messageApi = RongIM.dataModel.Message;
// var fileApi = RongIM.dataModel.File;

import isEmpty from '../../../utils/isEmpty';
import encodeHtmlStr from '../../../utils/encodeHtmlStr';
import getLocaleMixins from '../../../utils/getLocaleMixins';
import { downloader } from '../../../download';
import config from '../../../config';
import file from '../../../file';
import { messageIfSupportView } from '../../../utils/netEnvironment';

const name = 'quote-file-message';

export default {
    name,
    props: ['message'],
    mixins: [getLocaleMixins(name)],
    data() {
        return {
            filename: '',
            basename: '',
            extname: '',
            extnameWidth: 0,
            downloadStatus: '',
            downloadProgress: 0,
        };
    },
    created() {
        const context = this;
        const message = context.message;
        const [url, noSupportView] = messageIfSupportView(message.content.content.fileUrl);
        message.content.content.fileUrl = url;
        message.noSupportView = noSupportView;
    },
    mounted() {
        const context = this;
        const message = context.message;

        let downloadStatus = '';
        const url = message.content.content.localPath;
        if (!isEmpty(url)) {
            const fileExists = getFileExists(url);
            if (fileExists) {
                downloadStatus = 'DOWNLOADED';
            }
        }
        context.downloadStatus = downloadStatus;
        const fileState = downloader.getProgress(message.messageUId);
        if (!$.isEmptyObject(fileState)) {
            context.downloadStatus = 'CANCELLED';
            context.downloadProgress = (fileState.offset / message.content.content.size) * 100;
            const task = this.RongIM.dataModel.File.downloadManage.get(message.messageUId);
            if (task) {
                context.downloadProgress = (task.stats.offset / message.content.size) * 100;
                attachDownloadEvents(task, context);
                context.downloader = task;
                if (!task.isPause) {
                    context.downloadStatus = 'DOWNLOADING';
                }
            }
        }

        const fileMessage = context.message.content;
        context.filename = fileMessage.content.name;

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
        context.basename = encodeHtmlStr(basename);
        context.extnameWidth = context.RongIM.common.getTextRenderWidth(context.extname, 12);
    },
    computed: {
        support() {
            return config.support;
        },
    },
    methods: {
        download(message/* , isResume */) {
            if (this.message.noSupportView) {
                this.RongIM.common.toastError('file-environment-error');
                return;
            }
            if (this.downloadStatus === 'DOWNLOADING') {
                return;
            }
            if (this.downloader) {
                this.downloader.continue();
                return;
            }
            const context = this;
            const content = message.content.content;

            const fileApi = context.RongIM.dataModel.File;
            fileApi.getFileDownloadToken((error, token) => {
                if (error) {
                    context.RongIM.common.toastError('download-error');
                    return;
                }
                let url = content.fileUrl;
                if (url.includes('?')) {
                    url += `&token=${token}`;
                } else {
                    url += `?token=${token}`;
                }
                const task = downloader.load({
                    uId: message.messageUId,
                    url,
                    name: content.name,
                    size: content.size,
                });
                attachDownloadEvents(task, context);
                task.continue();
            });
        },
        openFile() {
            if (this.message.noSupportView) {
                this.RongIM.common.toastError('file-environment-error');
                return;
            }
            if (this.downloadStatus !== 'DOWNLOADED') {
                return;
            }
            const localPath = this.message.content.content.localPath;
            if (!getFileExists(localPath)) {
                this.download(this.message);
                return;
            }
            file.open(localPath);
        },
        isShowProgress() {
            const isDownloading = this.downloadStatus === 'DOWNLOADING';
            const isCanceled = this.downloadStatus === 'CANCELLED';
            return isDownloading || isCanceled;
        },
    },
};

function getFileExists(fileUrl) {
    let existed = false;
    if (!isEmpty(fileUrl)) {
        existed = file.checkExist(fileUrl);
    }
    return existed;
}

function attachDownloadEvents(downloadTask, context) {
    const fileApi = context.RongIM.dataModel.File;
    const messageApi = context.RongIM.dataModel.Message;
    const common = context.RongIM.common;
    // 下载中,返回下载进度
    const message = context.message;
    // 下载准备完毕, 此时可知文件大小
    downloadTask.onReady = function onReady(data) {
        console.debug(`full size:${data.total}`);
        fileApi.downloadManage.add(message.messageUId, downloadTask);
        context.downloader = downloadTask;
    };

    downloadTask.onProgress = function onProgress(data) {
        context.downloadStatus = 'DOWNLOADING';
        context.downloadProgress = (data.loaded / data.total) * 100;
    };

    // 下载完成
    downloadTask.onComplete = function onComplete(data) {
        fileApi.downloadManage.remove(message.messageUId);
        context.downloader = null;
        context.downloadStatus = 'DOWNLOADED';
        if (!data.path) {
            // 被取消
            return;
        }
        message.content.content.localPath = data.path;
        messageApi.setContent(message);
        context.downloadProgress = 0;
    };

    downloadTask.onError = function onError(error) {
        fileApi.downloadManage.remove(message.messageUId);
        context.downloader = null;
        const errorCode = ['ebusy', 'eperm'].indexOf(error) > -1 ? error : 'error';
        common.toastError(`download-${errorCode}`);
        if (context.downloadProgress === 0) {
            context.downloadStatus = 'READY';
        } else {
            context.downloadStatus = 'CANCELLED';
        }
    };

    // 下载取消
    downloadTask.onCancel = function onCancel() {
        context.downloadStatus = 'READY';
    };
}
