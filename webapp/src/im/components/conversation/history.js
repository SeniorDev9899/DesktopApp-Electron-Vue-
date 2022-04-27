/* eslint-disable no-param-reassign */
import Base64Util from '../../utils/Base64Media';
import getLocaleMixins from '../../utils/getLocaleMixins';
import throttle from '../../utils/throttle';
import isEmpty from '../../utils/isEmpty';
import config from '../../config';
import isAvailableData from '../../isAvailableData';
import system from '../../system';
import avatar from '../avatar.vue';
import TextMessage from '../message/text.vue';
import ImageMessage from '../message/image.vue';
import FileMessage from '../message/file.vue';
import VoiceMessage from '../message/voice.vue';
import LocationMessage from '../message/location.vue';
import CardMessage from '../message/card.vue';
import RichContentMessage from '../message/richcontent.vue';
import SightMessage from '../message/sight.vue';
import UnknownMessage from '../message/unknown.vue';
import GroupNoticeNotifyMessage from '../message/groupnotice.vue';
import ReferenceMessage from '../message/quote/quote.vue';

let allImageList = [];

/*
说明： 获取历史消息
       桌面版增加文件分类，由于涉及到按文件名称搜索 SDK 目前不支持所以获取所有文件类消息内存中做分页。
*/
export default {
    name: 'history',
    mixins: [getLocaleMixins('history')],
    props: ['conversation'],
    data() {
        return {
            busy: true,
            messageType: '',
            keyword: '',
            count: 20,
            currentPage: 1,
            pageCount: '',
            total: 0,
            messageList: [],
            notOnlyImage: true,
            hasMoreLast: true,
        };
    },
    computed: {
        // 支持在历史消息中展示的消息
        // filterList: function () {
        //     var list = [
        //         'TextMessage',
        //         'ImageMessage',
        //         'FileMessage',
        //         'VoiceMessage',
        //         'LocationMessage',
        //         'CardMessage',
        //         'SightMessage',
        //         'RichContentMessage',
        //         'GroupNoticeNotifyMessage',
        //         'ReferenceMessage'
        //     ];

        //     return this.messageList.filter(function (item) {
        //         return list.indexOf(item.messageType) >= 0 && item.sentStatus !== RongIMLib.SentStatus.FAILED;
        //     });
        // },
        // 44176 【消息记录】每发送一个小视频文件，聊天消息记录里面都会展示一张打不开的图片
        filterSightThumbList(){
            let newList = [];
            for (var i = 0; i < this.messageList.length; i += 1){
                const currentMessage = this.messageList[i];
                
                //43516【历史消息】进入一个群组查看历史文件消息，文件列表为空，该群组内有文件消息
                if (i < this.messageList.length -1 ) {
                    const nextMessage = this.messageList[i+1];
                    if ((currentMessage.messageType === 'SightMessage' && nextMessage.messageType === 'SightMessage') &&
                    (currentMessage.content.uploadId === nextMessage.content.uploadId)) {
                        //newList.push(nextMessage);
                    } else{
                        newList.push(currentMessage);
                    }
                } else {
                    newList.push(currentMessage);
                }
            }

            return newList;
        },
        imageList() {
            // 34950 - 【消息记录】移动端发送的 GIF 图片未在消息记录图片列表里显示
            const list = ['ImageMessage', 'SightMessage', 'GIFMessage'];
            const imageMessageList = this.messageList.filter(item => list.indexOf(item.messageType) >= 0 && item.sentStatus !== RongIMLib.SentStatus.FAILED);
            const imageList = getImageList(imageMessageList);
            return imageList;
        },
        // 是否支持消息搜索（仅桌面版 C++ SDK 支持消息搜索）
        supportSearch() {
            return config.support.search;
        },
        messageTypeClassName() {
            if (this.messageType === 'ImageMessage') {
                this.notOnlyImage = false;
            }
            if (this.messageType === 'FileMessage') {
                this.notOnlyImage = true;
            }
            if (isEmpty(this.messageType)) {
                this.notOnlyImage = true;
                return 'all';
            }
            const map = {};
            map[RongIMClient.MessageType.FileMessage] = 'file';
            map[RongIMClient.MessageType.ImageMessage] = 'image';
            return map[this.messageType];
        },
        imgViewerSource() {
            if (this.messageType === 'ImageMessage') {
                return this.messageList;
            } if (isEmpty(this.messageType)) {
                return this.blockFilterList.data;
            }
            return undefined;
        },
    },
    components: {
        avatar,
        TextMessage,
        ImageMessage,
        FileMessage,
        VoiceMessage,
        LocationMessage,
        CardMessage,
        RichContentMessage,
        SightMessage,
        UnknownMessage,
        GroupNoticeNotifyMessage,
        ReferenceMessage,
    },
    directives: {
        autoScrolltotop(ele, binding, vnode) {
            const context = vnode.context;
            if (context.keyword || context.$refs.content) {
                ele.scrollTop = 0;
            } else {
                Vue.nextTick(() => {
                    ele.scrollTop = ele.scrollHeight;
                });
            }
        },
    },
    watch: {
        keyword() {
            toggle(this, this.$im().dataModel.Message);
            // 42569 - 【消息记录】搜索框每输入一个字符都会失去焦点，建议输入内容后输入框焦点还在
            const context = this;
            Vue.nextTick(() => {
                context.$el.querySelectorAll(':focus').forEach((el) => {
                    el.blur();
                });
                context.$refs.searchInputBox.focus();
            });
        },
        messageType() {
            toggle(this, this.$im().dataModel.Message);
        },
    },
    beforeDestroy() {
        this.$im().$off('imclick', this.close);
    },
    mounted() {
        const context = this;
        const im = this.$im();
        const dataModel = im.dataModel;
        im.$on('imclick', context.close);
        toggle(this, dataModel.Message);
        const params = {
            route: context.$route,
            count: context.count,
            messageApi: dataModel.Message,
        };
        if (system.platform.indexOf('web') === -1) {
            getAllFileList(params, context);
            getAllImageList(context, params);
        }

        window.RongDesktop.ipcRenderer.on('select-all', () => {
            context.selectAllText();
        });
    },
    methods: {
        clear() {
            this.keyword = '';
        },
        getUsername(user) {
            const conversation = this.conversation || {};
            const group = conversation.group || {};
            return this.RongIM.common.getGroupUsername(user, group.id);
        },
        dateFormat(timestamp, format) {
            return moment(timestamp).format(format);
        },
        getMessageType(item) {
            // 34950 - 【消息记录】移动端发送的 GIF 图片未在消息记录图片列表里显示
            let messageType;
            if (item.messageType === 'GIFMessage') {
                messageType = 'ImageMessage';
            } else if (item.messageType === 'LocalFileMessage') {
                // 42510 - 【消息记录】消息记录的文件分类下没有显示聊天记录文件
                messageType = 'FileMessage';
            } else {
                messageType = item.messageType;
            }
            const supported = this.$options.components[messageType];
            return supported ? messageType : 'UnknownMessage';
        },
        showFileMessage() {
            this.messageType = RongIMClient.MessageType.FileMessage;
        },
        showImageMessage() {
            this.messageType = RongIMClient.MessageType.ImageMessage;
        },
        scrollToMessage(messageId, alignToTop) {
            const $content = $(this.$refs.content);
            Vue.nextTick(() => {
                const el = document.getElementById(`rong-history-message-${messageId}`);
                if (el) el.scrollIntoView(alignToTop);
                if ($content) $content.css('visibility', '');
            });
        },
        scroll: throttle(function onscroll(event) {
            if (isAvailableData()) {
                scroll(this, event);
            }
        }, 500),
        next() {
            if (this.pageCount === this.currentPage) {
                return;
            }
            this.currentPage += 1;
            getCurrentPageMessage(this, this.$im().dataModel.Message);
        },
        prev() {
            if (this.currentPage === 1) {
                return;
            }
            this.currentPage -= 1;
            getCurrentPageMessage(this, this.$im().dataModel.Message);
        },
        close(event) {
            this.$emit('hidepanel', event);
        },
        showImage(message) {
            this.RongIM.common.showImage(getImageMessageList(this.messageList), message.messageUId, config.locale);
        },
        showSight(message) {
            this.showImage(message);
        },

        selectAllText() {
            const range = document.createRange();
            range.selectNode(this.$el.querySelector('.rong-history-main'));
            window.getSelection().removeAllRanges();
            window.getSelection().addRange(range);
        },
        disableAllSelection() {
            window.getSelection().removeAllRanges();
        },
    },
};

let cacheMessageList = [];

function toggle(context, messageApi) {
    cacheMessageList = [];
    context.pageCount = 0;
    context.currentPage = 1;
    getCurrentPageMessage(context, messageApi);
}

/*
说明： 获取所有文件类型的消息，在内存中分页查找。（SDK 不支持只搜索文件消息）
*/
let allFileList = [];
function getAllFileList(params, context) {
    const routeParams = params.route.params;
    allFileList = [];
    const messageParams = {
        conversationType: Number(routeParams.conversationType),
        targetId: routeParams.targetId,
        count: params.count,
        position: 2,
        type: 'FileMessage',
        timestamp: 0,
    };
    function getFile() {
        params.messageApi.get(messageParams, (errorCode, list, hasMore) => {
            if (errorCode) {
                context.RongIM.common.toastError(errorCode);
                return;
            }
            list.reverse();
            allFileList = allFileList.concat(list);
            if (hasMore) {
                messageParams.timestamp = allFileList.slice(-1)[0].sentTime;
                getFile();
            }
        });
    }
    getFile();
}

/*
说明：获取图片历史消息列表
参数：
    @param {array<object>}  context
    @param {object}         params  获取历史消息所需参数和 API
    @param {boolean}        last    判断是否为获取更多图片历史消息
*/
function getAllImageList(context, params, last) {
    const routeParams = params.route.params;
    let sentTime = 0;
    let firstMessage;
    allImageList = [];
    if (last) {
        const msg = context.messageList[context.messageList.length - 1];
        sentTime = msg.sentTime;
        firstMessage = context.messageList[0];
        allImageList = context.messageList.reverse();
    }
    const $content = $(context.$refs.content);
    $content.css('visibility', 'hidden');
    const messageParams = {
        conversationType: Number(routeParams.conversationType),
        targetId: routeParams.targetId,
        count: 20,
        position: 2,
        type: 'ImageMessage',
        timestamp: sentTime,
    };
    params.messageApi.get(messageParams, (errorCode, list, hasMore) => {
        if (errorCode) {
            context.RongIM.common.toastError(errorCode);
            return;
        }
        context.hasMoreLast = hasMore;
        list.reverse();
        allImageList = allImageList.concat(list);
        if (last) {
            let imgList = [];
            imgList = imgList.concat(allImageList);
            context.messageList = imgList.reverse();
            if (firstMessage) context.scrollToMessage(firstMessage.messageId);
        }
    }, true);
}

/*
说明： 根据当前页码 currentPage 当前消息类型 messageType 获取对应消息
*/
function getCurrentPageMessage(context, messageApi) {
    const currentPage = context.currentPage;
    const count = context.count;
    const start = (currentPage - 1) * count;
    const end = currentPage * count;

    context.disableAllSelection();

    if (context.messageType === 'FileMessage') {
        // C++ SDK 不支持文件消息关键字搜索。全部获取在内存中搜索。
        const notSearch = isEmpty(context.keyword);
        if (notSearch) {
            context.pageCount = Math.ceil(allFileList.length / context.count) || 1;
            context.messageList = allFileList.slice(start, end).reverse();
        } else {
            searchFile(context, start, end);
        }
    } else if (context.messageType === 'ImageMessage') {
        let imageList = [];
        imageList = imageList.concat(allImageList);
        context.messageList = imageList.reverse();
    } else {
        const cacheHas = cacheMessageList.length > end && context.pageCount !== 0;
        if (cacheHas) {
            if (context.keyword) {
                context.messageList = cacheMessageList.slice(start, end);
            } else {
                context.messageList = cacheMessageList.slice(start, end).reverse();
            }
        } else {
            const earliest = cacheMessageList.slice(-1)[0];
            const timestamp = earliest ? earliest.sentTime : 0;
            getMessage(context, messageApi, timestamp, start, end);
        }
    }
}

/*
说明： 获取所有类型的历史消息，关键字 keyword 存在则根据关键字查找消息
       文本消息在缓存中搜索
*/
function getMessage(context, messageApi, timestamp, start, end) {
    const routeParams = context.$route.params;
    const params = {
        conversationType: Number(routeParams.conversationType),
        targetId: routeParams.targetId,
        timestamp,
        count: context.count,
    };
    if (context.keyword) {
        params.keyword = context.keyword;
        messageApi.search(params, (errorCode, list, total) => {
            context.busy = false;
            if (errorCode) {
                context.RongIM.common.toastError(errorCode);
                return;
            }
            list.reverse();
            if (context.conversation.conversationType === RongIMLib.ConversationType.GROUP) {
                addGroupAlias(context.conversation, list);
            }
            cacheMessageList = cacheMessageList.concat(list);
            context.messageList = list;
            context.pageCount = Math.ceil(total / context.count) || 1;
        });
    } else {
        params.position = 2;
        params.type = context.messageType;
        const pageList = [];
        let leftCount = cacheMessageList.length - start;
        getPageMessages(messageApi, params, leftCount, pageList, context, (errorCode, list, hasMore) => {
            context.busy = false;
            if (errorCode) {
                context.RongIM.common.toastError(errorCode);
                return;
            }
            if (context.conversation.conversationType === RongIMLib.ConversationType.GROUP) {
                addGroupAlias(context.conversation, list);
            }
            cacheMessageList = cacheMessageList.concat(list);
            context.messageList = cacheMessageList.slice(start, end).reverse();

            leftCount = cacheMessageList.length - end;
            if (hasMore) {
                context.pageCount = 0;
            } else if (leftCount > 0) {
                context.pageCount = context.currentPage + 1;
            } else {
                context.pageCount = context.currentPage;
            }
        });

        // messageApi.get(params, function (errorCode, list, hasMore) {
        //     context.busy = false;
        //     if(errorCode) {
        //         return common.toastError(errorCode);
        //     }
        //     list.reverse();
        //     if(context.conversation.conversationType === RongIMLib.ConversationType.GROUP) {
        //         addGroupAlias(context.conversation, list);
        //     }
        //     cacheMessageList = cacheMessageList.concat(list);
        //     context.messageList = list.reverse();

        //     if (hasMore) {
        //         context.pageCount = 0;
        //     } else {
        //         context.pageCount = context.currentPage;
        //     }
        // });
    }
}

// 支持在历史消息中展示的消息
const filterMessages = [
    'TextMessage',
    'ImageMessage',
    'FileMessage',
    'VoiceMessage',
    'LocationMessage',
    'CardMessage',
    'SightMessage',
    'RichContentMessage',
    'GroupNoticeNotifyMessage',
    'ReferenceMessage',
    'GIFMessage',
];
/*
    递归 filter 不显示的消息类型
*/
function getPageMessages(messageApi, params, leftCount, pageList, context, callback) {
    messageApi.get(params, (errorCode, list, hasMore) => {
        if (errorCode) {
            callback(errorCode);
            return;
        }
        if (!list.length) {
            callback(null, [], hasMore);
            return;
        }
        const latestTimestamp = list[0].sentTime;
        const tmpList = list.filter(item => filterMessages.indexOf(item.messageType) >= 0
                && item.sentStatus !== RongIMLib.SentStatus.FAILED);
        tmpList.reverse();
        pageList = pageList.concat(tmpList);

        if (hasMore && leftCount + pageList.length < context.count) {
            params.timestamp = latestTimestamp;
            setTimeout(getPageMessages, 0, messageApi, params, leftCount, pageList, context, callback);
        } else {
            callback(null, pageList, hasMore);
        }
    });
}

/*
说明： 根据关键字 keyword 从缓存中匹配文件名包含关键字的消息
*/
function searchFile(context, start, end) {
    let arr = allFileList.filter(item => item.content.name.indexOf(context.keyword) !== -1);
    context.pageCount = Math.ceil(arr.length / context.count) || 1;
    arr = arr.slice(start, end);
    context.messageList = arr;
}

function addGroupAlias(conversation, list) {
    if (conversation.conversationType !== RongIMLib.ConversationType.GROUP) {
        return;
    }
    const objGroup = {};
    conversation.group.groupMembers.forEach((member) => {
        objGroup[member.id] = member.groupAlias;
    });
    list.forEach((_message) => {
        const userId = _message.user.id;
        if (objGroup[userId]) {
            _message.user.groupAlias = objGroup[userId];
        }
    });
}

/*
说明：将图片历史消息按本周、本月、其他月的方式转换成所需格式
参数：
    @param {array<object>}    imageMessageList    图片历史消息数组
*/
function getImageList(imageMessageList) {
    const imageList = [];
    const imageListInfo = {};
    let isNowWeek;
    let isNowMonth;
    let ImageMessageTime = '';

    for (let i = 0; i < imageMessageList.length; i += 1) {
        isNowWeek = isSameWeek(imageMessageList[i].sentTime);
        isNowMonth = isSameMonth(imageMessageList[i].sentTime);
        // 根据消息的 sentTime 判断消息是否为本周、本月或其他月份
        if (isNowWeek) {
            imageListInfo['本周'] = imageListInfo['本周'] ? imageListInfo['本周'] : [];
            imageListInfo['本周'].push(imageMessageList[i]);
        } else if (isNowMonth) {
            imageListInfo['本月'] = imageListInfo['本月'] ? imageListInfo['本月'] : [];
            imageListInfo['本月'].push(imageMessageList[i]);
        } else {
            // 如果消息不是本周，同时也不是本月的话，在数组中添加该消息月份的分类
            ImageMessageTime = timestampToTime(imageMessageList[i].sentTime);
            imageListInfo[ImageMessageTime] = imageListInfo[ImageMessageTime] ? imageListInfo[ImageMessageTime] : [];
            imageListInfo[ImageMessageTime].push(imageMessageList[i]);
        }
    }
    Object.keys(imageListInfo).forEach((imageMessageItem) => {
        imageList.push({
            name: imageMessageItem,
            data: imageListInfo[imageMessageItem],
        });
    });
    return imageList;
}

/*
说明：判断滚动条是否滚动到最顶部，获取更多图片历史消息
*/
function scroll(context, event) {
    const up = event.deltaY < 0;
    const $content = $(context.$refs.content);
    const im = context.$im();
    const dataModel = im.dataModel;
    const params = {
        route: context.$route,
        count: context.count,
        messageApi: dataModel.Message,
    };
    if (up && $content.scrollTop() <= 0 && context.hasMoreLast) {
        getAllImageList(context, params, true);
    }
}

/*
说明：根绝消息 sentTime 判断是否为本周消息
参数：
    @param {string}    old    图片历史消息 sentTime 时间戳
*/
function isSameWeek(old) {
    const now = new Date();
    const oneDayTime = 1000 * 60 * 60 * 24;
    const oldCount = parseInt(+old / oneDayTime);
    const nowOther = parseInt(+now / oneDayTime);
    return parseInt((oldCount + 4) / 7) === parseInt((nowOther + 4) / 7);
}

/*
说明：根绝消息 sentTime 判断是否为本月消息
参数：
    @param {string}    old    图片历史消息 sentTime 时间戳
*/
function isSameMonth(old) {
    const now = new Date();
    const nowMonth = now.getMonth() + 1;
    const oldMonth = (new Date(old)).getMonth() + 1;
    return nowMonth === oldMonth;
}

/*
说明：根绝消息 sentTime 获取消息的年、月
参数：
    @param {string}    timestamp    图片历史消息 sentTime 时间戳
*/
function timestampToTime(timestamp) {
    const date = new Date(timestamp);
    const year = `${date.getFullYear()} 年 `;
    const month = `${date.getMonth() + 1 < 10 ? `0${date.getMonth() + 1}` : date.getMonth() + 1} 月`;
    return year + month;
}
function getImageMessageList(list) {
    const imageMsgList = list.filter((item) => {
        if (item.messageType === 'LocalImageMessage') {
            item.content.imageUri = Base64Util.concat(item.content.content);
        }
        const url = item.content.imageUri || item.content.sightUrl || (item.content.content || {}).imageUri;
        // 34950 - 【消息记录】移动端发送的 GIF 图片未在消息记录图片列表里显示
        const isImage = item.messageType === 'ImageMessage' || item.messageType === 'LocalImageMessage' || item.messageType === 'GIFMessage';
        const isSight = item.messageType === 'SightMessage';
        const isQuoteimage = item.messageType === 'ReferenceMessage' && item.content.objName === 'RC:ImgMsg';
        if (!url && !isImage) {
            return false;
        }
        return isImage || isSight || isQuoteimage;
    });
    return imageMsgList;
}
