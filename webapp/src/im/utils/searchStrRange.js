/* eslint-disable no-param-reassign */
import isEmpty from './isEmpty';
import convertToABC from './convertToABC';

// 获取拼音匹配对应的汉字位置
function getPinYinRange(start, end, list) {
    let rangeStart = -1;
    let rangeEnd = -1;
    list.forEach((item, index) => {
        if (rangeStart === -1 && start < item) {
            rangeStart = index - 1;
        }
        if (rangeEnd === -1 && end < item) {
            rangeEnd = index;
        }
    });
    return [rangeStart, rangeEnd - rangeStart];
}

// 获取keyword在字符串中的range
export default function searchStrRange(str, keyword) {
    if (isEmpty(keyword) || isEmpty(str)) {
        return null;
    }
    const matchStrIndex = str.indexOf(keyword);
    if (matchStrIndex > -1) {
        return [matchStrIndex, keyword.length];
    }
    keyword = keyword.toLowerCase();
    const pinyinObj = convertToABC(str);
    const pinyin = pinyinObj.pinyin.toLowerCase();
    const pinyinFirstLetter = pinyinObj.first.toLowerCase();
    // 如果str直接匹配keyword
    // 如果str首字母匹配keyword
    const matchFirstIndex = pinyinFirstLetter.indexOf(keyword);
    if (matchFirstIndex > -1) {
        return [matchFirstIndex, keyword.length];
    }
    // 如果str拼音匹配keyword
    const matchPinyinIndex = pinyin.indexOf(keyword);
    if (matchPinyinIndex > -1) {
        const matchPinyinEnd = matchPinyinIndex + keyword.length - 1;
        return getPinYinRange(matchPinyinIndex, matchPinyinEnd, pinyinObj.list);
    }
    return null;
}
