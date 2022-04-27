/* eslint-disable no-param-reassign */
import getLocaleMixins from '../../utils/getLocaleMixins';
import avatar from '../avatar.vue';
import throttle from '../../utils/throttle';
import dateFormatUtil from '../../utils/dateFormat';
import formatFileSize from '../../utils/formatFileSize';
import userProfile from '../../dialog/contact/user';
import addReceiversDialog from '../../dialog/pin/add-receiver';
import highlight from '../../common/highlight';
import { downloader } from '../../download';
import file from '../../file';
import { messageIfSupportView } from '../../utils/netEnvironment';

export default {
    name: 'pinDetail',
    mixins: [getLocaleMixins('pinDetail')],
    props: ['isSender', 'isReply', 'pinDetail'],
    data() {
        return {
            confirmExpand: false,
            receivedExpand: false,
            receiverList: null,
            commentList: [],
            entryComment: '',
            attachmentList: [],
            isShowEnd: false,
            downloaders: {},
            commentBusy: false,
        };
    },
    components: {
        avatar,
    },
    directives: {
        focus: {
            inserted(el, value) {
                if (value) {
                    el.focus();
                }
            },
        },
    },
    computed: {
        pinUid() {
            return this.pinDetail ? this.pinDetail.uid : null;
        },
        user() {
            return this.pinDetail ? this.pinDetail.user : null;
        },
        getConfirmReceivers() {
            return getConfirmReceivers(this, true);
        },
        getUnConfirmReceivers() {
            return getConfirmReceivers(this, false);
        },
        isShowConfirmBtn() {
            return !this.isSender && !this.pinDetail.confirmed;
        },
        isShowCommentTopLine() {
            const hasComment = this.commentList.length;
            let isExpand = (this.isSender && this.receivedExpand) || this.confirmExpand;
            if (this.isSender && this.confirmExpand) {
                isExpand = isExpand && this.receivedExpand;
            }
            return hasComment && isExpand;
        },
        isShowInput() {
            const pinDetail = this.pinDetail;
            const isOutDelayed = pinDetail.delayed && pinDetail.delayed_send_dt < new Date().getTime();
            const isConfirmed = this.isSender || pinDetail.confirmed;
            const isValidTime = !pinDetail.delayed || isOutDelayed;
            return isConfirmed && isValidTime;
        },
        getReceiverList() {
            if (this.isShowEnd) {
                return this.receiverList || [];
            }
            return [];
        },
        getCommentList() {
            const commentList = this.commentList;
            let split = document.body.clientHeight || 120;
            split = parseInt((split - 120) / 70);
            if (this.isShowEnd) {
                return commentList;
            }
            return commentList.length > 20
                ? commentList.slice(0, split)
                : commentList;
        },
        disableSend() {
            return this.entryComment.trim() === '';
        },
    },
    methods: {
        userProfile,
        getUsername(...args) {
            return this.RongIM.common.getUsername(...args);
        },
        formatFileSize,
        inputFocus() {
            Vue.nextTick(() => {
                const replyInput = $('#replyInput')[0];
                if (replyInput) replyInput.focus();
            });
        },
        isShowConfirmStatus() {
            const isSender = this.isSender;
            const isConfirmed = !isSender && this.pinDetail.confirmed;
            return isSender || isConfirmed;
        },
        getUserName(user) {
            return user ? user.alias || user.name : ' ';
        },
        clickShowConfirmDetail() {
            this.confirmExpand = !this.confirmExpand;
        },
        getConfirmDetail() {
            if (this.isSender) {
                const isLoadedReceivers = this.receiverList && this.isShowEnd;
                const unConfirmCount = isLoadedReceivers
                    ? this.getUnConfirmReceivers.length
                    : this.pinDetail.un_confirm_count;
                let confirmFormat = this.locale.components.pinDetail;
                confirmFormat = unConfirmCount === 0
                    ? confirmFormat.allConfirmed
                    : confirmFormat.unConfirmedCount;
                return unConfirmCount === 0
                    ? confirmFormat
                    : this.localeFormat(confirmFormat, unConfirmCount);
            }
            const confirmedFormat = this.locale.components.receivedPin.confirmed;
            return this.pinDetail.confirmed ? confirmedFormat : '';
        },
        clickShowReceiveDetail() {
            this.receivedExpand = !this.receivedExpand;
        },
        dateFormat(timestamp) {
            const options = {
                alwaysShowTime: true,
            };
            return dateFormatUtil(timestamp, options);
        },
        pinDate() {
            const pinDetail = this.pinDetail;
            const createDt = pinDetail.send_dt || pinDetail.create_dt;
            const timestamp = pinDetail.delayed
                ? pinDetail.delayed_send_dt
                : createDt;
            const options = {
                alwaysShowTime: true,
            };
            return dateFormatUtil(timestamp, options);
        },
        enterComment(event) {
            const that = this;
            if (event.shiftKey) {
                return;
            }
            if (event.target.value === '\n') {
                that.entryComment = '';
            }
            if (this.entryComment === '') {
                return;
            }
            event.target.value = '';
            this.sendComment();
        },
        sendComment() {
            const that = this;
            const common = this.RongIM.common;
            const im = this.$im();
            const pinApi = im.dataModel.Pin;
            if (that.commentBusy) {
                return;
            }
            that.commentBusy = true;
            that.entryComment = that.entryComment.replace(/^ /, '');
            if (!that.entryComment) {
                common.messageToast({
                    type: 'error',
                    message: that.locale.components.pinDetail.inputCanNotEmpty,
                });
                that.commentBusy = false;
                return;
            }
            const comment = {
                pin_uid: that.pinUid,
                publisher_uid: im.auth.id,
                content: that.entryComment,
                create_dt: Date.now(),
                user: im.loginUser,
            };
            that.commentList.unshift(comment);

            pinApi.comment(that.pinUid, that.entryComment, null, (errorCode) => {
                that.commentBusy = false;
                if (errorCode) {
                    common.toastError(errorCode);
                    return;
                }
                that.entryComment = '';
            });
        },
        pinConfirm() {
            const that = this;
            const im = this.$im();
            const pinApi = im.dataModel.Pin;
            pinApi.confirm(that.pinUid, () => {
                that.pinDetail.confirmed = true;
                setupReceiverConfirm(that, im.loginUser.id);
                that.$emit('confirmPin');
                that.inputFocus();
            });
        },
        addReceivers() {
            if (!this.receiverList) {
                return;
            }
            const defaultSelected = this.receiverList.map(receiver => receiver.user);
            addReceiversDialog(defaultSelected, this);
        },
        download(url, isResume, attach) {
            // 内外网隔离
            const [viewUrl, noSupportView] = messageIfSupportView(url);
            url = viewUrl;
            if (noSupportView) {
                this.RongIM.common.toastError('file-environment-error');
                return;
            }

            const currentDownload = this.downloaders[url];
            if (currentDownload) {
                if (isResume) {
                    // 38858 - 【文件】下载PIN中的文件暂停每次都需要重新进行下载
                    // [期望]应该可以暂停下载保留当前下载进度，再次点击下载时可以继续进行下载
                    attach.isCanceled = false;
                    attach.isDownloading = true;
                    /* eslint-disable consistent-return */
                    return currentDownload.resume();
                }
                currentDownload.saveAs();
            }
            /* eslint-disable consistent-return */
            return undefined;
        },
        cancelDownload(url, attach) {
            const currentDownload = this.downloaders[url];
            if (currentDownload) {
                // 38858 - 【文件】下载PIN中的文件暂停每次都需要重新进行下载
                // [期望]应该可以暂停下载保留当前下载进度，再次点击下载时可以继续进行下载
                attach.isCanceled = true;
                attach.isDownloading = false;
                currentDownload.pause();
            }
        },
        getFileIconClass(name) {
            const prefix = 'rong-pin-file-';
            const getPointTotal = name.split('.').length - 1;
            const splitArr = name.split('.');
            return prefix + splitArr[getPointTotal];
        },
        getFileIconStyle(attach) {
            const name = attach.name || '';
            const imageMark = ['png', 'jpeg', 'gif', 'jpg'];
            const getPointTotal = name.split('.').length - 1;
            const type = name.split('.')[getPointTotal];
            const isImage = imageMark.indexOf(type) !== -1;
            if (isImage) {
                return {
                    'background-image': `url(${attach.url})`,
                    'background-size': 'cover',
                    'background-position': '0 0',
                };
            }
            return undefined;
        },
        getPinContent(content) {
            if (!content) {
                return undefined;
            }
            content = this.RongIM.common.textMessageFormat(content);
            return highlight(content);
        },
        isShowDelayedIcon() {
            const pin = this.pinDetail;
            if (!pin.delayed) {
                return false;
            }
            const sendTime = pin.delayed_send_dt;
            const thisTime = new Date().getTime();
            return sendTime > thisTime;
        },
        openFolder(attach) {
            openFolder(attach, this);
        },
    },
    created() {
        const im = this.$im();
        created(this, im.dataModel, im);
    },
    mounted() {
        const context = this;
        $('.meeting-id')
            .unbind('click')
            .bind('click', function onClick() {
                const id = $(this).text().split('meeting://')[1];
                context.$router.push({
                    name: 'seal-meeting-now',
                    params: {
                        id,
                    },
                });
                // context.RongIM.common.messagebox({
                //     message: context.locale.components.pinDetail.webRtcTip,
                // });
            });
    },
    destroyed() {
        const im = this.$im();
        const pinApi = im.dataModel.Pin;
        unwatch(this, pinApi);
    },
};

function created(context, dataModel, im) {
    const pinApi = dataModel.Pin;
    const userApi = dataModel.User;
    hidePanel(context, im);
    commentWatch(context, im, pinApi, userApi);
    confirmWatch(context, pinApi);
    newReciverWatch(context, pinApi, userApi);
    setDetail(context, im, context.pinUid);
}

const setupCommentList = throttle((context, pinApi, uid) => {
    pinApi.getCommentList(uid, (errorCode, comments) => {
        if (errorCode) {
            return;
        }
        Vue.nextTick(() => {
            context.commentList = comments;
        });
    });
}, 2000);

function commentWatch(context, im, pinApi) {
    context.commentWatch = function watchComment(message) {
        const isMessageType = message.messageType === pinApi.MessageType.PinCommentMessage;
        if (isMessageType) {
            const comment = message.content;
            // comment.pinUid === context.pinUid && addPinComment(context, pinApi, userApi, comment);
            // 多设备同时登陆时，收到多条相同的 pin 消息，导致 pin 详情页评论重复，暂时修改为和移动端相同的逻辑：收到消息后，同步获取 pin 评论列表
            if (comment.pinUid === context.pinUid) {
                setupCommentList(context, pinApi, comment.pinUid);
            }
        }
    };
    pinApi.watch(context.commentWatch);
}

function confirmWatch(context, pinApi) {
    context.confirmWatch = function watchConfirm(message) {
        const isMessageType = message.messageType === pinApi.MessageType.PinConfirmMessage;
        const isThisPinMessage = isMessageType && message.content.pinUid === context.pinUid;
        if (isThisPinMessage) {
            setupReceiverConfirm(context, message.content.operatorUid);
        }
    };
    pinApi.watch(context.confirmWatch);
}

function newReciverWatch(context, pinApi) {
    context.newReciverWatch = function watchReceiver(message) {
        const isMessageType = message.messageType === pinApi.MessageType.PinNewReciverMessage;
        const isThisPinMessage = isMessageType && message.content.pinUid === context.pinUid;
        if (isThisPinMessage) {
            setupReceivers(context, pinApi, context.pinUid);
        }
    };
    pinApi.watch(context.newReciverWatch);
}

function unwatch(context, pinApi) {
    pinApi.unwatch(context.commentWatch);
    pinApi.unwatch(context.confirmWatch);
    pinApi.unwatch(context.newReciverWatch);
}
function setupReceiverConfirm(context, uid) {
    if (!context.receiverList) {
        return;
    }
    context.receiverList.forEach((receiver) => {
        if (receiver.receiver_uid === uid) {
            receiver.is_confirmed = true;
        }
    });
}

function hidePanel(context, im) {
    im.$on('imclick', (event) => {
        const $target = $(event.target);
        const wrap = '.rong-pin-detail, .rong-pin-item, .rong-dialog';
        const inBody = $target.closest('body').length > 0;
        const inWrap = $target.closest(wrap).length < 1;
        const isOuter = inBody && inWrap;
        if (isOuter) context.$emit('hidepanel', event.target);
    });
}

function setDetail(context, im, pinUid) {
    const dataModel = im.dataModel;
    const pinApi = dataModel.Pin;
    if (context.pinDetail.attachment_count > 0) {
        setupPinAttachmentList(context, pinApi, pinUid);
    }
    setupCommentList(context, pinApi, pinUid);
    setupReceivers(context, pinApi, pinUid);
    setupShowEnd(context, im);
}

function setupShowEnd(context, im) {
    im.$on('pinDetailLoadDone', () => {
        context.isShowEnd = true;
        if (context.isReply) {
            context.inputFocus();
        }
        im.$off('pinDetailLoadDone');
    });
}

function setupReceivers(context, pinApi, uid) {
    pinApi.getReceiverList(uid, (errorCode, receivers) => {
        if (errorCode) {
            return;
        }
        context.receiverList = receivers;
    });
}

function loadDownloadStat(uId) {
    const fileState = downloader.getProgress(uId);
    if (fileState.offset) {
        return fileState.offset;
    }
    return 0;
}

function setupPinAttachmentList(context, pinApi, uid) {
    pinApi.getAttachments(uid, (errorCode, result) => {
        const progress = {
            isDownloading: false,
            downloadProgress: 0,
            isCanceled: false,
        };
        result = result.map(attach => $.extend(attach, progress));
        result = result.map((atta) => {
            const imageUrl = '//rongcloud-image.';
            const fileUrl = '//rongcloud-file.';
            if (
                atta.url.indexOf(imageUrl) === -1
                && atta.url.indexOf(fileUrl) === -1
            ) {
                atta.url = `${atta.url}?attname=${encodeURI(atta.name)}`;
            }
            const downloadSize = loadDownloadStat(atta.uid);
            if (downloadSize) {
                atta.isCanceled = true;
                atta.downloadProgress = (downloadSize / atta.size) * 100;
            }
            return atta;
        });
        context.attachmentList = result;
        setupAttachDownload(context);
        setupAttachExists(context.attachmentList, context);
    });
}

function setupAttachDownload(context) {
    context.attachmentList.forEach((attach) => {
        attach.downloaders = context.downloaders;
        initDownload(attach, attach.url, context);
    });
}

function getConfirmReceivers(context, isConfirmed) {
    if (!context.getReceiverList) {
        return [];
    }
    return context.getReceiverList.filter(
        receiver => receiver.is_confirmed === isConfirmed,
    );
}

function openFolder(attach, context) {
    const localPath = attach.localPath;
    const fileExist = file.checkExist(localPath);
    if (attach.isDownloading && fileExist) {
        return;
    }
    if (localPath && fileExist) {
        file.openDir(localPath);
    } else {
        context.RongIM.common.toastError('file-404');
        attach.downloadProgress = 0;
        removeLocalAttach(attach, context);
    }
}

function initDownload(attach, fileUrl, context) {
    const fileApi = context.$im().dataModel.File;
    const common = context.RongIM;
    fileApi.getFileDownloadToken((error, token) => {
        if (error) {
            common.toastError('download-error');
            return;
        }
        let url = fileUrl;
        if (url.indexOf('?') !== -1) {
            url += `&token=${token}`;
        } else {
            url += `?token=${token}`;
        }
        const task = downloader.load({
            url,
            name: attach.name,
            size: attach.size,
            uId: attach.uid,
        });
        task.onError = function onError() {
            // stateCode = ('download-' + params.state);
            attach.isDownloading = false;
            attach.isCanceled = true;
            attach.downloadProgress = 0;
            // common.handleError(stateCode);
        };

        // 下载准备完毕, 此时可知文件大小
        task.onReady = function onReady(data) {
            console.debug(`full size:${data.total}`);
            attach.isDownloading = true;
            attach.isCanceled = false;
        };

        // 下载中,返回下载进度
        task.onProgress = function onProgress(data) {
            // stateCode = null;
            /* context.isDownloading = true;
                context.isCanceled = false; */
            attach.downloadProgress = (data.loaded / data.total) * 100;
        };

        // 下载完成
        task.onComplete = function onComplete(data) {
            attach.isDownloading = false;
            if (!data.path) {
                return;
            }
            attach.localPath = data.path;
            saveLocalAttach(context, attach, data.path);
            attach.downloadProgress = 100;
        };

        // 下载取消
        task.onCancel = function onCancel() {
            attach.isDownloading = false;
            attach.isCanceled = false;
            // context.downloadProgress = 0;
        };
        attach.downloaders[fileUrl] = task;
    });
}

function saveLocalAttach(context, attach, localPath) {
    const pinApi = context.$im().dataModel.Pin;
    // 31592 - 【PIN】本地上传的 PIN 附件，在发送列表里查看需要下载
    pinApi.addPinLocalAttach(attach.pin_uid, localPath);
}

function removeLocalAttach(attach, context) {
    const pinApi = context.$im().dataModel.Pin;
    pinApi.removeLocalAttach(attach.uid);
}

function setupAttachExists(attachmentList, context) {
    const pinApi = context.$im().dataModel.Pin;
    attachmentList.forEach((attach) => {
        setAttach(attach);
    });
    function setAttach(attach) {
        // 31592 - 【PIN】本地上传的 PIN 附件，在发送列表里查看需要下载
        const localPath = pinApi.getPinLocalAttach(attach.pin_uid);
        const fileExist = file.checkExist(localPath);
        if (fileExist) {
            attach.localPath = localPath;
            attach.downloadProgress = 100;
        }
    }
}
