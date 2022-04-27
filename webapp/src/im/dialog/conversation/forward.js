/* eslint-disable no-param-reassign */
import config from '../../config';
import avatar from '../../components/avatar.vue';
import getOrg from '../../components/group/org.vue';
import getFriend from '../../components/group/group-friend.vue';
import getGroup from '../../components/group/group.vue';
import getRecent from '../../components/group/recent.vue';
import MessageType from '../../utils/MessageType';
import console from '../../utils/console';
import getLocaleMixins from '../../utils/getLocaleMixins';
import getDownloadUrl from '../../common/getDownloadUrl';
import { getServerConfigByChainedKey } from '../../cache/helper';

let counter = 0;

/*
说明： 转发消息。
       可从最近联系人（会话列表）、组织机构、好友、我的群组中选择。
       客户端每秒最多发送 5 条需要限制发送频率最大转发条数。
*/
export default function (message) {
    const options = {
        name: 'forward',
        template: 'templates/conversation/forward.html',
        mixins: [getLocaleMixins('forward')],
        data() {
            const enabledFriend = getServerConfigByChainedKey('friend.enable');
            return {
                maxCount: 10,
                show: true,
                enabledFriend,
                groupName: '',
                tip: '',
                // 'recent' or 'star' or 'org'
                tab: 'recent',
                defaultSelected: [],
                busy: false,
                selected: [], /* 已选择的会话（包括高管） */
                isStaff: this.$im().auth.isStaff,
                disableExecutive: false,
                tipState: 'error',
                // 转发二维码图片上传后的下载链接
                downloadUrl: '',
                thumbnail: '',
                msgIndex: 0,
                msgCount: $.isArray(message) ? message.length : 0,
            };
        },
        components: {
            avatar,
            org: getOrg,
            friend: getFriend,
            recent: getRecent,
            group: getGroup,
        },
        computed: {
            /* 说明： 已选会话个数 */
            selectedLen() {
                const context = this;
                // 选择时包含高管显示时要排除高管
                return context.selected.filter(item => !context.executiveLimit(item)).length;
            },
        },
        directives: {
            autoScroll(el) {
                counter += 1;
                if (counter < 4) {
                    return;
                }
                Vue.nextTick(() => {
                    const $el = $(el);
                    const height = $el.children().outerHeight();
                    $el.scrollTop(height);
                });
            },
        },
        mounted() {
            const im = this.$im();
            const messageApi = im.dataModel.Message;
            messageApi.watch(this.onMessageChange);
        },
        destroyed() {
            const im = this.$im();
            const messageApi = im.dataModel.Message;
            messageApi.unwatch(this.onMessageChange);
        },
        methods: {
            rccombineMsgTip() {
                if ($.isArray(message)) {
                    return '';
                }
                if (message.messageType === 'RCCombineMessage') {
                    const messageContent = message.content;
                    const nameList = messageContent.nameList;
                    const conversationType = messageContent.conversationType;
                    const result = getCombineMessageTitle(this, nameList, conversationType);
                    return result;
                }
                return '';
            },
            onMessageChange(newMessage) {
                // 发送方为自己，不需提示
                if (newMessage.messageDirection === 1) {
                    return;
                }
                if (newMessage.content && newMessage.messageType === 'RecallCommandMessage') {
                    if (message.messageUId === newMessage.content.messageUId) {
                        // 转发的消息被撤回
                        const tip = this.locale.forwardedFailed;
                        this.showMessage({
                            type: 'error',
                            message: tip,
                            callback: () => {
                                this.busy = false;
                                this.close();
                            },
                        });
                    }
                }
            },
            reset() {
                this.selected.push({});
                this.selected.pop();
            },
            toast(params) {
                params.el = this.$el.firstChild;
                this.RongIM.common.messageToast(params);
            },
            close() {
                this.show = false;
            },
            setTab(tab) {
                this.tab = tab;
            },
            setTip(tip) {
                this.tip = tip;
            },
            setTipState(state) {
                this.tipState = state;
            },
            showMessage(params) {
                const context = this;
                params.el = context.$el.firstChild;
                this.RongIM.common.messageToast(params);
            },
            /* 说明： 移除已选择的会话 右侧已选列表的事件绑定 */
            removeMembers(members) {
                members = [].concat(members);
                const idList = members.map(item => item.id);
                this.selected = this.selected.filter(item => idList.indexOf(item.id) < 0);
            },
            added(members) {
                const context = this;
                const selectedIdList = context.selected.map(item => item.id);
                const addedList = members.filter(item => selectedIdList.indexOf(item.id) < 0);
                const totalCount = selectedIdList.length + addedList.length;
                context.selected = context.selected.concat(addedList);
                if (totalCount > context.maxCount) {
                    const tip = context.RongIM.common.getErrorMessage('forward-limit');
                    context.showMessage({
                        type: 'error',
                        message: tip,
                    });
                    context.removed(members);
                }
            },
            /* 说明： 移除已选择的会话 组件事件触发绑定 */
            removed(members) {
                const context = this;
                const idList = members.map(item => item.id);
                const reservedIdList = context.defaultSelected.map(item => item.id);
                context.selected = context.selected.filter((item) => {
                    const reserved = reservedIdList.indexOf(item.id) >= 0;
                    return reserved || idList.indexOf(item.id) < 0;
                });
            },
            getUsername(...args) {
                return this.RongIM.common.getUsername(...args);
            },
            submit() {
                const context = this;
                const dataModel = this.$im().dataModel;
                const params = {
                    context: {
                        selected: this.selected,
                        isGroup: this.isGroup,
                        locale: this.locale,
                        close: this.close,
                        showMessage: context.showMessage,
                        busy: this.busy,
                        downloadUrl: this.downloadUrl,
                        thumbnail: this.thumbnail,
                        common: this.RongIM.common,
                    },
                    api: {
                        message: dataModel.Message,
                    },
                };
                if ($.isArray(message)) {
                    const item = message[this.msgIndex];
                    submit(params, item.content, item.messageType, context);
                } else {
                    submit(params, message.content, message.messageType, context);
                }
            },
            isGroup(item) {
                return item.id.startsWith('group_');
            },
            executiveLimit(item) {
                if (item.isFriend || this.$im().auth.isExecutive || this.disableExecutive) {
                    return false;
                }
                const isExecutive = !!item.isExecutive;
                return isExecutive;
            },
            maxCountLimit() {
                const tip = this.RongIM.common.getErrorMessage('forward-limit');
                this.showMessage({
                    type: 'error',
                    message: tip,
                });
                this.reset();
            },
        },
    };
    window.RongIM.common.mountDialog(options);
}

/*
说明： 根据选择的会话转发消息， 客户端限制每秒最多发送 5 条消息，需要限制发送频率。
*/
function submit(params, content, messageType, forwardComponent) {
    const context = params.context;
    const messageApi = params.api.message;
    if (forwardComponent.busy) {
        return;
    }
    forwardComponent.busy = true;
    if (content.isForwaed) {
        // 转发群组二维码图片，需要上传文件服务器
        const base64Str = content.content || '';
        forwardGroupQRcode(context, base64Str, (forwordContent) => {
            sendForwardMsg(forwordContent, messageApi, context, messageType, forwardComponent);
        }, forwardComponent);
        return;
    }
    if (messageType === 'PublicServiceRichContentMessage' || messageType === 'PublicServiceMultiRichContentMessage') {
        sendForwardRichContentMsg(content, messageApi, context, messageType, forwardComponent);
    } else {
        sendForwardMsg(content, messageApi, context, messageType, forwardComponent);
    }
}
function sendForwardRichContentMsg(content, messageApi, context, messageType, forwardComponent) {
    content.articles.forEach((article) => {
        const msgContent = {
            messageName: 'RichContentMessage',
            content: article.digest,
            title: article.title,
            imageUri: article.picurl,
            extra: article.extra,
            url: article.url,
        };
        sendForwardMsg(msgContent, messageApi, context, messageType, forwardComponent);
    });
}

// 转发之前，上传群二维码
function forwardGroupQRcode(context, base64Str, callback, component) {
    const getContent = function getContent(thumbnail, url) {
        const content = {
            content: thumbnail,
            imageUri: url,
            messageName: MessageType.ImageMessage,
            thumbnailPath: '',
        };
        return content;
    };
    if (context.downloadUrl && context.thumbnail) {
        const forwordContent = getContent(context.thumbnail, context.downloadUrl);
        callback(forwordContent);
        return;
    }
    upload('base64', base64Str, (errorCode, result) => {
        if (errorCode) {
            console.warn('upload failed', errorCode);
            return;
        }
        context.downloadUrl = result.imageUrl;
        context.thumbnail = result.thumbnail;
        callback(getContent(result.thumbnail, result.imageUrl));
    }, component);
}

// 发送转发的消息
function sendForwardMsg(content, messageApi, context, messageType, forwardComponent) {
    const message = messageApi.create({
        messageType: content.messageName || messageType,
        content,
    });
    if (message.messageName === MessageType.FileMessage) {
        message.localPath = content.localPath;
    }

    // if (message.messageName === MessageType.TextMessage) {
    //     message.content = context.common.convertMessage(message.content);
    // }
    // if (message.messageName === MessageType.RichContentMessage ) {
    //     message.content = content.articles[0].digest;
    //     message.title = content.articles[0].title;
    //     message.imageUri = content.articles[0].picurl;
    //     message.extra = content.articles[0].extra;
    //     message.url = content.articles[0].url;
    // }

    const paramList = context.selected.map((item) => {
        let conversationType = RongIMLib.ConversationType.PRIVATE;
        let targetId = item.id;
        if (context.isGroup(item)) {
            conversationType = RongIMLib.ConversationType.GROUP;
            targetId = targetId.replace('group_', '');
        }
        return {
            conversationType,
            targetId,
            content: message,
        };
    });
    const len = paramList.length;
    let index = 0;
    const interval = setInterval(() => {
        const item = paramList[index];
        messageApi.send(item, (errorCode, msg) => {
            // 群组被禁言
            if (errorCode === 'lib-22408') {
                messageApi.addForwardFaildMessage(msg);
            }
            if (index === len) {
                clearInterval(interval);
                context.showMessage({
                    message: context.locale.forwarded,
                });
                forwardComponent.busy = false;
                context.close();
                forwardComponent.msgIndex += 1;
                if (forwardComponent.msgIndex < forwardComponent.msgCount) {
                    forwardComponent.submit();
                }
                if (msg.messageType === 'RCCombineMessage' || (forwardComponent.msgCount !== 0 && forwardComponent.msgIndex === forwardComponent.msgCount)) {
                    forwardComponent.$im().$emit('multiMsgForwardDone');
                }
            }
        });
        /**
         * 38760:【消息】转发消息至群组未全部都转发成功
         * Loop variable <index> has an issue in the callback function.
         */
        index += 1;
    }, 500);
}

/**
 * 上传图片到文件服务器
 * @param type - 'file' or 'image' or 'base64'
 * @param fileData
 * @param callback
 */
function upload(type, fileData, callback, context) {
    const conf = config.upload[type] || config.upload.file;
    const dataType = RongIMLib.FileType.IMAGE;
    let thumbnail = '';
    conf.data = UploadClient.dataType.data;
    conf.getToken = function getToken(done) {
        context.$im().dataModel.File.getFileToken((token) => {
            done(token);
        }, dataType);
    };
    const uploadCallback = {
        onBeforeUpload(data) {
            thumbnail = data;
        },
        onProgress() {
        },
        onCompleted(data) {
            const url = getDownloadUrl(config, data);

            if (url) {
                callback(null, { imageUrl: url, thumbnail });
                return;
            }
            RongIMClient.getInstance().getFileUrl(dataType, data.filename, data.name, {
                onSuccess(result) {
                    const imageUrl = result.downloadUrl;
                    callback(null, { imageUrl, thumbnail });
                },
                onError() {
                    console.log('获取URL失败');
                },
            });
        },
        onError: callback,
    };
    UploadClient.initImgBase64(conf, (uploadFile) => {
        uploadFile.upload(fileData, uploadCallback);
    });
}

function getCombineMessageTitle(context, nameList, conversationType) {
    const combineMsgPrefix = `[${context.locale.btns.mergeForward}]`;
    if (!nameList) {
        return '';
    }
    const userCount = nameList.length;
    if (conversationType === 3) {
        return `<p class="rong-combine-message-title">${combineMsgPrefix} ${context.locale.tips.combineMsgGroupTitle}</p>`;
    }
    if (userCount === 1) {
        return `<p class="rong-combine-message-title">${combineMsgPrefix} ${context.localeFormat(context.locale.tips.combineMsgOwnTitle, nameList[0])}</p>`;
    }
    return `<p class="rong-combine-message-title">${combineMsgPrefix} ${context.localeFormat(context.locale.tips.combineMsgSingleTitle, nameList[0], nameList[1])}</p>`;
}
