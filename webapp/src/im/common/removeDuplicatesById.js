/*
    说明：根据对象中 id 去除重复对象
    参数：arr 对象数组对象要包含 id 属性
    */
export default function removeDuplicatesById(arr) {
    if (!$.isArray(arr)) {
        return [];
    }
    let cacheKey = [];
    const result = [];
    arr.forEach((item) => {
        const key = item.id;
        if (cacheKey.indexOf(key) === -1) {
            result.push(item);
            cacheKey.push(key);
        }
    });
    cacheKey = null;
    return result;
}
