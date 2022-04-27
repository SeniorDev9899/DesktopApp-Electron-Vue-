// 取字符长度（两个英文算一个字）
export default function getLength(str) {
    return str.replace(/[^\x20-\xff]/g, '--').length / 2;
}
