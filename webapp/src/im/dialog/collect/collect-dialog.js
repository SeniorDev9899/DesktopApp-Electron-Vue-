/* eslint-disable no-param-reassign */
import search from '../../components/collect/search.vue';
import customSelect from '../../components/custom-select.vue';
import TextMessage from '../../components/message/text.vue';
import ImageMessage from '../../components/message/image.vue';
import FileMessage from '../../components/message/file.vue';
import VoiceMessage from '../../components/message/voice.vue';
import LocationMessage from '../../components/message/location.vue';
import SightMessage from '../../components/message/sight.vue';
import RichContentMessage from '../../components/message/richcontent.vue';

import templateFormat from '../../utils/templateFormat';
import dateFormat from '../../utils/dateFormat';
import config from '../../config';

let timer = null;
/*
    说明： 选择用户信息发送已选收藏消息
    */
export default function () {
    const options = {
        name: 'collect-dialog',
        template: 'templates/collect/collect-dialog.html',
        data() {
            return {
                show: true,
                selected: [],
                currentView: 'all',
                list: [],
                collectList: [],
                index: -1,
                oldkeyword: '',
                keyword: '',
                message: '',
                busy: false,
                filtedMessageList: [],
                checkList: [],
            };
        },
        props: {
            valueKey: {
                type: String,
                default: 'value',
            },
            nameKey: {
                type: String,
                default: 'name',
            },
        },
        computed: {
            isEmpty() {
                const hasInputValue = this.keyword.length > 0;
                const matchCount = this.collectList.length === 0;
                return hasInputValue && matchCount;
            },
        },
        components: {
            search,
            customSelect,
            TextMessage,
            ImageMessage,
            LocalImageMessage: ImageMessage,
            FileMessage,
            LocalFileMessage: FileMessage,
            VoiceMessage,
            LocationMessage,
            SightMessage,
            RichContentMessage,
        },
        watch: {
            currentView(data) {
                this.keyword = '';
                this.oldkeyword = '';
                this.index = -1;
                if (data === 'all') {
                    this.collectList = this.list; return;
                }
                this.collectList = this.list.filter(item => reName(data).indexOf(item.objectName) !== -1);
                // 37834 - 【收藏】收藏页面滚动条，显示了上一次页面的操作记录
                $('.rong-collect-dialog-inner').scrollTop(0);
            },
            /* keyword:function(newValue,oldValue){
                     newValue = newValue.replace(/\s+/g,'');
                     oldValue = oldValue.replace(/\s+/g,'');
                     if(newValue&&newValue===oldValue){
                         return ;
                     }
                     this.collectList=this.list.filter(function(item){
                         return item.content.content.indexOf(newValue)!=-1;
                     })
                 } */
        },
        filters: {
            dateFormat(timestamp) {
                return dateFormat(timestamp, {
                    alwaysShowTime: true,
                });
            },
        },
        created() {
            const locale = config.currentLocale();
            this.checkList.push({
                name: locale.components.collect.all,
                value: 'all',
            });
        },
        destroyed() {
            const collectApi = this.$im().dataModel.Collect;
            collectApi.unwatch(this.userChanged);
        },
        mounted() {
            const context = this;
            const collectApi = this.$im().dataModel.Collect;
            getList(context, collectApi);
            context.userChanged = function userChanged() {
                getList(context, collectApi);
            };
            collectApi.watch(context.userChanged);
        },
        methods: {
            close() {
                this.show = false;
            },
            getItemValue(item) {
                return item[this.valueKey];
            },
            getItemName(item) {
                return item[this.nameKey];
            },
            getSelected(value) {
                const context = this;
                let item = {};
                this.list.forEach((i) => {
                    if (context.getItemValue(i) === value) {
                        item = i;
                    }
                });
                return this.getItemName(item);
            },
            localeFormat: templateFormat,
            submit() {
                const im = this.$im();
                const common = this.RongIM.common;
                const messageApi = im.dataModel.Message;
                const routeParams = im.$route.params;
                const conversationType = parseInt(routeParams.conversationType);
                const targetId = routeParams.targetId;
                const msg = {
                    messageType: this.message.messageType,
                    content: this.message.content,
                };
                if (this.message.objectName === 'RC:SightMsg') {
                    msg.messageType = 'SightMessage';
                }
                if (this.message.objectName === 'RC:CardMsg') {
                    msg.messageType = 'CardMessage';
                }
                let message;
                if (this.message.messageType === 'RichContentMessage' && +this.message.sourceType === 3) {
                    const item = this.message.content;
                    message = common.buildMessage.RichContentMessage(item);
                } else {
                    message = messageApi.create(msg);
                }
                const paramList = {
                    conversationType,
                    targetId,
                    content: message,
                };
                messageApi.send(paramList, (errorCode) => {
                    if (errorCode) {
                        console.error(errorCode);
                    }
                });
                this.close();
            },
            isEqual(_item, index) {
                if (index === this.index) {
                    return true;
                }
                return false;
            },
            clear() {
                this.keyword = '';
                this.search();
            },
            down() {
                this.busy = true;
            },
            select(item, index) {
                if (item.messageType === 'VoiceMessage') {
                    const param = {
                        message: this.locale.tips.voiceForward,
                        callback() { },
                        el: this.$el.firstChild,
                        type: 'error',
                    };
                    this.RongIM.common.messageToast(param);
                    return;
                }
                this.index = index;
                this.message = item;
            },
            getMessageType(item) {
                let messageType;
                switch (item.messageType) {
                case 'RC:SightMsg':
                    messageType = 'SightMessage';
                    break;
                case 'LRC:fileMsg':
                    messageType = 'FileMessage';
                    break;
                case 'RC:CardMsg':
                    messageType = 'CardMessage';
                    break;
                case RongIMLib.RongIMClient.MessageType.GIFMessage:
                    messageType = 'ImageMessage';
                    break;
                default:
                    messageType = item.messageType;
                }
                return messageType;
            },
            search() {
                const context = this;
                const collectApi = this.$im().dataModel.Collect;
                if (context.oldkeyword === context.keyword) {
                    context.busy = false;
                    return;
                }
                context.oldkeyword = context.keyword;
                clearTimeout(timer);
                context.busy = true;
                // TODO: 解释为什么用的是延迟而非防抖方法
                timer = setTimeout(() => {
                    searchHandle(context, collectApi);
                }, 1000);
            },
        },
    };
    window.RongIM.common.mountDialog(options);
}
function getList(context, collectApi) {
    context.busy = true;
    const common = context.RongIM.common;
    const params = {
        version: -1,
        scope: 'message',
    };
    collectApi.getList(params, (errorCode, list) => {
        if (errorCode) {
            common.toastError(errorCode);
            return;
        }
        context.list = list;
        context.collectList = list;
        context.filtedMessageList = list;
        context.busy = false;
        const arr = list.map(item => item.objectName);
        context.checkList = context.checkList.slice(0, 1);
        if (arr.indexOf('RC:TxtMsg') !== -1) {
            context.checkList.push({
                name: context.locale.components.collect.text,
                value: 'text',
            });
        }
        if (arr.indexOf('RC:VcMsg') !== -1) {
            context.checkList.push({
                name: context.locale.components.collect.voice,
                value: 'voice',
            });
        }
        if (arr.indexOf('RC:LBSMsg') !== -1) {
            context.checkList.push({
                name: context.locale.components.collect.position,
                value: 'position',
            });
        }
        if (arr.indexOf('RC:ImgMsg') !== -1 || arr.indexOf('RC:SightMsg') !== -1) {
            context.checkList.push({
                name: context.locale.components.collect.video,
                value: 'video',
            });
        }
        if (arr.indexOf('RC:FileMsg') !== -1 || arr.indexOf('LRC:fileMsg') !== -1) {
            context.checkList.push({
                name: context.locale.components.collect.file,
                value: 'file',
            });
        }
        if (arr.indexOf('RC:ImgTextMsg') !== -1) {
            context.checkList.push({
                name: context.locale.components.collect.link,
                value: 'link',
            });
        }
    });
}

function searchHandle(context, collectApi) {
    const params = {
        scope: 'message',
        keyword: context.keyword,
    };
    const type = context.currentView;
    if (type === 'text') {
        params.type = 'RC:TxtMsg';
    } else if (type === 'voice') {
        params.type = 'RC:VcMsg';
    } else if (type === 'position') {
        params.type = 'RC:LBSMsg';
    } else if (type === 'video') {
        params.type = ['RC:ImgMsg', 'RC:SightMsg'];
    } else if (type === 'file') {
        params.type = 'RC:FileMsg';
    } else if (type === 'link') {
        params.type = 'RC:ImgTextMsg';
    }
    collectApi.search(params, (errorCode, ids) => {
        if (errorCode) {
            context.RongIM.common.toastError(errorCode);
            return;
        }
        context.collectList = [];
        for (let i = 0; i < ids.length; i += 1) {
            for (let j = 0; j < context.list.length; j += 1) {
                if (ids[i] === context.list[j].uid) {
                    context.collectList.push(context.list[j]);
                }
            }
        }
        context.busy = false;
    });
}
function reName(obj) {
    switch (obj) {
    case 'all':
        obj = ''; break;
    case 'text':
        obj = 'RC:TxtMsg'; break;
    case 'voice':
        obj = 'RC:VcMsg'; break;
    case 'position':
        obj = 'RC:LBSMsg'; break;
    case 'video':
        obj = 'RC:ImgMsgRC:SightMsg'; break;
    case 'file':
        obj = 'RC:FileMsgFileMessageLRC:fileMsg'; break;
    case 'link':
        obj = 'RC:ImgTextMsg'; break;
    default: return undefined;
    }
    return obj;
}
