import isEmpty from '../utils/isEmpty';
import getLength from '../utils/getLength';

// 获取群组的名称，如果没有设置，则获取前十个用户的名字组成群名称
export default function getGroupName(group) {
    if (isEmpty(group)) {
        return '';
    }
    if (!isEmpty(group.name)) {
        return group.name;
    }
    const limit = 10;
    const list = [];
    $.each(group.member_names, (i, item) => {
        const length = getLength(list.concat(item).join(','));
        if (length > limit) {
            return;
        }
        list.push(item);
    });
    return list.join('、');
}
