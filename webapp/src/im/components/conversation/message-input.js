/* eslint-disable no-param-reassign */
import Base64Util from '../../utils/Base64Media';
import getLocaleMixins from '../../utils/getLocaleMixins';
import isEmpty from '../../utils/isEmpty';
import getBase64Size from '../../utils/getBase64Size';
import templateFormat from '../../utils/templateFormat';
import formatFileSize from '../../utils/formatFileSize';
import { emojiNativeReg } from '../../utils/emojiReg';
import isEmojiOverlap from '../../utils/isEmojiOverlap';
import CallType from '../../common/CallType';
import getResizeDirection from '../../common/getResizeDirection';
import createNotificationMessage from '../../common/createNotificationMessage';
import cache from '../../utils/cache';
import config from '../../config';
import screenshot from '../../screenshot';
import file from '../../file';
import getEditBox from './edit-box.vue';
import getEmojiPanel from './emoji-panel.vue';
import getMultiSelectPanel from './multiselect-panel.vue';
import showPreviewImage from '../../dialog/conversation/preview-image';
import showCard from '../../dialog/conversation/card';
import showCollect from '../../dialog/collect/collect-dialog';
import {
    getServerConfig,
    getServerConfigByChainedKey,
} from '../../cache/helper';

const platform = require('platform');

const { os } = platform;

const saveKey = 'screenshotOption';
/*
说明： 消息输入
功能： 发送文字，发送表情，发送文件，发送名片，群@成员
       桌面端还包括 截图，发起音视频
*/

export default {
    name: 'message-input',
    mixins: [getLocaleMixins('message-input')],
    props: {
        autoFocus: {
            type: Boolean,
            required: false,
            default: true,
        },
        targetId: {
            type: String,
            required: true,
        },
        atMembers: {
            type: Array,
            required: true,
        },
        inGroup: false,
        isRobot: false,
        disabled: false,
        // 被禁言
        isBanned: false,
        isInvalidGroup: false,
        isMultiSelected: false,
        selectedMessages: {
            type: Array,
            required: true,
        },
        conversation: {
            type: Object,
            required: true,
        },
    },
    data() {
        return {
            sendBtnAvailable: false,
            at: {},
            atFilterMembers: [],
            atPanelStyle: {},
            atSelectedMembers: [],
            showEmojiPanel: false,
            support: config.support,
            bound: {
                height: {
                    min: 0,
                    max: 0,
                },
            },
            isResizing: false,
            isShowWindow: !!cache.get(saveKey),
            isShowScreenOption: false,
            isShowCollect: config.modules.collect,
            fileMessageList: [],
            fileSending: false,
        };
    },
    computed: {
        // 是否支持截图（只有桌面版支持）
        screenshotSupported() {
            return config.support.screenshot && getOsInfo();
        },
        // 当前连接状态
        status() {
            return this.$im().status;
        },
        height() {
            const node = this.$im().resizeNode.messageInput;
            return node.height;
        },
        resizeDirection() {
            return this.$im().resizeDirection.use;
        },
        // 根据 server 配置决定显示不显示音视频按钮
        voipConf() {
            return getServerConfig().voip;
        },
        // 判断是否显示公众号服务切换菜单按钮
        isPublicConversation() {
            return this.$parent.conversationType === 7;
        },
        isShowMenuSwitch() {
            const parent = this.$parent;
            if (parent.menuInfo.menu_content && parent.conversationType === 7) {
                return this.$parent.menuInfo.menu_content.length > 0;
            }
            return false;
        },
        showVideo() {
            const available = this.support.voip && this.voipConf.video_enable;
            return available && !this.isPublicConversation && !this.isRobot;
        },
        showAudio() {
            const available = this.support.voip && this.voipConf.audio_enable;
            return available && !this.isPublicConversation && !this.isRobot;
        },
        voipTip() {
            const voipTip = {};
            voipTip[CallType.MEDIA_VEDIO] = this.locale.voip.videoTip;
            voipTip[CallType.MEDIA_AUDIO] = this.locale.voip.audioTip;
            return voipTip;
        },
    },
    mounted() {
        const context = this;
        const im = this.$im();
        inputBoxResize(context, im);
        im.$on('imclick', () => {
            context.hideScreenOption();
        });
        context.editrecalled = function editrecalled(value) {
            const at = [];
            if (
                value.atIdList
                && value.atIdList.length > 0
                && context.atMembers
            ) {
                const tmpMap = {};
                context.atMembers.forEach((item) => {
                    tmpMap[item.id] = item.name;
                });
                value.atIdList.forEach((id) => {
                    let name = tmpMap[id];
                    if (id === 0) {
                        name = context.locale.components.atPanel.everyone;
                    }
                    if (name) {
                        at.push({
                            id,
                            name,
                        });
                    }
                });
            }
            context.$refs.editor.appendValue({
                text: value.text,
                at,
            });
            messageInputChanged(context, value.text);
        };
        im.$on('editrecalled', context.editrecalled);
        screenshot.setHideWindow(!!cache.get(saveKey));
    },

    watch: {
        $route() {
            this.$emit('setMultiSelect', false);
            // 切换对话时实时获取输入框的内容，对发送按钮做限制
            setTimeout(() => {
                const message = this.$refs.editor.value;
                messageInputChanged(this, message);
            }, 0);
        },
        isShowWindow: function isShowWindowChanged() {
            cache.set(saveKey, this.isShowWindow);
            screenshot.setHideWindow(!!cache.get(saveKey));
        },
    },

    destroyed() {
        this.$im().$off('editrecalled', this.editrecalled);
    },
    components: {
        'edit-box': getEditBox,
        'emoji-panel': getEmojiPanel,
        'multiselect-panel': getMultiSelectPanel,
    },
    methods: {
        reset() {
            if (this.$refs.editor) {
                this.$refs.editor.reset();
            }
        },
        // 使输入框获得焦点
        focus() {
            if (this.$refs.editor) {
                this.$refs.editor.focus();
            }
        },
        // 获取输入框的内容
        getValue() {
            return this.$refs.editor.getValue();
        },
        // 触发发送消息
        sendMessage(message) {
            // 44304 【消息】将正在发送中的消息删除还能发出
            if (!this.checkSendEnable(message)) {
                return;
            }
            sendMessage(this, this.$im(), message);
        },
        checkSendEnable(message) {
            const context = this;
            if (isEmpty(message.text.trim())) {
                return false;
            }
            const connected = context.status === RongIMLib.ConnectionStatus.CONNECTED;
            if (!connected) {
                return false;
            }
            return true;
        },
        sendMessageByButton() {
            const context = this;
            const message = context.$refs.editor.getValue();
            if (!context.checkSendEnable(message)) {
                return;
            }
            context.$refs.editor.clear();
            this.sendMessage(message);
        },
        // 发送收藏消息
        sendCollectMessage(message) {
            sendCollectMessage(this, this.$im(), message);
        },
        messageInputChanged(value) {
            messageInputChanged(this, value);
        },
        toggleEmoji() {
            toggleEmoji(this);
            this.$emit('prepareinput');
        },
        prepareinput() {
            this.$emit('prepareinput');
        },
        selectedEmoji(emoji) {
            this.$refs.editor.insertText(emoji);
            messageInputChanged(this, emoji);
        },
        hideEmojiPanel() {
            this.showEmojiPanel = false;
        },
        takeScreenshot() {
            this.$emit('removeQuote');
            this.$emit('prepareinput');
            if (this.isShowWindow) {
                screenshot.start(true);
                return;
            }
            screenshot.start();
        },
        selectFile() {
            this.$emit('removeQuote');
            this.$emit('prepareinput');
        },
        fileChanged(event) {
            const context = this;
            Vue.nextTick(() => {
                const fileList = event.target.files;
                const uploadFiles = [];
                for (let i = fileList.length - 1; i >= 0; i -= 1) {
                    const item = fileList[i];
                    // 选中非 0 字节文件
                    if (item.size > 0) {
                        uploadFiles.unshift(item);
                    }
                }
                // 上传所选中文件
                if (uploadFiles.length) {
                    uploadFileList(uploadFiles, context, this.$im());
                }
                // 提示所选中的文件中有 0 字节文件
                if (uploadFiles.length < fileList.length) {
                    this.RongIM.common.messageToast({
                        type: 'error',
                        message: context.locale.zeroSize,
                    });
                }
                // 重置 input file 的 value 使可以连续多次上传同一文件
                resetInputFileValue(event.target, context.fileChanged, context);
            });
        },
        dragover(event) {
            event.preventDefault();
            event.stopPropagation();
        },
        // 拖拽上传文件
        drop(event) {
            event.preventDefault();
            event.stopPropagation();
            const context = this;
            const im = this.$im();
            const common = this.RongIM.common;
            const items = event.dataTransfer.items;
            let fileList = [];

            /** 502【丹东】【PC端】会话详情支持拓拽消息至其它会话，实现消息转发 */
            this.$im().$emit('clear-all-selection');

            if (items) {
                // chrome firefox 过滤文件夹
                $.each(items, (index, item) => {
                    const entry = item.webkitGetAsEntry();
                    if (!entry) {
                        // 拖动 a 标签等内容时 entry 值会为空
                        return;
                    }
                    if (entry.isFile) {
                        fileList.push(item.getAsFile());
                    } else if (entry.isDirectory) {
                        // web和 desktop 分开处理
                        // item.getAsFile().path
                        /* name: "css"
            path: "/Users/zy/Downloads/desktop-client.git/css"
            size: 578 */
                        const dirPath = item.getAsFile().path;
                        // 38866 - 【文件】文件夹不能进行发送成功
                        const fileMaxSize = getServerConfigByChainedKey('media.max_file_size') * 1024 * 1024;
                        const fileSizeFormat = fileMaxSize ? formatFileSize(fileMaxSize) : '';
                        file.zipFolders([dirPath], fileMaxSize, (zipFileList, error) => {
                            // var _fileList =[fileList[0].zipFile];
                            if (error) {
                                let msg = templateFormat(context.locale[error.message], fileSizeFormat);
                                if (error.folderName) {
                                    msg = `${msg}: ${error.folderName}`;
                                }
                                common.messageToast({
                                    type: 'error',
                                    message: msg,
                                });
                                return;
                            }
                            uploadFolderByPath(zipFileList, context, im);
                        });
                    }
                });
            } else {
                // IE 不包含文件夹
                fileList = event.dataTransfer.files;
            }
            const filterZero = fileList.filter(item => item.size > 0);
            if (filterZero.length < fileList.length) {
                common.messageToast({
                    type: 'error',
                    message: this.locale.zeroSize,
                });
            }
            if (filterZero.length === 0) {
                return;
            }
            uploadFileList(filterZero, this, im);
        },
        paste(event) {
            paste(this, event, this.$im());
        },
        clearUnReadCount() {
            const dataModel = this.$im().dataModel;
            const params = this.$route.params;
            const conversationType = params.conversationType;
            const targetId = params.targetId;
            dataModel.Conversation.clearUnReadCount(conversationType, targetId);
        },
        sendVideo() {
            this.$emit('removeQuote');
            this.$emit('sendVideo');
        },
        sendAudio() {
            this.$emit('removeQuote');
            this.$emit('sendAudio');
        },
        sendCard() {
            this.$emit('removeQuote');
            let userId = '';
            if (+this.$route.params.conversationType === 1) {
                userId = this.$route.params.targetId;
            }
            showCard(userId);
        },
        getResizeDirection() {
            const direction = getResizeDirection({
                range: this.height,
                bound: this.bound.height,
                directions: ['bottom', 'top'],
            });
            if (this.isResizing) {
                this.$im().resizeDirection.temp = direction;
            }
            return direction;
        },
        getTextareaHeight() {
            return this.height - 50;
        },
        // 公众号点击 切换输入框和菜单
        inputMenuChanged() {
            this.$emit('inputMenuChanged', true);
        },
        toggleScreenOption() {
            this.isShowScreenOption = !this.isShowScreenOption;
        },
        hideScreenOption() {
            this.isShowScreenOption = false;
        },
        // 显示收藏列表
        showCollect() {
            showCollect(this);
        },
        setMultiSelect(multiSelect) {
            this.$emit('setMultiSelect', multiSelect);
        },
    },
};


function toNum(a) {
    var a = a.toString();
    const c = a.split('.');
    let num_place = ['', '0', '00', '000', '0000'],
        r = num_place.reverse();
    for (let i = 0; i < c.length; i++) {
        const len = c[i].length;
        c[i] = r[len] + c[i];
    }
    const res = c.join('');
    return res;
}

function cpr_version(a, b) {
    const _a = toNum(a);
    const _b = toNum(b);
    if (_a == _b) return true;
    if (_a < _b) return true;
    if (_a > _b) return false;
}

// 获取当前操作系统信息
function getOsInfo() {
    console.log('platform-platform', platform);
    const { family, version } = os;
    if (family === 'OS X' && cpr_version(version, '10.11')) {
        return false;
    }
    return true;
}

/*
说明： 文本框拖拽改变大小
*/
function inputBoxResize(context, im) {
    const el = im.$el;
    const editorNode = $(context.$el);
    const getBound = function getBound(name) {
        return editorNode.css(name);
    };
    /* messageList组件滚动到底部 */
    const scrollToBottom = function scrollToBottom() {
        /* messageList组件 */
        const messageList = context.$parent.$refs.list;
        messageList.scrollWhenInputResize();
    };
    context.bound = {
        height: {
            min: getBound('min-height'),
            max: getBound('max-height'),
        },
    };
    const resizeDirection = im.resizeDirection;
    context.RongIM.common.resizeNode({
        el,
        node: editorNode,
        direction: 'top',
        onresize(result) {
            scrollToBottom();
            context.isResizing = true;
            const range = result.range;
            const resizeNode = im.resizeNode.messageInput;
            resizeNode.height = range;
            resizeDirection.use = resizeDirection.temp;
        },
        onended() {
            context.isResizing = false;
            resizeDirection.use = 'normal';
        },
    });
}

// 表情面板隐藏展示切换
function toggleEmoji(context) {
    const hideEmoji = function hideEmoji() {
        context.showEmojiPanel = false;
        $(document).off('click', hideEmoji);
    };
    context.showEmojiPanel = !context.showEmojiPanel;
    if (context.showEmojiPanel) {
        $(document).on('click', hideEmoji);
    }
}

/*
说明： 根据文件路径获取文件并上传
35734 -【文件】复制 0KB 的文件到会话窗口，文件发送不成功也无提示
*/
function uploadFileByPath(filePaths, context, im) {
    let zeroSizeFileCount = 0;
    filePaths.forEach((path) => {
        file.getBlob(path).then((tmpFile) => {
            if (tmpFile.size > 0) {
                uploadFileList([tmpFile], context, im);
            } else {
                zeroSizeFileCount += 1;
                /* 只提示一次。 */
                if (zeroSizeFileCount === 1) {
                    context.RongIM.common.messageToast({
                        type: 'error',
                        message: context.locale.zeroSize,
                    });
                }
            }
        }, (err) => {
            console.warn('get local file err', err);
        });
    });
}

/*
说明： 上传文件夹
*/
function uploadFolderByPath(fileObjs, context, im) {
    const fileList = [];
    fileObjs.forEach((item) => {
        const fileObj = file.getBlobs([item.zipFile])[0];
        fileObj.folder = item.folder;
        fileList.push(fileObj);
    });
    // const fileList = file.getBlobs(filePaths);

    uploadFileList(fileList, context, im);
}

function getPasteData(clipboardData) {
    const data = {};
    const items = clipboardData.items;
    if (isEmpty(items)) {
        const string = clipboardData.getData('text');
        data.str = {
            getAsString(callback) {
                callback(string);
            },
        };
    } else {
        for (let i = items.length - 1; i >= 0; i -= 1) {
            const item = items[i];
            if (item.kind === 'file') {
                const tmpFile = item.getAsFile();
                if (tmpFile.size > 0) {
                    data.file = tmpFile;
                }
            }
            if (item.kind === 'string' && item.type === 'text/plain') {
                data.str = item;
            }
        }
    }
    return data;
}

function decodeMessageJSON(str) {
    try {
        const obj = JSON.parse(str);
        return obj;
    } catch (error) {
        return null;
    }
}

function decodeMessage(msgStr, dataModel) {
    const messageApi = dataModel.Message;
    let message = decodeMessageJSON(msgStr);
    if (isEmpty(message) || isEmpty(message.messageName)) {
        return undefined;
    }
    const msg = {
        messageType: message.messageName,
        content: message,
    };
    message = messageApi.create(msg);
    // 文件消息有本地存储地址
    if (message.localPath) {
        message.localPath = message.localPath;
    }
    return message;
}

/*
说明： 重置 input file 使可以重复上传同一个文件。
*/
function resetInputFileValue(inputFile, changed, context) {
    const $inputFile = $(inputFile);
    const $newInputFile = $inputFile.clone();
    $newInputFile.val('');
    $inputFile.replaceWith($newInputFile);
    $newInputFile.change(function onchange(event) {
        changed.call(context || this, event);
    });
}

function getBase64(blob, callback) {
    const fr = new FileReader();
    fr.onload = function onload(event) {
        let base64Str = event.target.result;
        base64Str = Base64Util.replace(base64Str);

        callback(base64Str);
    };
    fr.readAsDataURL(blob);
}

function getConversationInfo(conversation) {
    return {
        targetId: conversation.targetId,
        conversationType: parseInt(conversation.conversationType),
    };
}

/*
说明： 上传图片 base64 字符串
*/
function uploadBase64(base64Str, context, im, base64Type, isEmojiImage, imageInfo) {
    const dataModel = im.dataModel;
    const common = context.RongIM.common;
    const fileApi = dataModel.File;
    const messageApi = dataModel.Message;
    const params = getConversationInfo(context.$route.params);
    params.data = base64Str;
    if (base64Type === 'gif') {
        params.giftImageInfo = imageInfo;
    }
    fileApi.createUploadMessage(params, (uploadMessage) => {
        const base64Config = $.extend({}, config.upload.base64);
        const size = getBase64Size(base64Str);
        const base64Size = base64Config.size;
        if (size > base64Size) {
            const message = templateFormat(
                context.locale.screenshotMaxSize,
                `${parseInt(base64Size / 1024)}KB`,
            );
            common.messageToast({
                type: 'error',
                message,
            });
            return;
        }
        base64Config.ext = base64Type;
        base64Config.data = UploadClient.dataType.data;
        const api = {
            file: fileApi,
            message: messageApi,
        };
        // 消息体最大 128K 限制 base64 字串在 100K
        const maxLength = 100 * 1024;
        if (isEmojiImage && uploadMessage.data.length < maxLength) {
            base64Config.isEmoji = true;
            uploadMessage.content.content = uploadMessage.data;
        }
        upload(uploadMessage, base64Config, context, api);
    });
}

/*
说明： 上传多个文件
*/
function uploadFileList(fileList, context, im) {
    const dataModel = im.dataModel;
    const fileApi = dataModel.File;
    const messageApi = dataModel.Message;
    const params = getConversationInfo(im.$route.params);
    const fileSize = getServerConfigByChainedKey('media.max_file_size') * 1024 * 1024;
    const fileMaxSize = fileSize ? formatFileSize(fileSize) : '';
    const message = fileMaxSize
        ? templateFormat(context.locale.overSize, fileMaxSize)
        : '';

    for (let i = fileList.length - 1; i >= 0; i -= 1) {
        if (fileSize && fileList[i].size > fileSize) {
            context.RongIM.common.messageToast({
                type: 'error',
                message,
            });
        } else {
            const tmpFile = fileList[i];
            params.data = tmpFile;

            // localPath 为了兼容复制的本地文件,File 的 path 属性只读
            params.localPath = tmpFile.path || tmpFile.localPath;
            params.isFolder = !!tmpFile.folder;
            fileApi.createUploadMessage(params, (uploadMessage) => {
                const api = {
                    file: fileApi,
                    message: messageApi,
                };
                upload(uploadMessage, config.upload.file, context, api);
            });
        }
    }
}

/*
说明： 文件上传
*/
function upload(uploadMessage, conf, context, api) {
    const dataModel = context.$im().dataModel;
    const common = context.RongIM.common;
    const userApi = dataModel.User;
    const friendApi = dataModel.Friend;
    const isPrivate = Number(uploadMessage.conversationType) === 1;
    // 39529 - 【消息】断开网络后发送文件，不显示红色叹号
    // when trying to upload in disconnected status, if the user already has a token for upload in cache,
    // the uploaded file will be shown on message list. it should not be shown on message list like when
    // a token doesn't exist in the cache. so this code is added.
    if (context.$im().status !== RongIMLib.ConnectionStatus.CONNECTED) {
        common.toastError('network-error');
        return;
    }
    if (isPrivate) {
        const canNotChat = !userApi.validateCanChat(uploadMessage.targetId);
        if (canNotChat) {
            friendApi.insertRFVMsg(uploadMessage.targetId);
            return;
        }
    }
    api.file.upload(uploadMessage, conf, (errorCode, _uploadMessage, data) => {
        if (errorCode) {
            common.messageToast({
                type: 'error',
                message: context.locale.components.addAttachment.uploadFaild,
            });
            return;
        }
        // if (uploadMessage.localPath && uploadMessage.isFolder) {
        //     file.delZip(uploadMessage.localPath);
        // }
        api.file.addFileUrl(_uploadMessage, data, (error, message) => {
            sendFileMessage(message, context, api);
        });
    });
}

function sendFileMessage(uploadMessage, context, api) {
    // 加入预发队列
    context.fileMessageList.push(uploadMessage);
    if (context.fileSending) {
        return;
    }
    // 42183 - 【会话聊天】向一个被解散的群聊天中发送文件失败后，再向其他正常聊天发送文件一直在发送中
    // context.fileSending = true;
    function onComplete() {
        // 有待发消息
        if (context.fileMessageList.length > 0) {
            // 间隔 500 毫秒发送，避免发送过快发送导致消息被 RCX 拒绝
            setTimeout(
                sendFileMessageHandle,
                500,
                context.fileMessageList.shift(),
                context,
                api,
                onComplete,
            );
            return;
        }
        context.fileSending = false;
    }
    // 处理一条消息
    sendFileMessageHandle(
        context.fileMessageList.shift(),
        context,
        api,
        onComplete,
    );
}

function sendFileMessageHandle(message, context, api, done) {
    const common = context.RongIM.common;
    const im = context.$im();
    api.file.send(message, (errorCode, uploadMessage) => {
        if (errorCode) {
            const errMsg = common.getErrorMessage(`lib-${errorCode}`);
            if (errorCode === RongIMLib.ErrorCode.NOT_IN_GROUP) {
                const targetId = uploadMessage.targetId;
                const conversationType = uploadMessage.conversationType;
                const params = createNotificationMessage(
                    conversationType,
                    targetId,
                    errMsg,
                );
                api.message.insertMessage(params);
                context.$emit('setInGroup', false);
            }
        } else {
            im.$emit('messagechange');
            im.$emit('sendMessage');
        }
        done();
    });
}

function sendCollectMessage(context, im, message) {
    const connected = context.status === RongIMLib.ConnectionStatus.CONNECTED;
    if (!connected) {
        return;
    }
    const Message = {};
    Message.text = message;
    context.panel = null;
    context.showEmojiPanel = false;
    context.$emit('sendMessage', Message);
    im.$emit('sendMessage');
}

/*
说明： 发送消息 使用 vue 事件 sendMessage 通知发送消息
功能： 1. 获取输入框内容
       2. 清空输入框，重置显示界面（关闭表情选择面板）
       3. 发送消息
*/
function sendMessage(context, im, message) {
    context.panel = null;
    context.showEmojiPanel = false;
    context.sendBtnAvailable = false;
    if (message.at && message.at.length > 0) {
        // 过滤已删除的 @ 人员
        message.at = message.at.filter(
            item => message.text.indexOf(`@${item.name}`) > -1,
        );
    }
    message.text = convertSendMessage(message.text);
    context.$emit('sendMessage', message);
    im.$emit('sendMessage');
}

/*
说明： Mac 非高分屏 emoji 字符展示会重叠需要在后面拼接空格，发送消息前删除 emoji 字符后的空格。
*/
function convertSendMessage(text) {
    if (isEmojiOverlap()) {
        const nativeReg = emojiNativeReg.toString();
        let tagReg = nativeReg.substring(1, nativeReg.length - 3);
        // 出现emoji重叠时, 匹配后面有一个空格的emoji, 替换
        tagReg += '([ ])';
        tagReg = new RegExp(tagReg, 'ig');
        text = text.replace(tagReg, emoji => emoji.split(' ')[0]);
    }
    return text;
}

function messageInputChanged(context, value) {
    const connected = context.status === RongIMLib.ConnectionStatus.CONNECTED;
    context.sendBtnAvailable = !isEmpty((value || '').trim()) && connected;
}

/*
说明： 粘贴文字，图片
功能： Ctrl + V 粘贴时获取剪切板内容
       文字则插入到输入框，图片则上传发送
*/
const inputPaste = {
    pasteString(event, data, context) {
        data.str.getAsString((str) => {
            const msg = decodeMessage(str, context.$im().dataModel);
            if (msg) {
                context.$emit('sendCopyMessage', msg);
            } else {
                context.$refs.editor.insertText(str);
                messageInputChanged(context, str);
            }
        });
        event.preventDefault();
    },
    pasteImage(event, data, context, im) {
        // const hasString = !isEmpty(data.str);
        // let dataString = '';
        // if (hasString) {
        //     data.str.getAsString((str) => {
        //         dataString = str;
        //     });
        // }
        getBase64(data.file, (base64Str) => {
            const base64 = Base64Util.concat(base64Str);
            showPreviewImage(base64, () => {
                if (!context.$refs.editor) {
                    return;
                }
                // if (isConvertStr) {
                //     context.$refs.editor.insertText(dataString);
                //     return;
                // }
                context.$refs.editor.focus();
                uploadBase64(base64Str, context, im);
            });
        });
        event.preventDefault();
    },
    empty() { },
};

function getFileExt(fileName) {
    fileName = fileName || '';
    const reg = /\.([0-9a-z]+)$/i;
    const result = reg.exec(fileName);
    if (result) {
        return result[1];
    }
    return '';
}

/*
说明： 粘贴事件处理
功能： 上传单张图片先预览，多张图片直接发送（大于 5 兆图片按文件处理）
*/
function paste(context, event, im) {
    // var clipFile = file.getPathsFromClip();
    const clipFile = file.getPaths();
    const fileList = clipFile.fileList;
    const dirList = clipFile.dirList;
    let isReturn = false;
    if (fileList && fileList.length > 0) {
        // 判断如果是粘贴的单张图片则需要预览图片然后发送，多文件则直接上传发送
        const clipboardImg = file.getImgByPath(fileList);
        const firstFilePath = fileList[0];
        const hasSogoFace = firstFilePath.indexOf('SGPicFaceTpBq') !== -1;
        const hasBaiduFace = firstFilePath.indexOf('BaiduPinyin') !== -1;
        const isEmojiImage = hasSogoFace || hasBaiduFace;
        if (clipboardImg) {
            const base64Type = getFileExt(clipboardImg.name);
            const reader = new FileReader();
            reader.addEventListener(
                'load',
                () => {
                    const base64 = reader.result;
                    const base64Str = Base64Util.replace(base64);
                    showPreviewImage(base64, (imageInfo) => {
                        if (context.$refs.editor) {
                            context.$refs.editor.focus();
                            imageInfo.gifDataSize = clipboardImg.size;
                            uploadBase64(
                                base64Str,
                                context,
                                im,
                                base64Type,
                                isEmojiImage,
                                imageInfo,
                            );
                        }
                    });
                },
                false,
            );

            reader.onerror = function onerror(err) {
                console.warn('paste image failed', err);
            };
            reader.readAsDataURL(clipboardImg);
        } else {
            uploadFileByPath(fileList, context, im);
        }
        isReturn = true;
    }
    function isValidDir(itemList) {
        return itemList && itemList.length > 0 && itemList[0] !== '/';
    }
    if (dirList && isValidDir(dirList)) {
        // 上传目录  压缩目录,上传压缩结果
        // 38866 - 【文件】文件夹不能进行发送成功
        const fileMaxSize = getServerConfigByChainedKey('media.max_file_size') * 1024 * 1024;
        const fileSizeFormat = fileMaxSize ? formatFileSize(fileMaxSize) : '';
        file.zipFolders(dirList, fileMaxSize, (itemList, error) => {
            if (error) {
                let msg = templateFormat(context.locale[error.message], fileSizeFormat);
                if (error.folderName) {
                    msg = `${msg}: ${error.folderName}`;
                }
                context.RongIM.common.messageToast({
                    type: 'error',
                    message: msg,
                });
                return;
            }
            uploadFolderByPath(itemList, context, im);
        });
        isReturn = true;
    }
    if (isReturn) {
        event.preventDefault();
        return;
    }
    handleClipboard(context, event, im);
}

/*
    chrome
    --------------- clipboardData
    属性
        dropEffect 拖拽相关属性
        effectAllowed 拖拽相关属性

    粘贴文件以下属性都为空，通过 C++ 处理粘贴文件
        files
        types
        items 与 types 一一对应
        getData('text')

    粘贴内容：
    files 属性都为空

        word:
            windows types ["text/plain", "text/html", "text/rtf"]
                    types ["text/plain", "text/html", "text/rtf"] 仅复制表格
                    types ["text/html", "Files"] 仅复制图片
            macOS   types ["text/plain", "text/html", "text/rtf", "Files"]
        pages: types ["text/plain", "text/html", "text/rtf"]
               types ["text/plain", "text/html", "text/rtf", "Files"] 仅复制表格
               types ["Files"] 仅复制图片
        excel: types ["text/plain", "text/html", "text/rtf", "Files"]
        ppt:   types ["Files"]
        pdf:   types ["text/plain", "text/html", "text/rtf"]
        text:  types ["text/plain"]
        md:    types ["text/plain"]
        截图:
               types ["Files"]
        网页图片:
            windows types: ["text/html", "Files"]
            macOS   types: ["Files"] mac
                    types: ["text/plain", "Files"] 图片包含 alt 属性 (仅 mac )

    items 内容说明
        text/plain
            纯文本不包含图片 file 表格
        text/html
            包含图片 <img src = ""file:///C:\Users\***\AppData\Local\Temp\ksohtml\wps87D8.tmp.jpg">

    --------------- Electron 内置 clipboard
        clipboard.readText
        clipboard.readHTML
        clipboard.readRTF
*/
function handleClipboard(context, event, im) {
    const clipboardData = event.clipboardData || window.clipboardData;
    const data = getPasteData(clipboardData);
    const hasImage = !isEmpty(data.file);
    const hasString = !isEmpty(data.str);
    let pasteHandler = 'empty';
    if (hasImage) {
        const hasHtml = clipboardData.getData('text/html') !== '';
        if (hasHtml && hasString) {
            // "text/html" is Table
            const table = isTable(clipboardData);
            if (table) {
                pasteHandler = 'pasteImage';
            } else {
                pasteHandler = 'pasteString';
            }
        } else {
            pasteHandler = 'pasteImage';
        }
    } else if (hasString) {
        pasteHandler = 'pasteString';
    }
    // const imgUrl = data.str.getAsString((str) => {
    //     if( /RCE_CUT_IMAGE/.test(str)){
    //         pasteHandler='linuxImage';
    //         const img = str.replace('RCE_CUT_IMAGE','');
    //         inputPaste[pasteHandler](event, img, context, im);
    //     } else{
    //         inputPaste[pasteHandler](event, data, context, im);
    //     }

    // });
    inputPaste[pasteHandler](event, data, context, im);
    // event.preventDefault();
}

function isTable(clipboardData) {
    // https://msdn.microsoft.com/zh-cn/library/windows/desktop/ms649015(v=vs.85).aspx
    let result = false;
    if (isEmpty(clipboardData.items)) {
        return result;
    }
    let html = clipboardData.getData('text/html');

    const match = html.match(/<body[^>]*>([\s\S]*)<\/body>/);
    if (match) {
        html = match[1];
    }
    html = html.replace('<!--StartFragment-->', '');
    html = html.replace('<!--EndFragment-->', '');
    html = html.trim();

    const $hmlt = $(html);
    const onlyOne = $hmlt.length === 1;
    const tableEle = Object.prototype.toString.apply($hmlt.get(0))
        === '[object HTMLTableElement]';
    if (onlyOne && tableEle) {
        result = true;
    }
    return result;
}
