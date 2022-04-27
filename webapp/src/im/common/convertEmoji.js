/* eslint-disable no-param-reassign */
import isString from '../utils/isString';
import isEmojiOverlap from '../utils/isEmojiOverlap';
import system from '../system';
import client from '../client';
import config from '../config';
import emojiConvertHTML from './emojiConvertHTML';
import { emojiNativeReg } from '../utils/emojiReg';

const RongIMEmoji = RongIMLib.RongIMEmoji;
const emojiToHTML = RongIMEmoji.emojiToHTML;
const defaultSize = config.emoji.sizePX;

const formatEmojiOverlap = (() => {
    if (isEmojiOverlap()) {
        let tagReg = emojiNativeReg.toString();
        tagReg = tagReg.substring(1, tagReg.length - 3);
        tagReg += '(?=[^ ]|$)';
        tagReg = new RegExp(tagReg, 'ig');
        return text => text.replace(tagReg, emoji => `${emoji} `);
    }
    return text => text;
})();

/**
 * 转化emoji，不同端显示不同, 用于文本显示
 * 1, pc端并且支持本地emoji读取的版本中, 直接使用RCE本地图片
 * 2, web mac 中, 不使用任何图片, 直接全部使用原生emoji
 * 3, web win 中, 使用/modules/emoji中的图片
 * 4, 当 isForbidNative 传入 true时, mac下也显示图片
 * @param  {String} content 需要转化的内容
 * @param  {Int | Undefined} size    转化后emoji图片大小
 * @param  {Bool} isForbidNative  是否禁止使用原生emoji
 */
export default function convertEmoji(content, size, isForbidNative) {
    if (!isString(content)) {
        return content;
    }
    const hasEmojiUrl = client.getEmojiUrl;
    const platform = system.platform;
    const isInMac = platform.indexOf('darwin') !== -1;
    /**
     * 33895 - 【引用消息】MAC 电脑收到新消息提醒为引用的表情消息会显示为Html
     * check if (isInMac && !isForbidNative) first before if (hasEmojiUrl)
     */
    if (isInMac && !isForbidNative) {
        // 使用symbolToEmoji, 作用是把unicode转化为可显示的emoji
        content = RongIMEmoji.symbolToEmoji(content);
    } else if (hasEmojiUrl) {
        // 使用RCE本地图片
        content = emojiConvertHTML(content, size || defaultSize);
    } else {
        // 网页版, 只显示modules/emoji/emoji-48.png内包含的图片
        content = emojiToHTML(content, size);
    }
    content = formatEmojiOverlap(content);
    return content;
}
