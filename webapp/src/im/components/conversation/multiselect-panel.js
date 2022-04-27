/* eslint-disable no-param-reassign */
import showForward from '../../dialog/conversation/forward';
import getLocaleMixins from '../../utils/getLocaleMixins';
import file from '../../file';
import config from '../../config';
import system from '../../system/desktop';
import getCombineMessageTitle from '../../utils/getCombineMessageTitle';
import { messageIfSupportView } from '../../utils/netEnvironment';

const userDataPath = system.userDataPath;
const mergedMsgDir = `${userDataPath}/mergedMsgFiles`;
file.mkDir(mergedMsgDir);

export default {
    name: 'multiselect-panel',
    mixins: [getLocaleMixins('multiselect-panel')],
    data() {
        return {
            lang: '',
            previousUserName: '',
            collectFlag: false,
        };
    },
    props: {
        selectedMessages: {
            type: Array,
            required: true,
        },
        conversation: {
            type: Object,
            required: true,
        },
    },
    mounted() {
        this.lang = this.locale.name;
    },
    computed: {
        isMergeAvailable() {
            return this.selectedMessages.length >= 1;
        },
    },
    methods: {
        quote() {
            const list = document.getElementsByClassName('rong-conversation-select');
            for (let i = 0; i < list.length; i += 1) {
                list[i].classList.remove('rong-collect-selected');
            }
            const coversationTips = document.getElementsByClassName('rong-conversation-tip');
            for (let i = 0; i < coversationTips.length; i += 1) {
                coversationTips[i].classList.remove('rong-collect-selected');
            }
            this.$emit('setMultiSelect', false);
        },
        onebyoneForward() {
            const messageList = sortMessageByTime(this.selectedMessages);
            const messageCount = messageList.length;
            if (messageCount < 1) {
                return;
            }
            for (let i = 0; i < messageCount; i += 1) {
                if (this.selectedMessages[i].uploadStatus && this.selectedMessages[i].uploadStatus !== 2) {
                    this.RongIM.common.messageToast({
                        type: 'error',
                        message: this.locale.tips.forwardForbiddenByFileUploading,
                    });
                    return;
                }
            }
            showForward(messageList);
        },
        mergeForward() {
            const messageList = sortMessageByTime(this.selectedMessages);
            const messageCount = messageList.length;
            if (messageCount < 1) {
                return;
            }
            const supportMessageTypeList = [
                'TextMessage',
                'ImageMessage',
                RongIMLib.RongIMClient.MessageType.GIFMessage,
                'FileMessage',
                'SightMessage',
                'CardMessage',
                'LocationMessage',
                'VoiceMessage',
                'VideoSummaryMessage',
                'RCCombineMessage',
                'RichContentMessage',
            ];
            const nameList = [];
            const summaryList = [];
            const context = this;
            const im = context.$im();
            const today = new Date();
            const date = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
            const conversationApi = im.dataModel.Conversation;
            const conversationType = conversationApi.active.conversationType;
            for (let i = 0; i < messageCount; i += 1) {
                if (messageList[i].uploadStatus && messageList[i].uploadStatus !== 2) {
                    this.RongIM.common.messageToast({
                        type: 'error',
                        message: this.locale.tips.forwardForbiddenByFileUploading,
                    });
                    return;
                }
                const support = supportMessageTypeList.indexOf(messageList[i].messageType) >= 0;
                if (!support) {
                    this.RongIM.common.messageToast({
                        type: 'error',
                        message: this.locale.tips.combineForwardForbidden,
                    });
                    return;
                }
                if (!isSupportView(messageList[i])) {
                    this.RongIM.common.messageToast({
                        type: 'error',
                        message: this.locale.tips.combineForwardForbidden,
                    });
                    return;
                }
            }
            $.getJSON('/template.json', (data) => {
                let htmlContent = data.baseHead;
                const htmlTime = data.time.replace('{%time%}', date);
                htmlContent += htmlTime;
                let sentTimeList = [];
                for (let i = 0; i < messageCount; i += 1) {
                    if (nameList.indexOf(messageList[i].alias) === -1) {
                        nameList.push(messageList[i].alias);
                    }
                    
                    if (!sentTimeList.includes(messageList[i].sentTime)) {
                        const msgSummary = getMessageSummary(context, messageList[i]);
                        summaryList.push(msgSummary);
                        const messageHtml = getHtmlContent(context, data, messageList[i]);
                        context.previousUserName = messageList[i].alias;
                        htmlContent += messageHtml;
                    }
                }
                htmlContent += data.baseBottom;
                const randomId = Math.floor(Math.random() * 100000000) + 1;
                const htmlFilePath = `${mergedMsgDir}/${randomId}.html`;
                file.writeFile(htmlFilePath, htmlContent, () => {
                    uploadFileByPath(htmlFilePath, context, im, (remoteUrl) => {
                        console.log('Uploaded the html file on the server');
                        const message = {
                            messageType: 'RCCombineMessage',
                            content: {
                                localPath: htmlFilePath,
                                remoteUrl,
                                conversationType,
                                nameList,
                                summaryList,
                            },
                        };
                        showForward(message);
                    });
                });
            });
        },
        collect() {
            const messageList = sortMessageByTime(this.selectedMessages);
            const messageCount = messageList.length;
            if (messageCount < 1) {
                return;
            }
            const supportMessageTypeList = [
                'TextMessage',
                'ImageMessage',
                RongIMLib.RongIMClient.MessageType.GIFMessage,
                'FileMessage',
                'SightMessage',
            ];
            for (let i = 0; i < messageCount; i += 1) {
                const support = supportMessageTypeList.indexOf(messageList[i].messageType) >= 0;
                if (!support || (messageList[i].uploadStatus && messageList[i].uploadStatus !== 2)) {
                    this.RongIM.common.messageToast({
                        type: 'error',
                        message: this.locale.tips.collectForbidden,
                    });
                    return;
                }
            }
            collect(this, 0);
        },
        deleteMessage() {
            const selectedMessages = this.selectedMessages;
            const selectedMessageCount = this.selectedMessages.length;
            if (selectedMessageCount < 1) {
                return;
            }
            const messageApi = this.$im().dataModel.Message;
            const conversationApi = this.$im().dataModel.Conversation;
            const key = `${conversationApi.active.conversationType}_${conversationApi.active.targetId}`;
            const messageList = this.RongIM.dataModel.Message._cache[key];
            let index = 0;
            const interval = setInterval(() => {
                const message = selectedMessages[index];
                const isUploadFileMessage = [
                    'LocalFileMessage',
                    'LocalImageMessage',
                    'FileMessage',
                    'SightMessage',
                    'ImageMessage',
                    RongIMLib.RongIMClient.MessageType.GIFMessage,
                ].indexOf(message.messageType) > -1 && $.isFunction(message.cancel);
                if (isUploadFileMessage) {
                    message.cancel();
                }

                if (message.messageId) {
                    const params = {
                        conversationType: message.conversationType,
                        targetId: message.targetId,
                        messageIds: [message.messageId],
                    };
                    messageApi.removeLocal(params, () => {
                        // 删除成功  搜索跳转的消息不是同一个数据源,需要单独删除
                        spliceMessage(messageList, message.messageId);
                        messageApi.saveRemovedEarliestMessageTime(message);
                        if (index === selectedMessageCount) {
                            clearInterval(interval);
                        }
                    });
                } else if (message.messageUId && message.objectName === 'LRC:fileMsg') {
                    spliceMessage(messageList, message.messageUId);
                    if (index === selectedMessageCount) {
                        clearInterval(interval);
                    }
                } else if (index === selectedMessageCount) {
                    clearInterval(interval);
                }
                index += 1;
            }, 100);
            this.$im().$emit('multiMsgForwardDone');
        },
    },
};

function getMessageSummary(context, message) {
    const userAlias = message.alias;
    const messageType = message.messageType;
    const combineMsgWidth = 260;
    let messageContent;
    let trimmedMsg = '';
    if (messageType === 'TextMessage') {
        messageContent = message.content.content;
        trimmedMsg = trimToPx(userAlias, messageContent, combineMsgWidth, 'TextMessage');
    } else if (messageType === 'FileMessage') {
        messageContent = context.locale.message.prefix.FileMessage + message.content.name;
        trimmedMsg = trimToPx(userAlias, messageContent, combineMsgWidth, 'FileMessage');
    } else if (messageType === 'ImageMessage') {
        trimmedMsg = context.locale.message.prefix.ImageMessage;
    } else if (messageType === 'GIFMessage') {
        trimmedMsg = context.locale.message.prefix.ImageMessage;
    } else if (messageType === 'SightMessage') {
        trimmedMsg = context.locale.message.prefix.SightMessage;
    } else if (messageType === 'CardMessage') {
        trimmedMsg = context.locale.message.prefix.CardMessage;
    } else if (messageType === 'LocationMessage') {
        trimmedMsg = context.locale.message.prefix.LocationMessage;
    } else if (messageType === 'VoiceMessage') {
        trimmedMsg = context.locale.message.prefix.VoiceMessage;
    } else if (messageType === 'VideoSummaryMessage') {
        if (message.content.mediaType === 1) {
            trimmedMsg = context.locale.message.prefix.AudioMessage;
        } else {
            trimmedMsg = context.locale.message.prefix.VideoMessage;
        }
    } else if (messageType === 'RCCombineMessage') {
        if (!message.content.summaryList || !message.content.nameList) {
            return;
        }
        const nameList = message.content.nameList;
        const conversationType = message.content.conversationType;
        messageContent = getCombineMessageTitle(context, nameList, conversationType);
        trimmedMsg = trimToPx(userAlias, messageContent, combineMsgWidth, 'RCCombineMessage');
    } else {
        trimmedMsg = '';
    }
    return `${userAlias} : ${trimmedMsg}`;
}

function collect(context, index) {
    const messageList = context.selectedMessages;
    if (messageList.length === index) {
        return;
    }
    const messageLength = messageList.length;
    const message = messageList[index];
    let type = message.objectName || message.messageType;
    let searchContent = '';
    if (message.objectName === 'RC:TxtMsg') {
        searchContent = message.content.content;
    } else if (
        message.objectName === 'RC:FileMsg'
        || message.objectName === 'LRC:fileMsg'
    ) {
        searchContent = message.content.name;
    } else if (message.objectName === 'RC:LBSMsg') {
        searchContent = message.content.poi;
    } else if (message.objectName === 'RC:ImgTextMsg') {
        searchContent = message.content.title;
    }
    searchContent += message.user && message.user.name;
    if (type === 'ImageMessage') {
        type = 'RC:ImgMsg';
    }
    if (type === 'LRC:fileMsg') {
        type = 'RC:FileMsg';
    }
    if (message.objectName === 'RC:PSMultiImgTxtMsg') {
        message.content.articles.forEach((article) => {
            const msgContent = {
                messageName: 'RichContentMessage',
                content: article.digest,
                title: article.title,
                imageUri: article.picurl,
                extra: article.extra,
                url: article.url,
            };
            searchContent += msgContent.title;
            type = 'RC:ImgTextMsg';
            addCollect(context, index, messageLength, searchContent, message, type, msgContent);
        });
    } else {
        addCollect(context, index, messageLength, searchContent, message, type);
    }
}

function addCollect(context, index, messageLength, searchContent, message, type, imageTextContent) {
    let sourceType;
    if (+message.conversationType === 1) {
        sourceType = 0;
    } else if (+message.conversationType === 3) {
        sourceType = 1;
        searchContent += context.conversation.group.name;
    } else if (+message.conversationType === 7) {
        sourceType = 3;
    }
    const dataModel = context.$im().dataModel;
    const common = context.RongIM.common;
    const tipObj = {
        message: context.locale.tips.collected,
        callback() { },
        el: context.$el,
    };
    const senderId = message.senderUserId;
    const content = imageTextContent || message.content;
    const targetId = +message.conversationType === 3
        ? message.targetId
        : message.senderUserId;
    const contentId = message.messageUId;

    let params = {
        scope: 'message',
        type,
        search_content: searchContent,
        fav_content: {
            sender_id: senderId,
            source_type: sourceType,
            target_id: targetId,
            content_id: contentId,
            url: content.imageUri || content.remoteUrl,
            content: JSON.stringify(content),
        },
    };

    dataModel.Collect.add(params, (errorCode, result) => {
        if (errorCode) {
            common.toastError('collect-failed');
            context.collectFlag = true;
            return;
        }
        if (result) {
            if (!context.collectFlag) {
                common.messageToast(tipObj);
            }
            const typeList = dataModel.Collect.typeList;
            if (typeList.length === 0) {
                params = {
                    version: -1,
                    scope: 'message',
                };
                dataModel.Collect.getList(params, (errcode, results) => {
                    if (!errcode) {
                        const arr = results.map(item => item.objectName);
                        dataModel.Collect.typeList = arr.filter(
                            (x, idx, self) => self.indexOf(x) === idx,
                        );
                    }
                });
            } else {
                const iType = type || message.type;
                if (typeList.indexOf(iType) === -1) {
                    typeList.push(iType);
                }
            }
            index += 1;
            if (index === messageLength) {
                context.$im().$emit('multiMsgForwardDone');
            } else {
                collect(context, index);
            }
        }
    });
}

/*
说明： 根据 messageId 删除缓存中对应消息
参数：
    @param {array}  cacheList 缓存消息列表
    @param {string} messageId 消息 messageId
*/
function spliceMessage(cacheList, messageId) {
    if (!cacheList) {
        return;
    }
    let index = null;
    for (let i = 0, len = cacheList.length; i < len; i += 1) {
        const cacheMsg = cacheList[i];
        if (
            cacheMsg.messageId === messageId
            || cacheMsg.messageUId === messageId
        ) {
            index = i;
        }
    }

    if (index === null) {
        return;
    }
    cacheList.splice(index, 1);
}

function sortMessageByTime(messageList) {
    return messageList.sort((messageItem1, messageItem2) => messageItem1.sentTime - messageItem2.sentTime);
}

function getTextWidth(text) {
    const combineMsgPadding = 10;
    const msgFontSize = 14;
    const element = document.createElement('span');
    document.body.appendChild(element);

    element.style.fontFamily = 'tickFont, numberFont, colorEmojiFont, PingFangSC-Regular, Microsoft YaHei, sans-serif';
    element.style.fontSize = `${msgFontSize}px`;
    element.style.height = 'auto';
    element.style.width = 'auto';
    element.style.position = 'absolute';
    element.style.visibility = 'hidden';
    element.style.whiteSpace = 'no-wrap';
    element.innerHTML = text;

    const width = Math.ceil(element.clientWidth + combineMsgPadding);
    document.body.removeChild(element);

    return width;
}

function trimToPx(userAlias, message, combineMsgWidth, messageType) {
    let basename;
    let extname = '';
    let msgContent = `${userAlias} : ${message}`;
    let trimmed = msgContent;
    const visualWidth = getTextWidth(msgContent);
    if (visualWidth > combineMsgWidth) {
        if (messageType === 'TextMessage' || messageType === 'RCCombineMessage') {
            trimmed += '...';
        } else if (messageType === 'FileMessage') {
            const index = msgContent.lastIndexOf('.');
            if (index > -1) {
                // 扩展名前多显示2个字
                const prefix = 2;
                const chPatrn = /[\u4E00-\u9FA5]|[\uFE30-\uFFA0]|[\u0391-\uFFE5]/gi;
                extname = msgContent.slice(Math.max(0, index - prefix));
                extname = chPatrn.exec(extname) ? extname.substring(1) : extname;
            }
            let end = 0 - extname.length;
            if (end === 0) {
                end = extname.length;
            }
            basename = msgContent.slice(0, end);
            trimmed = `${basename}...${extname}`;
        }
        while (getTextWidth(trimmed) > combineMsgWidth) {
            if (messageType === 'TextMessage' || messageType === 'RCCombineMessage') {
                msgContent = [...msgContent].slice(0, [...msgContent].length - 1).join('');
                trimmed = `${msgContent}...`;
            } else if (messageType === 'FileMessage') {
                basename = basename.substring(0, basename.length - 1);
                trimmed = `${basename}...${extname}`;
            }
        }
    }
    trimmed = trimmed.replace(`${userAlias} : `, '');
    return trimmed;
}

function size(message) {
    const filesize = Number(message.content.size) || 0;
    return filesize;
}

function dateFormat(timestamp, format) {
    return moment(timestamp).format(format);
}

function getHtmlContent(context, template, message) {
    const userName = message.alias;
    const sentTime = dateFormat(message.sentTime, 'DD/MM/YYYY HH:mm:ss');
    const fileSize = size(message);
    const messageType = message.messageType;
    let htmlContent = '';
    const portraitUri = '';
    let userClass = '';
    if (context.previousUserName === userName) {
        userClass = 'rong-none-user';
    }
    let avataUrl = message.user.avatar;
    if (message.user.avatar === '') {
        avataUrl = message.user.baseAvatar;
    }
    if (messageType === 'TextMessage') {
        const msgText = message.content.content;
        htmlContent = template['RC:TxtMsg'];
        htmlContent = htmlContent.replace('{%showUser%}', userClass);
        htmlContent = htmlContent.replace('{%portrait%}', avataUrl);
        htmlContent = htmlContent.replace('{%userName%}', userName);
        htmlContent = htmlContent.replace('{%sendTime%}', sentTime);
        htmlContent = htmlContent.replace('{%text%}', msgText);
    } else if (messageType === 'ImageMessage') {
        const imgUrl = `data:image/jpg;base64,${message.content.content}`;
        const imgfileUrl = message.content.imageUri;
        htmlContent = template['RC:ImgMsg'];
        htmlContent = htmlContent.replace('{%showUser%}', userClass);
        htmlContent = htmlContent.replace('{%portrait%}', avataUrl);
        htmlContent = htmlContent.replace('{%userName%}', userName);
        htmlContent = htmlContent.replace('{%sendTime%}', sentTime);
        htmlContent = htmlContent.replaceAll('{%imgUrl%}', imgUrl);
        htmlContent = htmlContent.replace('{%fileUrl%}', imgfileUrl);
    } else if (messageType === 'FileMessage') {
        const fileName = message.content.name;
        const fileType = message.content.type;
        const fileUrl = message.content.fileUrl;
        const fileIcon = message.content.fileIcon;
        htmlContent = template['RC:FileMsg'];
        htmlContent = htmlContent.replace('{%showUser%}', userClass);
        htmlContent = htmlContent.replace('{%portrait%}', avataUrl);
        htmlContent = htmlContent.replace('{%userName%}', userName);
        htmlContent = htmlContent.replace('{%sendTime%}', sentTime);
        htmlContent = htmlContent.replaceAll('{%fileName%}', fileName);
        htmlContent = htmlContent.replaceAll('{%fileIcon%}', fileIcon);
        htmlContent = htmlContent.replace('{%fileUrl%}', fileUrl);
        htmlContent = htmlContent.replace('{%fileType%}', fileType);
        htmlContent = htmlContent.replace('"{%fileSize%}"', fileSize);
        htmlContent = htmlContent.replace('{%size%}', fileSize);
    } else if (messageType === 'SightMessage') {
        const sightUrl = message.content.sightUrl;
        const duration = message.content.duration;
        const imageBase64 = `data:image/jpg;base64,${message.content.content}`;
        const sightFileName = message.content.name;
        htmlContent = template['RC:SightMsg'];
        htmlContent = htmlContent.replace('{%showUser%}', userClass);
        htmlContent = htmlContent.replace('{%portrait%}', avataUrl);
        htmlContent = htmlContent.replace('{%userName%}', userName);
        htmlContent = htmlContent.replace('{%sendTime%}', sentTime);
        htmlContent = htmlContent.replace('{%fileUrl%}', sightUrl);
        htmlContent = htmlContent.replace('{%duration%}', duration);
        htmlContent = htmlContent.replace('{%imageBase64%}', imageBase64);
        htmlContent = htmlContent.replace('{%fileName%}', sightFileName);
        htmlContent = htmlContent.replace('{%size%}', fileSize);
    } else if (messageType === 'GIFMessage') {
        const fileUrl = message.content.remoteUrl;
        htmlContent = template['RC:GIFMsg'];
        htmlContent = htmlContent.replace('{%showUser%}', userClass);
        htmlContent = htmlContent.replace('{%portrait%}', avataUrl);
        htmlContent = htmlContent.replace('{%userName%}', userName);
        htmlContent = htmlContent.replace('{%sendTime%}', sentTime);
        htmlContent = htmlContent.replace('{%fileUrl%}', fileUrl);
    } else if (messageType === 'VoiceMessage') {
        const voiceTxt = context.locale.message.prefix.VoiceMessage;
        htmlContent = template['RC:VcMsg'];
        htmlContent = htmlContent.replace('{%showUser%}', userClass);
        htmlContent = htmlContent.replace('{%portrait%}', avataUrl);
        htmlContent = htmlContent.replace('{%userName%}', userName);
        htmlContent = htmlContent.replace('{%sendTime%}', sentTime);
        htmlContent = htmlContent.replace('{%text%}', voiceTxt);
    } else if (messageType === 'VideoSummaryMessage') {
        let summaryText = '';
        if (message.content.mediaType === 1) {
            summaryText = context.locale.message.prefix.AudioMessage;
        } else {
            summaryText = context.locale.message.prefix.VideoMessage;
        }
        htmlContent = template['RC:VCSummary'];
        htmlContent = htmlContent.replace('{%showUser%}', userClass);
        htmlContent = htmlContent.replace('{%portrait%}', avataUrl);
        htmlContent = htmlContent.replace('{%userName%}', userName);
        htmlContent = htmlContent.replace('{%sendTime%}', sentTime);
        htmlContent = htmlContent.replace('{%text%}', summaryText);
    } else if (messageType === 'CardMessage') {
        const cardTest = message.content.name;
        htmlContent = template['RC:CardMsg'];
        htmlContent = htmlContent.replace('{%showUser%}', userClass);
        htmlContent = htmlContent.replace('{%portrait%}', avataUrl);
        htmlContent = htmlContent.replace('{%userName%}', userName);
        htmlContent = htmlContent.replace('{%sendTime%}', sentTime);
        htmlContent = htmlContent.replace('{%text%}', cardTest);
    } else if (messageType === 'LocationMessage') {
        const locationName = message.content.poi;
        const latitude = message.content.latitude;
        const longitude = message.content.longitude;
        htmlContent = template['RC:LBSMsg'];
        htmlContent = htmlContent.replace('{%showUser%}', userClass);
        htmlContent = htmlContent.replace('{%portrait%}', avataUrl);
        htmlContent = htmlContent.replace('{%userName%}', userName);
        htmlContent = htmlContent.replace('{%sendTime%}', sentTime);
        htmlContent = htmlContent.replaceAll('{%locationName%}', locationName);
        htmlContent = htmlContent.replace('{%latitude%}', latitude);
        htmlContent = htmlContent.replace('{%longitude%}', longitude);
    } else if (messageType === 'RCCombineMessage') {
        if (!message.content.summaryList || !message.content.nameList) {
            return;
        }
        const conversationType = message.content.conversationType;
        const nameList = message.content.nameList;
        const fileUrl = message.content.remoteUrl;
        const title = getCombineMessageTitle(context, nameList, conversationType);
        const summaryList = message.content.summaryList;
        let combineBody = '';
        for (let i = 0; i < 3; i += 1) {
            if (summaryList[i]) {
                combineBody += `<p>${summaryList[i]}</p>`;
            }
        }
        htmlContent = template['RC:CombineMsg'];
        htmlContent = htmlContent.replace('{%showUser%}', userClass);
        htmlContent = htmlContent.replace('{%portrait%}', avataUrl);
        htmlContent = htmlContent.replace('{%userName%}', userName);
        htmlContent = htmlContent.replace('{%sendTime%}', sentTime);
        htmlContent = htmlContent.replaceAll('{%title%}', title);
        htmlContent = htmlContent.replace('{%combineBody%}', combineBody);
        htmlContent = htmlContent.replace('{%fileUrl%}', fileUrl);
        htmlContent = htmlContent.replace('{%foot%}', '');
    }
    return htmlContent;
}

function uploadFileByPath(path, context, im, callback) {
    callback = callback || $.noop;
    file.getBlob(path).then((tmpFile) => {
        if (tmpFile.size > 0) {
            uploadFile(tmpFile, context, im, callback);
        } else {
            context.RongIM.common.messageToast({
                type: 'error',
                message: context.locale.zeroSize,
            });
        }
    }, (err) => {
        console.warn('get local file err', err);
    });
}

function uploadFile(htmlfile, context, im, callback) {
    callback = callback || $.noop;
    const dataModel = im.dataModel;
    const fileApi = dataModel.File;
    const messageApi = dataModel.Message;
    const params = getConversationInfo(im.$route.params);

    const tmpFile = htmlfile;
    params.data = tmpFile;

    // localPath 为了兼容复制的本地文件,File 的 path 属性只读
    params.localPath = tmpFile.path || tmpFile.localPath;
    params.isFolder = !!tmpFile.folder;
    fileApi.createUploadMessage(params, (uploadMessage) => {
        const api = {
            file: fileApi,
            message: messageApi,
        };
        upload(uploadMessage, config.upload.file, context, api, callback);
    });
}

function getConversationInfo(conversation) {
    return {
        targetId: conversation.targetId,
        conversationType: parseInt(conversation.conversationType),
    };
}

function upload(uploadMessage, conf, context, api, callback) {
    callback = callback || $.noop;
    const common = context.RongIM.common;
    if (context.$im().status !== RongIMLib.ConnectionStatus.CONNECTED) {
        common.toastError('network-error');
        return;
    }
    api.file.MergedMsgHtmlUpload(uploadMessage, conf, (errorCode, _uploadMessage, data) => {
        if (errorCode) {
            common.messageToast({
                type: 'error',
                message: context.locale.components.addAttachment.uploadFaild,
            });
            return;
        }
        const remoteUrl = `${config.upload.file.domain}${data.rc_url.path}`;
        callback(remoteUrl);
    });
}

function isSupportView(message) {
    let supportViewUrl;
    const messageType = message.messageType;
    if (messageType === 'ImageMessage') {
        supportViewUrl = message.content.imageUri || message.content.remoteUrl;
    } else if (messageType === 'FileMessage') {
        supportViewUrl = message.content.fileUrl;
    } else if (messageType === 'SightMessage') {
        supportViewUrl = message.content.sightUrl;
    } else if (messageType === 'RCCombineMessage') {
        supportViewUrl = message.content.remoteUrl;
    } else {
        return true;
    }
    const [url, noSupportView] = messageIfSupportView(supportViewUrl);
    if (noSupportView) {
        return false;
    }
    return true;
}


