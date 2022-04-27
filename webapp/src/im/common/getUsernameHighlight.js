import highlight from './highlight';
import getUsernameFormat from './getUsernameFormat';

// 根据server传过来的range，来高亮对应的名字
export default function getUsernameHighlight(user) {
    let str = highlight(user.name, user.range, true);
    if (user.alias) {
        str = getUsernameFormat(str, highlight(user.alias, user.aliasRange, true));
    }
    return str;
}
