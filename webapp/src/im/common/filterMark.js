import encodeHtmlStr from '../utils/encodeHtmlStr';

/*
 过滤除了mark标签以外的html
 */
export default function filterMark(val) {
    const randomStr1 = `${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const randomStr2 = `${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    if (!val) {
        return '';
    }
    let str = val.replace(/<mark>/g, randomStr1);
    str = str.replace(/<\/mark>/g, randomStr2);
    str = encodeHtmlStr(str);
    // 将随机字符串恢复
    str = str.replace(new RegExp(randomStr1, 'g'), () => '<mark>').replace(new RegExp(randomStr2, 'g'), () => '</mark>');
    return str;
}
