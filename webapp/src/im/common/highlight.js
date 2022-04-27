/* eslint-disable no-param-reassign */
import isEmpty from '../utils/isEmpty';

// 高亮对应的字符
export default function highlight(string, keyword, notfilterLabel) {
    if (isEmpty(keyword)) {
        return string;
    }
    if ($.isArray(keyword)) {
        const range = keyword;
        const start = range[0];
        const length = range[1];
        keyword = string.substr(start, length);
    }
    keyword = keyword.replace(/([\\^$*+?()[\]])/g, '\\$1');
    let pattern;
    if (notfilterLabel) {
        pattern = new RegExp(`(${keyword})`, 'ig');
        return string.replace(pattern, '<mark>$1</mark>');
    }
    const randomStr = `${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    pattern = /<[^>]+>/ig;
    const contents = [];
    // 使用随机字符串替换不可被replace的部分内容
    string = string.replace(pattern, (words) => {
        contents.push(words);
        return randomStr;
    });
    // 匹配内容，添加mark标记，使用随机字符串分割目标，以免随机字符串匹配keyword
    pattern = new RegExp(`(${keyword})`);
    string = string.split(randomStr).map(temp => temp.replace(pattern, '<mark>$1</mark>')).join(randomStr);
    // 将随机字符串恢复
    return string.replace(new RegExp(randomStr, 'g'), () => contents.shift());
}
