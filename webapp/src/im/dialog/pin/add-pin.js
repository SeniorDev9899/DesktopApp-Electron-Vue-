/* eslint-disable no-param-reassign */
import config from '../../config';
import avatar from '../../components/avatar.vue';
import getOrg from '../../components/group/org.vue';
import getFriend from '../../components/group/group-friend.vue';
import getStar from '../../components/group/group-star.vue';
import addAttachment from './add-attachment';
import formatFileSize from '../../utils/formatFileSize';
import templateFormat from '../../utils/templateFormat';
import getFileType from '../../utils/getFileType';
import console from '../../utils/console';
import UploadStatus from '../../utils/UploadStatus';
import {
    getServerConfigByChainedKey,
    getServerConfig,
} from '../../cache/helper';

const immediately = 'Immediately';

export default function () {
    const options = {
        name: 'add-pin',
        template: 'templates/pin/add-pin.html',
        data() {
            const serverConfig = getServerConfig();
            return {
                enabledSms: serverConfig.sms.verification_state,
                maxReceiverCount: serverConfig.pin.max_receiver_count,
                show: true,
                tab: 'org',
                selected: [],
                defaultSelected: $.extend(true, [], []),
                isTimeSelecting: false,
                isTypeSelecting: false,
                isSpecificTimeSelecting: false,
                selectedTime: immediately,
                attachments: [],
                content: '',
                isSendSms: false,
                isStaff: this.$im().auth.isStaff,
            };
        },
        components: {
            avatar,
            org: getOrg,
            friend: getFriend,
            star: getStar,
        },
        computed: {
            isStarSelected() {
                return this.tab === 'star';
            },
            isOrgSelected() {
                return this.tab === 'org';
            },
            isFriendSelected() {
                return this.tab === 'friend';
            },
            isShowTimeSelect() {
                return this.isTimeSelecting && !this.isSpecificTimeSelecting;
            },
            isAbleSend() {
                return this.selected.length && this.content;
            },
            canNotSelected() {
                const loginUser = this.$im().loginUser || { id: '' };
                return [loginUser];
            },
            isAttachFull() {
                const maxAttachCount = getServerConfigByChainedKey(
                    'pin.max_attachment_count',
                );
                return this.attachments.length >= maxAttachCount;
            },
        },
        created() {
            if (!this.isStaff) {
                this.tab = 'star';
            }
        },
        mounted() {
            console.log(this.$el.firstChild);
        },
        methods: {
            reset() {
                this.selected.push({});
                this.selected.pop();
            },
            toastError(errorCode) {
                this.RongIM.common.toastError(errorCode, this.$el.firstChild);
            },
            toast(params) {
                params.el = this.$el.firstChild;
                this.RongIM.common.messageToast(params);
            },
            getSelectedContact() {
                const context = this;
                const selLen = context.selected.filter(
                    item => !context.executiveLimit(item),
                ).length;
                const selectedContactFormat = config.currentLocale().components.newPin
                    .selectedContact;
                return this.localeFormat(selectedContactFormat, selLen);
            },
            close() {
                this.show = false;
            },
            added(members) {
                added(this, members, this.$im());
            },
            removed(members) {
                removed(this, members);
            },
            selectTab(tab) {
                this.tab = tab;
            },
            showSendTime() {
                this.isTimeSelecting = !this.isTimeSelecting;
                this.isSpecificTimeSelecting = false;
                this.isTypeSelecting = false;
            },
            showSendType() {
                this.isTypeSelecting = !this.isTypeSelecting;
                this.isTimeSelecting = false;
                this.isSpecificTimeSelecting = false;
            },
            getSelectedTime() {
                if (this.selectedTime === immediately) {
                    return config.currentLocale().components.newPin.immediatelySend;
                }
                const date = new Date(this.selectedTime);
                return formatDate(null, date);
            },
            getSelectedType() {
                const localeNewPin = config.currentLocale().components.newPin;
                return this.isSendSms ? localeNewPin.sms : localeNewPin.app;
            },
            selectSendType(isSms) {
                this.isSendSms = isSms;
                this.isTypeSelecting = false;
            },
            selectImmediately() {
                this.selectedTime = immediately;
                this.isTimeSelecting = false;
            },
            selectSpecificTime() {
                if (
                    Object.prototype.toString.call(this.selectedTime)
          !== '[object Number]'
                ) {
                    const date = new Date();
                    date.setMilliseconds(0);
                    date.setSeconds(0);
                    this.selectedTime = date.getTime();
                }
                this.isSpecificTimeSelecting = true;
            },
            clickAddAttachment() {
                addAttachment(this);
            },
            getDateItems() {
                const locale = config.currentLocale().components.newPin;
                return [
                    locale.year,
                    locale.month,
                    locale.day,
                    locale.hour,
                    locale.minute,
                ];
            },
            getFormatDate(type) {
                const date = new Date(this.selectedTime);
                return formatDate(type, date);
            },
            calcDate,
            addAttachment(event) {
                const context = this;
                const fileSize = getServerConfigByChainedKey('media.max_file_size') * 1024 * 1024;
                const fileMaxSize = fileSize ? formatFileSize(fileSize) : '';
                const message = fileMaxSize
                    ? templateFormat(context.locale.tips.overSize, fileMaxSize)
                    : '';

                const fileList = event.target.files;
                if (!checkAttachInBound(context, fileList)) {
                    return;
                }
                const sizeState = checkAttachSize(fileList, fileSize);
                if (sizeState === 1 || sizeState === 2) {
                    const showMsg = sizeState === 1 ? context.locale.tips.zeroSize : message;
                    this.toast({
                        type: 'error',
                        message: showMsg,
                    });
                }
                let uploadCount = 0;
                for (let i = 0; i < fileList.length; i += 1) {
                    const file = fileList[i];
                    if (file.size > 0 && file.size <= fileSize) {
                        upload(file, context);
                        uploadCount += 1;
                    }
                }
                if (uploadCount === 0) {
                    return;
                }
                addAttachment(context);
                resetInputFileValue('rongAddAttachment');
            },
            sendPin() {
                let nowTime = new Date();
                nowTime = nowTime.setSeconds(0);
                const isInvalidTime = this.selectedTime !== immediately && nowTime > this.selectedTime;
                if (isInvalidTime) {
                    this.toast({
                        type: 'error',
                        message: config.currentLocale().components.newPin.pastTime,
                    });
                    this.selectedTime = nowTime;
                    return;
                }
                let isAttachmentsComplete = true;
                this.attachments.forEach((atta) => {
                    if (atta.progress < 100) {
                        isAttachmentsComplete = false;
                    }
                });
                if (!isAttachmentsComplete) {
                    this.toast({
                        type: 'error',
                        message: config.currentLocale().components.newPin.failSend,
                    });
                    return;
                }

                const isValidContent = this.selected.length && this.content;
                if (isValidContent) sendPin(this, this.$im());
            },
            closeSelectTime(event) {
                const $target = $(event.target);
                const wrap = '.rong-pin-select-time, .rong-pin-select-sepcific-time, .rong-pin-select-time-box, .rong-pin-select-type-box';
                const inBody = $target.closest('body').length > 0;
                const inWrap = $target.closest(wrap).length < 1;
                const isOuter = inBody && inWrap;
                const isSelecting = this.isTimeSelecting
          || this.isSpecificTimeSelecting
          || this.isTypeSelecting;
                if (isSelecting && isOuter) {
                    this.isSpecificTimeSelecting = false;
                    this.isTimeSelecting = false;
                    this.isTypeSelecting = false;
                }
            },
            enterContent() {
                const context = this;
                const length = this.content.length;
                if (length > 5000) {
                    context.toast({
                        type: 'error',
                        message: context.locale.components.newPin.mostContent,
                    });
                    context.content = context.content.substring(0, 5000);
                }
            },
            executiveLimit(item) {
                if (
                    item.isFriend
          || this.$im().auth.isExecutive
          || this.disableExecutive
                ) {
                    return false;
                }
                const isExecutive = !!item.isExecutive;
                return isExecutive;
            },
            maxCountLimit() {
                const mostReceiveFormat = config.currentLocale().components.newPin
                    .mostReceive;
                const hintMessage = this.localeFormat(
                    mostReceiveFormat,
                    this.maxReceiverCount,
                );
                this.toast({
                    type: 'error',
                    message: hintMessage,
                });
                this.reset();
            },
        },
    };
    window.RongIM.common.mountDialog(options);
}

function resetInputFileValue(inputId) {
    const $inputFile = $(`#${inputId}`);
    $inputFile.val('');
}

function checkAttachInBound(context, fileList) {
    // PIN 携带的附件最大数
    const maxAttachCount = getServerConfigByChainedKey('pin.max_attachment_count');
    // 附件个数设置
    const attachCount = context.attachments.length + fileList.length;
    const isBeyond = attachCount > maxAttachCount;
    if (isBeyond) {
        context.toast({
            type: 'error',
            message: templateFormat(context.locale.components.newPin.mostAtta, maxAttachCount),
        });
    }
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

function sendPin(context, im) {
    if (hasUploadingFile(context)) {
        context.toast({
            type: 'error',
            message: context.locale.components.newPin.uploading,
        });
        return;
    }
    const params = getSendParams(context);
    const pinApi = im.dataModel.Pin;
    pinApi.create(params, (errorCode, result) => {
        if (errorCode) {
            context.toastError(errorCode);
            return;
        }
        // 31592 - 【PIN】本地上传的 PIN 附件，在发送列表里查看需要下载
        const attachments = context.attachments.filter(atta => atta.progress !== -1);
        attachments.map(atta => pinApi.addPinLocalAttach(result.uid, atta.data.path));
        sendMessageWhenInSendpinPage(im, result);
        context.close();
    });
}

function hasUploadingFile(context) {
    const attachments = context.attachments.filter(
        atta => atta.progress !== 100 && atta.progress !== -1,
    );
    return attachments.length !== 0;
}

function getSendParams(context) {
    const reveiverIds = context.selected
        .filter(item => !context.executiveLimit(item))
        .map(reveiver => reveiver.id);
    let attachments = context.attachments.filter(atta => atta.progress !== -1);
    attachments = attachments.map(atta => ({
        name: atta.data.name,
        size: atta.data.size,
        mime_type: atta.data.type || 'unknown',
        url: atta.url,
    }));
    const delayed = Object.prototype.toString.call(context.selectedTime) === '[object Number]';
    const params = {
        content: context.content,
        receiver_ids: reveiverIds,
        delayed,
        attachments,
        send_sms: context.isSendSms,
    };
    params.delayed_send_time = delayed ? context.selectedTime : '';
    return params;
}

function sendMessageWhenInSendpinPage(im, result) {
    if (im.$route.name !== 'pin-sent') {
        return;
    }
    // content = $.extend(content, { creatorUid: content.creator_uid, timestamp: content.create_dt });
    const pinApi = im.dataModel.Pin;
    const message = {
        messageType: pinApi.MessageType.PinNotifyMessage,
        content: {
            pinUid: result.uid,
            creatorUid: result.creatorUid,
            timestamp: result.timestamp,
            content: result.content,
        },
    };
    pinApi.observerList.notify(message);
}

function calcDate(dateType, addNumber) {
    const date = new Date(this.selectedTime);
    switch (dateType) {
    case 0:
        date.setFullYear(date.getFullYear() + addNumber);
        break;
    case 1:
        date.setMonth(date.getMonth() + addNumber);
        break;
    case 2:
        date.setDate(date.getDate() + addNumber);
        break;
    case 3:
        date.setHours(date.getHours() + addNumber);
        break;
    case 4:
        date.setMinutes(date.getMinutes() + addNumber);
        break;
    default:
        break;
    }
    const thisTime = new Date().getTime();
    if (thisTime > date.getTime()) {
        this.toast({
            type: 'error',
            message: config.currentLocale().components.newPin.pastTime,
        });
        return;
    }
    date.setSeconds(0);
    date.setMilliseconds(0);
    this.selectedTime = date.getTime();
}

function addZeroWhenSingle(number) {
    return `${number}`.length > 1 ? number : `0${number}`;
}

function formatDate(type, date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour = date.getHours();
    const minute = date.getMinutes();
    switch (type) {
    case 0:
        return year;
    case 1:
        return month;
    case 2:
        return day;
    case 3:
        return hour;
    case 4:
        return minute;
    default:
        return `${year}/${month}/${day} ${addZeroWhenSingle(
            hour,
        )}:${addZeroWhenSingle(minute)}`;
    }
}

function added(context, members, im) {
    const selectedIdList = context.selected.map(item => item.id);
    const addedList = members.filter((item) => {
        const hasSelected = selectedIdList.indexOf(item.id) < 0;
        const notSelf = item.id !== im.loginUser.id;
        return hasSelected && notSelf;
    });
    let totalList = context.selected.concat(addedList);
    context.selected = totalList;
    totalList = totalList.filter(item => !context.executiveLimit(item));

    // PIN 最大人数由服务端下发
    const maxReceiverCount = context.maxReceiverCount;
    const mostReceiveFormat = im.locale.components.newPin.mostReceive;
    const hintMessage = context.localeFormat(mostReceiveFormat, maxReceiverCount);
    if (totalList.length > maxReceiverCount) {
        context.toast({
            type: 'error',
            message: hintMessage,
        });
        removed(context, addedList);
    }
}

function removed(context, members) {
    const idList = members.map(item => item.id);
    const reservedIdList = context.defaultSelected.map(item => item.id);
    context.selected = context.selected.filter((item) => {
        const reserved = reservedIdList.indexOf(item.id) >= 0;
        return reserved || idList.indexOf(item.id) < 0;
    });
}

function upload(file, context) {
    const im = context.$im();
    const models = im.dataModel;
    const pin = models.Pin;
    const fileType = getFileType(file.name);
    const attach = {
        data: file,
        progress: 0,
        url: null,
        uploadId: Date.now(),
        uploadStatus: UploadStatus.READY,
        rawSize: file.size,
    };
    context.attachments.push(attach);
    pin.uploadAttach(fileType, file, attach, (err) => {
        if (err) {
            console.warn('上传失败');
            return;
        }
        saveLocalAttach(im, attach.data, attach.data.path);
    });
}

function saveLocalAttach(im, attach, localPath) {
    im.dataModel.Pin.addPinLocalAttach(attach.name, localPath);
}
