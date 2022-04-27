/**
 * 根据属性链从源数据中读取值
 * @param {Array<String>} keys 属性链
 * @param {*} resource 源数据
 */
export function getValueByKeys(keys, resource) {
    if (keys.length === 1) {
        return resource[keys[0]];
    }
    return getValueByKeys(keys, resource[keys.shift()]);
}

/**
 * 根据属性链从源数据中读取值
 * @param {String} chainedKey 属性链字符串，使用 '.' 号为属性间的分隔符
 * @param {<String, any>} resource 源数据
 */
export function getValueByChainedKey(chainedKey, resource) {
    return getValueByKeys(chainedKey.split('.'), resource);
}
