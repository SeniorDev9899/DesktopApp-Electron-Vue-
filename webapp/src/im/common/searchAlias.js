import searchStrRange from '../utils/searchStrRange';

// 根据keyword搜索出对应昵称的用户
export default function searchAlias(users, keyword, userApi) {
    const searchedIdList = users.map(item => item.id);
    const aliasList = userApi.getAlias();

    $.each(aliasList, (key, value) => {
        const user = {
            id: key,
            alias: value,
        };
        if (!user.alias) {
            return;
        }
        const range = searchStrRange(user.alias, keyword);
        if (!range) {
            return;
        }
        const existed = searchedIdList.indexOf(user.id) >= 0;
        if (existed) {
            return;
        }
        userApi.get(user.id, (errorCode, userInfo) => {
            if (errorCode) {
                console.warn(`userApi.get failed:${errorCode}, userid:${userInfo.id}`);
                return;
            }
            users.push($.extend({ aliasRange: range }, userInfo));
        });
    });
}
