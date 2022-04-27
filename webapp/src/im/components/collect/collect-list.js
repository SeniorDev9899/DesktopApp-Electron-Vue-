/* eslint-disable no-param-reassign */
import copyToClipboard from '../../utils/copyToClipboard';
import templateFormat from '../../utils/templateFormat';
import dateFormat from '../../utils/dateFormat';
import throttle from '../../utils/throttle';
import config from '../../config';
import TextMessage from '../message/text.vue';
import ImageMessage from '../message/image.vue';
import FileMessage from '../message/file.vue';
import VoiceMessage from '../message/voice.vue';
import LocationMessage from '../message/location.vue';
import SightMessage from '../message/sight.vue';
import RichContentMessage from '../message/richcontent.vue';
import collectDetail from '../../dialog/collect/collect-detail';
import forwardDialog from '../../dialog/conversation/forward';
import buildMessage from '../../common/buildMessage';
import getContextMenuMixins from '../mixins/context-menu';
import Base64 from '../../utils/Base64Media';
import getLocaleMixins from '../../utils/getLocaleMixins';
import psImageTextMessage from '../message/ps-image-text.vue';
import download from '../../download';
import getFilename from '../../utils/getFilename';
import getDateId from '../../utils/getDateId';

let oldType;
let oldKeyword;

export default {
    name: 'collect',
    mixins: [getLocaleMixins('collect'), getContextMenu()],
    data() {
        return {
            title: '',
            collectList: [],
            keyword: '',
            Busy: false,
            loadingNextPage: false,
            pageNum: 10,
            pageIndex: 0,
            all: 0,
            params: {
                text: 0,
                voice: 0,
                position: 0,
                video: 0,
                file: 0,
                link: 0,
            },
            status: 0,
        };
    },
    computed: {
        isBusy() {
            return this.Busy;
        },
        isEmpty() {
            const hasInputValue = this.keyword.length > 0;
            const matchCount = this.collectList.length === 0;
            return hasInputValue && matchCount;
        },
    },

    mounted() {
        const context = this;
        const currentLocale = config.currentLocale().components.collect;
        const route = context.$route.params.id;
        const im = context.$im();
        this.title = currentLocale[route];
        im.$on('collectlength', (params, list) => {
            getMessageList(context, params, list);
        });
        im.$emit('collectList');

        if (context.$im().collectKeyword) {
            searchByKeyword(context, 'all', context.$im().collectKeyword);
        } else {
            getList(context);
        }
        im.$on('collectKeywordsearch', (type, keyword) => {
            this.$im().collectKeyword = keyword;
            searchByKeyword(context, type, keyword);
        });
    },
    beforeDestroy() {
        this.$im().$off('collectKeywordsearch');
        oldKeyword = '';
        oldType = '';
    },
    filters: {
        dateFormat(timestamp) {
            return dateFormat(timestamp, {
                alwaysShowTime: true,
            });
        },
    },
    watch: {
        $route(route) {
            this.status = 0;
            this.title = config.currentLocale().components.collect[route.params.id];
            loadInfo(this, route.params.id, this.keyword);
        },
    },
    methods: {
        showDetail(item) {
            if (item.objectName === 'RC:TxtMsg' || item.objectName === 'RC:VcMsg') {
                collectDetail(item);
            }
        },
        forward(message) {
            if (message.messageType === 'VoiceMessage') {
                const param = {
                    message: config.currentLocale().tips.voiceForward,
                    callback() { },
                    el: this.$el.firstChild,
                    type: 'error',
                };
                this.RongIM.common.messageToast(param);
                this.closeContextmenu();
                return;
            }
            forward(this, message);
        },
        save(message) {
            // this.$im().$emit('filesaveas', message);
            // 解决bug 点击另存为没有反应
            this.download(message);
        },
        /* 下载图片 */
        download(message) {
            if (message.messageType === 'FileMessage') {
                const fileComponents = this.$refs[message.messageUId];
                if (fileComponents && fileComponents.length > 0) {
                    fileComponents[0].download(message, false, fileComponents, true);
                }
                // 38807 - 【小视频】移动端发送的小视频，PC 端查看失败，无法查看
            } else if (message.messageType === 'SightMessage') {
                const imgUrl = message.content.sightUrl;
                const filename = message.content.name;
                const downloader = download({ url: imgUrl, name: filename });
                downloader.saveAs();
            } else {
                const imgUrl = message.content.imageUri || message.content.remoteUrl;
                const tmpFile = getFilename(imgUrl);
                let filename = '';
                if (tmpFile.ext === '') {
                    filename = `${getDateId()}.png`;
                }
                const downloader = download({ url: imgUrl, name: filename });
                downloader.saveAs();
            }
            this.closeContextmenu();
        },
        copy(message) {
            copyToClipboard(message.content.url);
            this.closeContextmenu();
        },
        remove(message) {
            const context = this;
            const im = this.$im();
            const collectApi = im.dataModel.Collect;
            let index = 0;
            for (let i = 0; i < this.collectList.length; i += 1) {
                if (this.collectList[i].messageUId === message.messageUId) {
                    index = i;
                }
            }
            collectApi.remove(message.uid, () => {
                context.collectList.splice(index, 1);
                context.closeContextmenu();
                context.Busy = false;
                im.$emit('collectList');
                return false;
            });
        },
        getMessageType(item) {
            let messageType;
            if (item.messageType === 'RC:SightMsg') {
                messageType = 'SightMessage';
            } else {
                messageType = item.messageType;
            }
            if (item.messageType === 'LRC:fileMsg') {
                messageType = 'FileMessage';
            }
            return messageType;
        },
        showImage(message) {
            this.RongIM.common.showImage(getImageMessageList(this.collectList), message.messageUId, config.locale);
        },
        showSight(message) {
            this.showImage(message);
        },
        localeFormat: templateFormat,
        // TODO: 检查 this 指向问题
        scrollBottom: throttle(function scrollBar(event) {
            scrollBottom(this, event);
        }, 800),
    },
    components: {
        TextMessage,
        ImageMessage,
        GIFMessage: ImageMessage,
        LocalImageMessage: ImageMessage,
        FileMessage,
        LocalFileMessage: FileMessage,
        VoiceMessage,
        LocationMessage,
        SightMessage,
        RichContentMessage,
        psImageTextMessage,

    },
};

function getMessageList(context, params, list) {
    context.all = list.length;
    context.params.text = params['RC:TxtMsg'] ? params['RC:TxtMsg'] : 0;
    context.params.voice = params['RC:VcMsg'] ? params['RC:VcMsg'] : 0;
    context.params.position = params['RC:LBSMsg'] ? params['RC:LBSMsg'] : 0;
    context.params.video = (params['RC:SightMsg'] ? params['RC:SightMsg'] : 0) + (params['RC:ImgMsg'] ? params['RC:ImgMsg'] : 0);
    context.params.file = (params['RC:FileMsg'] ? params['RC:FileMsg'] : 0) + (params['LRC:fileMsg'] ? params['LRC:fileMsg'] : 0);
    context.params.link = params['RC:ImgTextMsg'] ? params['RC:ImgTextMsg'] : 0;
}

function searchByKeyword(context, type, keyword) {
    if (type !== oldType || keyword !== oldKeyword) {
        context.keyword = keyword;
        loadInfo(context, type, keyword);
        oldType = type;
        oldKeyword = keyword;
    }
}
function loadInfo(context, type, keyword) {
    context.pageIndex = 0;

    if (!keyword) {
        getList(context);
        return;
    }
    context.Busy = true;
    const params = {
        scope: 'message',
        keyword: context.keyword,
        // type: getMsgType(type)
    };
    const msgType = getMsgType(type);
    if (msgType) {
        params.type = msgType;
    }

    const collectApi = context.$im().dataModel.Collect;
    collectApi.search(params, (errorcode, ids) => {
        if (errorcode) {
            return;
        }
        if (ids.length === 0) {
            context.collectList = [];
            context.Busy = false;
        } else {
            collectApi.getIdList({ ids }, (error, list) => {
                if (error) {
                    return;
                }
                context.collectList = list;
                context.Busy = false;
            });
        }
    });
}

function getImageMessageList(list) {
    const imageMsgList = list.filter((item) => {
        if (item.messageType === 'LocalImageMessage') {
            item.content.imageUri = Base64.concat(item.content.content);
        }
        const url = item.content.imageUri || item.content.sightUrl
            || item.content.remoteUrl || (item.content.content || {}).imageUri;
        const isImage = item.messageType === 'ImageMessage'
            || item.messageType === 'LocalImageMessage' || item.messageType === RongIMLib.RongIMClient.MessageType.GIFMessage;
        const isSight = item.messageType === 'SightMessage';
        const isQuoteimage = item.messageType === 'ReferenceMessage'
            && item.content.objName === 'RC:ImgMsg';
        if (!url && !isImage) {
            return false;
        }
        return isImage || isSight || isQuoteimage;
    });
    return imageMsgList;
}

function getList(context) {
    context.Busy = true;
    const route = context.$route.params.id;
    const start = context.pageIndex * context.pageNum;
    const pageNum = context.pageNum;

    const params = {
        version: -1,
        scope: 'message',
        offset: start,
        limit: pageNum,
    };

    if (route === 'all') {
        if (context.all < start) {
            context.loadingNextPage = false;
            return;
        }
    } else {
        if (context.params[route] < start) {
            context.loadingNextPage = false;
            return;
        }
        params.type = getMsgType(route);
    }
    const collectApi = context.$im().dataModel.Collect;
    // TODO: 解释此处闭包的必要性 ，保留调用api时的tab状态，用于返回数据时判断此条数据是否是当前tab页对应数据。
    collectApi.getList(params, (errorcode, result) => {
        if (errorcode) {
            context.RongIM.common.toastError(errorcode);
            context.Busy = false;
            context.status = 1;
            return;
        }
        const path = context.$route.params.id;
        const flag = path === route;
        context.loadingNextPage = false;
        if (!flag) return;
        if (context.pageIndex === 0) context.collectList = [];
        context.Busy = false;
        context.collectList = context.collectList.concat(result);
    });
}
function getContextMenu() {
    const options = {
        template: 'templates/collect/collect-menu.html',
        computed: {
            showForward() {
                const excludeList = [
                    //  'TextMessage',
                    // 'LocationMessage',
                    // 'SightMessage',
                    'VoiceMessage',
                    RongIMLib.RongIMClient.MessageType.GIFMessage,
                    // 'ImageMessage',
                    // 'FileMessage',
                ];
                const show = excludeList.indexOf(this.context.message.messageType) < 0;
                return show;
            },
            showRemove() {
                return true;
            },
            showSave() {
                const excludeList = [
                    'TextMessage',
                    'LocationMessage',
                    'SightMessage',
                    'RC:SightMsg',
                    'VoiceMessage',
                    'ImageMessage',
                    'RichContentMessage',
                    //  'FileMessage',
                ];
                const show = excludeList.indexOf(this.context.message.messageType) < 0;
                return show;
            },
            showCopy() {
                const excludeList = [
                    'TextMessage',
                    'LocationMessage',
                    'SightMessage',
                    'RC:SightMsg',
                    'VoiceMessage',
                    'ImageMessage',
                    'FileMessage',
                ];
                const show = excludeList.indexOf(this.context.message.messageType) < 0;
                return show;
            },
        },
        methods: {
            save() {
                this.$emit('save', this.context.message);
            },
            copy() {
                this.$emit('copy', this.context.message);
            },
            remove() {
                this.$emit('remove', this.context.message);
            },
            forward() {
                this.$emit('forward', this.context.message);
            },
        },
    };
    return getContextMenuMixins(options);
}
function forward(context, message) {
    if (message.messageType === 'RichContentMessage') {
        message = buildMessage.RichContentMessage(message);
    }
    if (message.objectName === 'RC:SightMsg') {
        message.messageName = 'SightMessage';
    }
    forwardDialog(message);
    context.closeContextmenu();
}
function scrollBottom(context, event) {
    // 判断如果向下滚动并滚动到最下方，就加载更多会话列表
    const down = event.deltaY > 0;
    const $content = $(context.$refs.list);
    const height = $content ? $content[0].scrollHeight : 0;
    const bottom = ($content.scrollTop() + $content.height()) >= height - 15;

    if (down && bottom && !context.keyword) {
        loadMore(context);
    }
}
function loadMore(context) {
    const start = context.pageIndex * context.pageNum;
    if (context.all <= start) {
        return;
    }
    context.loadingNextPage = true;
    context.pageIndex += 1;
    getList(context);
}
function getMsgType(type) {
    let msgType;
    switch (type) {
    case 'all':
        msgType = ''; break;
    case 'text':
        msgType = ['RC:TxtMsg']; break;
    case 'voice':
        msgType = ['RC:VcMsg']; break;
    case 'position':
        msgType = ['RC:LBSMsg']; break;
    case 'video':
        msgType = ['RC:ImgMsg', 'RC:SightMsg', 'RC:GIFMsg']; break;
    case 'file':
        msgType = ['RC:FileMsg', 'FileMessage', 'LRC:fileMsg']; break;
    case 'link':
        msgType = ['RC:ImgTextMsg']; break;
    default: return undefined;
    }
    return msgType;
}
