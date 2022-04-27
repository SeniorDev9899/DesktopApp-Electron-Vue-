import getPathName from './getPathName';
import getPathNameEllipsis from './getPathNameEllipsis';

export default function getPathNameSuffix(item, orgApi) {
    const pathName = item.pathName || getPathName(item, orgApi);
    const { length } = getPathNameEllipsis(item, orgApi);
    const suffix = pathName.substring(length);
    return suffix;
}
