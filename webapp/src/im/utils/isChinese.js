// 判断是否是中文
export default function isChinese(str) {
    const regex = /[\u4e00-\u9fa5]/;
    const result = str.match(regex);
    if (result) {
        return true;
    }
    return false;
}
