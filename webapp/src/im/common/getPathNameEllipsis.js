import getLength from '../utils/getLength';
import slice from '../utils/slice';
import getPathName from './getPathName';

export default function getPathNameEllipsis(item, orgApi) {
    let pathName = item.pathName || getPathName(item, orgApi);
    const length = getLength(pathName);
    pathName = slice(pathName, Math.max(0, length - 5));
    return pathName;
}
