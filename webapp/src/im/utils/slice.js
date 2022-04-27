// 截取字符（两个英文算一个字）
export default function slice(content, length) {
    const str = content || '';
    let result = '';
    let size = length * 2;
    for (let list = str.split(''), i = 0; size > 0 && i < str.length; i += 1) {
        const item = list[i];
        result += item;
        if (/[\x20-\xff]/.test(item)) {
            size -= 1;
        } else {
            size -= 2;
        }
    }
    return result;
}
