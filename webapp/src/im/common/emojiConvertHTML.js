/* eslint-disable no-param-reassign */
import client from '../client';
import { emojiNativeReg, emojiUnicodeReg } from '../utils/emojiReg';

const RongIMEmoji = RongIMLib.RongIMEmoji;
const emojiToHTML = RongIMEmoji.emojiToHTML;

/**
 * 原生emoji 转化为 unicode码
 * TODO 待优化, 当前转化不完善, 部分emoji转化错误. 当前仅把已知错误emoji直接判断转化.
 * @param  {String} emoji 原生emoji
 */
function emojiToUnicode(emoji) {
    /* emoji: 方块1 */
    if (emoji === '1\uFE0F\u20E3' || emoji === '1\u20E3') {
        return '0031-fe0f-20e3';
    }
    const unicodeList = [];
    for (let i = 0; i < emoji.length; i += 2) {
        unicodeList.push(emoji.codePointAt(i).toString(16));
    }
    return unicodeList.join('-');
}

function convertUnicode(unic) {
    let unicodes = escape(unic).split('%u');
    unicodes = unicodes.filter(code => code !== '');
    return unicodes.map((code) => {
        if (code.indexOf('f') !== -1 || code.indexOf('F') !== -1) {
            return `1${code}`;
        }
        return code;
    }).join('-');
}

function getEmojiHTML(emoji, unicode, size) {
    const getUrl = client.getEmojiUrl;
    const url = getUrl(unicode);
    if (!url) {
        return emojiToHTML(emoji, size);
    }
    let symbol = 'other';
    const list = RongIMEmoji.list;
    list.forEach((item) => {
        if (item.emoji === emoji) {
            const name = item.symbol;
            symbol = name.substring(1, name.length - 1);
        }
    });
    const emojiItem = {
        en: symbol, zh: symbol, tag: emoji, position: '0px, 0px', background: url,
    };
    return RongIMEmoji.createNodeHTML(emojiItem, size);
}

// emoji的 html 使用模块内的图片
export default function emojiConvertHTML(content, size) {
    content = content.replace(emojiNativeReg, (emoji) => {
        const unicode = emojiToUnicode(emoji);
        return getEmojiHTML(emoji, unicode, size);
    });
    content = content.replace(emojiUnicodeReg, (unic) => {
        const unicode = convertUnicode(unic);
        return getEmojiHTML(unic, unicode, size);
    });
    return content;
}
