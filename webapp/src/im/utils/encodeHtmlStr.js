import isEmpty from './isEmpty';

const replaceRule = [
    {
        symbol: '&',
        html: '&amp;',
    },
    // 下述方法有问题,字符串中如有空格,会多加空格
    // white-space: pre-wrap; 能实现同样效果,并支持ie9, 故注释掉
    // {
    //     symbol: '[\\u0020]',
    //     html: '&nbsp;\u0020'
    // },
    {
        symbol: '[\\u0009]',
        html: '&nbsp;&nbsp;&nbsp;&nbsp;\u0020',
    },
    {
        symbol: '<',
        html: '&lt;',
    },
    {
        symbol: '>',
        html: '&gt;',
    },
    {
        symbol: '\'',
        html: '&#39;',
    },
    {
        symbol: '\\n\\r',
        html: '<br/>',
    },
    {
        symbol: '\\r\\n',
        html: '<br/>',
    },
    {
        symbol: '\\n',
        html: '<br/>',
    },
].map(item => ({
    reg: new RegExp(item.symbol, 'g'),
    html: item.html,
}));

export default function encodeHtmlStr(str) {
    if (isEmpty(str)) {
        return '';
    }
    let val = str;
    for (let i = 0, len = replaceRule.length; i < len; i += 1) {
        const item = replaceRule[i];
        if (typeof val.replace === 'function') {
            val = val.replace(item.reg, item.html);
        }
    }
    return val;
}
