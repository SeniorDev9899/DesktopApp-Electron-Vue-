// 返回数组的交集
export default function intersection(array, another) {
    return array.filter(item => another.indexOf(item) >= 0);
}
