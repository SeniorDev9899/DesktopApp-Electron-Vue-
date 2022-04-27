import PinYin from './PinYin';

function arraySearch(chart) {
    const keys = Object.keys(PinYin);
    const len = keys.length;
    for (let i = 0; i < len; i += 1) {
        const item = keys[i];
        if (PinYin[item].indexOf(chart) !== -1) {
            return item.substr(0, 1).toUpperCase() + item.substr(1, item.length);
        }
    }
    return null;
}

// 转化成拼音
export default function convertToABC(str) {
    const reg = /[0-9a-zA-Z-]/;
    const list = [];
    let pinyin = '';
    let first = '';

    for (let i = 0, len = str.length; i < len; i += 1) {
        list.push(pinyin.length);
        const char = str.substr(i, 1);
        let py = char;
        if (!reg.test(char)) {
            py = arraySearch(char) || char;
        }
        pinyin += py;
        first += py.substr(0, 1);
    }
    list.push(pinyin.length);
    return {
        list,
        pinyin,
        first,
    };
}
