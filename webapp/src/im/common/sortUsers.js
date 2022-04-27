function sortHandle(one, another) {
    const compareResult = one.name.localeCompare(another.name);
    if (compareResult === 0) {
        return one.id.localeCompare(another.id);
    }
    return compareResult;
}

// 用户排序，先按拼音顺序排，如果拼音一样，则按id排
export default function sortUsers(users) {
    return users.sort(sortHandle);
}
