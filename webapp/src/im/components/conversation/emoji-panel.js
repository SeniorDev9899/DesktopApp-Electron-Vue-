/* eslint-disable no-param-reassign */
import system from '../../system';
import client from '../../client';
import isEmojiOverlap from '../../utils/isEmojiOverlap';
import emojiConvertHTML from '../../common/emojiConvertHTML';

const RongIMEmoji = RongIMLib.RongIMEmoji;

let timer;
/*
说明： emoji 选择面板
       支持显示 emoji 原生字符时返回原生字符 否则返回 emoji 对应文字标记字符 e.g. [微笑]
*/
export default {
    name: 'emoji-panel',
    data() {
        return {
            list: [],
        };
    },
    mounted() {
        this.list = getEmojiList();
    },
    computed: {
        // 如果是 Mac 则显示 emoji 字符
        isShowEmojiSymbol() {
            const platform = system.platform;
            const hasOSMark = platform.indexOf('darwin') !== -1;
            return hasOSMark && RongIMEmoji.isSupportEmoji;
        },
    },
    methods: {
        show() {
            clearTimeout(timer);
        },
        // hide: function () {
        //     var context = this;
        //     timer = setTimeout(function () {
        //         context.$emit('hideEmojiPanel');
        //     }, 200);
        // },
        selectEmoji(emoji) {
            let output;
            // 支持显示 emoji 字符则返回 emoji 字符
            if (RongIMEmoji.isSupportEmoji) {
                // 在 Mac 非高分屏 Chrome 浏览器下, emoji 会出现与文字重叠现象。拼接空格避免重叠
                const mark = isEmojiOverlap() ? ' ' : '';
                output = emoji.emoji + mark;
            } else {
                output = emoji.symbol;
            }
            this.$emit('selectedEmoji', output);
            this.$emit('hideEmojiPanel');
        },
    },
    watch: {
        locale() {
            this.list = RongIMEmoji.list;
        },
    },
    destroyed() {
        $(window).off('click.emojiPanel');
    },
};

function getEmojiList() {
    let list = [];
    const hasEmojiUrl = client.getEmojiUrl;
    const platform = system.platform;
    const isInMac = platform.indexOf('darwin') !== -1;
    list = RongIMEmoji.list;
    if (isInMac || !hasEmojiUrl) {
        return list;
    }
    list.forEach((item) => {
        const html = emojiConvertHTML(item.emoji);
        const div = document.createElement('div');
        div.innerHTML = html;
        item.node = div.childNodes[0];
    });
    return list;
}
