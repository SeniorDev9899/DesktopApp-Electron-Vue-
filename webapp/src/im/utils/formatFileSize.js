/* eslint-disable no-restricted-properties */
// TODO: 算法问题
export default function formatFileSize(totalSize, isInt) {
    const nameList = ['Byte', 'KB', 'MB', 'GB', 'TB'];
    const unit = 1024;
    const intExp = /^\d+$/;
    for (let i = 0; i < nameList.length; i += 1) {
        let name = nameList[i];
        name = ` ${name}`;
        if (totalSize < Math.pow(unit, i + 1)) {
            let result;
            if (i === 0) {
                result = isInt ? totalSize : totalSize.toFixed(2);
            } else {
                result = isInt
                    ? (totalSize / Math.pow(unit, i))
                    : (totalSize / Math.pow(unit, i)).toFixed(2);
            }
            result = +result;
            // eslint-disable-next-line no-param-reassign
            isInt = intExp.test(result);
            result = isInt ? result.toFixed(0) : result;
            return result + name;
        }
    }
    return undefined;
}
