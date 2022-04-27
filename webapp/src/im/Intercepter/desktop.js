import Database from '../Database';
import syncdata from '../syncdata';

let intercepts = [
// {
//     method: 'get',
//     path: '/staffs',
//     handle(params, callback) {
//         const dutyName = decodeURIComponent(params.query.duty_name);
//         Database.staff.getByDutyname(dutyName, (error, userList) => {
//             callback(error, {
//                 data: userList,
//             });
//         });
//     },
// },
    {
        method: 'post',
        path: '/staffs/batch',
        handle(params, callback) {
            const ids = params.data.ids;
            Database.staff.batch(ids, (error, userList) => {
                const resultIdList = userList.map(user => user.id);
                const unexists = ids.filter(id => resultIdList.indexOf(id) === -1);
                if (unexists.length === 0) {
                    callback(error, {
                        data: userList,
                    });
                    return;
                }
                // 外部联系人、第三方应用信息 /staffs/diff 接口不返回重新从 server 获取并存储到 staffs 表
                syncdata.userBatchById(unexists, (err) => {
                    if (err) {
                        callback(err, {
                            data: userList,
                        });
                        return;
                    }
                    Database.staff.batch(unexists, (e, unexistsUserList) => {
                        callback(e, {
                            data: userList.concat(unexistsUserList),
                        });
                    });
                });
            });
        },
    }, {
        method: 'get',
        path: '/staffs/{id}',
        handle(params, callback) {
            const staffId = params.params.id;
            Database.staff.get(staffId, (error, staff) => {
                if (!staff || (Array.isArray(staff) && staff.length === 0)) { // zzh:空数组视为异常，不走callback
                    syncdata.staffById(staffId, callback);
                } else {
                    callback(error, staff);
                }
                // if (staff) {
                //     callback(error, staff);
                //     return;
                // }
                // syncdata.staffById(staffId, callback);
            });
        },
    },
    // {
    //     method: 'post',
    //     path: '/staffs/search',
    //     handle(params, callback) {
    //         const data = params.data;
    //         const keyword = data.keywords[0];
    //         // 0: 根据姓名搜索,默认0 1:根据工号搜索 2:根据手机号搜索,暂不支持 3:根据邮箱搜索,暂不支持
    //         const type = data.type;
    //         if (type === 1) {
    //             Database.staff.searchByStaffNo(keyword, (error, userList) => {
    //                 callback(error, userList);
    //             });
    //         } else {
    //             Database.staff.search(keyword, (error, userList) => {
    //                 callback(error, userList);
    //             });
    //         }
    //     },
    // },
    // {
    //     method: 'post',
    //     path: '/staffs/search/mobile',
    //     handle(params, callback) {
    //         const keyword = params.data.keywords[0];
    //         Database.staff.searchByMobile(keyword, params.data.partial_match, (error, userList) => {
    //             callback(error, userList);
    //         });
    //     },
    // },
    // {
    //     method: 'post',
    //     path: '/staffs/search/email',
    //     handle(params, callback) {
    //         const keyword = params.data.keywords[0];
    //         Database.staff.searchByEmail(keyword, (error, userList) => {
    //             callback(error, userList);
    //         });
    //     },
    // },
    // {
    //     method: 'post',
    //     path: '/misc/duty/search',
    //     handle(params, callback) {
    //         const keyword = params.data.keywords[0];
    //         Database.staff.dutySearch(keyword, (error, list) => {
    //             callback(error, list);
    //         });
    //     },
    // },
    {
        method: 'get',
        path: '/organization',
        handle(params, callback) {
            const type = params.query.type;
            Database.organization.getByType(type, (error, list) => {
                callback(error, {
                    data: list,
                });
            });
        },
    }, {
        method: 'get',
        path: '/organization/root',
        handle(params, callback) {
            Database.organization.root((error, list) => {
                callback(error, {
                    data: list,
                });
            });
        },
    }, {
        method: 'get',
        path: '/organization/{id}/members',
        handle(params, callback) {
            Database.organization.getMembers(params.params.id, (error, list) => {
                callback(error, {
                    data: list,
                });
            });
        },
    }, {
        method: 'get',
        path: '/organization/{id}/all_members',
        handle(params, callback) {
            const id = params.params.id;
            const type = params.query.type;
            // const inCompany = params.query.relation_type === 'inCompany';
            Database.organization.getAllMembers(id, type, (error, list) => {
                callback(error, {
                    data: list,
                });
            });
        },
    }, {
        method: 'get',
        path: '/companies/{id}',
        handle(params, callback) {
            const id = params.params.id;
            Database.company.get(id, callback);
        },
    }, {
        method: 'post',
        path: '/companies/batch',
        handle(params, callback) {
            const idList = params.data.ids;
            Database.company.batch(idList, (error, list) => {
                callback(error, {
                    data: list,
                });
            });
        },
    }, {
        method: 'get',
        path: '/companies/diff/0',
        handle(params, callback) {
            Database.company.getAll((error, list) => {
                callback(error, {
                    data: list,
                });
            });
        },
    },
    {
        method: 'post',
        path: '/companies/search',
        handle(params, callback) {
            const keyword = params.data.keywords[0];
            Database.company.search(keyword, (error, list) => {
                callback(error, list);
            });
        },
    },
    {
        method: 'get',
        path: '/departments/{id}',
        handle(params, callback) {
            const id = params.params.id;
            Database.department.get(id, callback);
        },
    }, {
        method: 'get',
        path: '/departments/{id}/branches',
        handle(params, callback) {
            const id = params.params.id;
            Database.department.branches(id, (error, list) => {
                callback(error, {
                    data: list,
                });
            });
        },
    },
    {
        method: 'post',
        path: '/departments/search',
        handle(params, callback) {
            const keyword = params.data.keywords[0];
            Database.department.search(keyword, (error, list) => {
                callback(error, list);
            });
        },
    }];

function getGroup(idList, callback) {
    Database.group.batch(idList, (error, groupList) => {
        if (error) {
            callback(error);
            return;
        }
        // 去除未获取到的 group 剩下未获取到的从 server 获取并存储
        groupList.forEach((group) => {
            const index = idList.indexOf(group.id);
            if (index >= 0) {
                idList.splice(index, 1);
            }
        });
        if (idList.length === 0) {
            callback(null, groupList);
            return;
        }
        syncdata.groupBatchById(idList, (err, unexistGroupList) => {
            if (err) {
                callback(err);
                return;
            }
            callback(null, unexistGroupList.concat(groupList));
        });
        // syncdata.groupById(idList, (err, unexistGroupList) => {
        //     if (err) {
        //         callback(err);
        //         return;
        //     }
        //     callback(null, unexistGroupList.concat(groupList));
        // });
    });
}

const groupIntercept = [
    {
        method: 'post',
        path: '/groups/batch',
        handle(params, callback) {
            const idList = params.data.ids;
            getGroup(idList, callback);
        },
    },
    {
        method: 'get',
        path: '/groups/receivers',
        pass: true,
    },
    {
        method: 'get',
        path: '/groups/receiver_unread',
        pass: true,
    },
    {
        method: 'get',
        path: '/groups/{id}',
        handle(params, callback) {
            const id = params.params.id;
            getGroup([id], (error, groupList) => {
                const group = groupList ? groupList[0] : null;
                callback(error, group);
            });
        },
    },
    {
        mehtod: 'get',
        path: '/groups/{id}/members',
        handle(params, callback) {
            const id = params.params.id;
            Database.groupMember.getMembers(id, (error, members) => {
                // 新增成员数据未同步时，获取不到成员信息，根据 id 同步用户信息
                const notHaveInfo = members.filter((item) => {
                    const unexists = !item.name;
                    return unexists;
                });
                if (notHaveInfo.length === 0) {
                    callback(error, {
                        data: members,
                    });
                    return;
                }
                const idList = notHaveInfo.map(item => item.id);
                syncdata.userBatchById(idList, (err, userList) => {
                    if (err) {
                        callback(err, {
                            data: members,
                        });
                        return;
                    }
                    const tmpMap = {};
                    userList.forEach((item) => {
                        tmpMap[item.id] = item;
                    });
                    notHaveInfo.forEach((member) => {
                        const item = tmpMap[member.id] || {
                            id: member.id,
                        };
                        /* eslint-disable no-param-reassign */
                        member.name = item.name;
                        member.state = item.state;
                        member.user_type = item.user_type;
                        /* eslint-enable no-param-reassign */
                    });
                    callback(err, {
                        data: members,
                    });
                });
            });
        },
    },
    // {
    //     method: 'post',
    //     path: '/groups/batch/members',
    //     handle(params, callback) {
    //         const idList = params.data.ids;
    //         Database.groupMember.batch(idList, callback);
    //     },
    // },
    // {
    //     method: 'post',
    //     path: '/groups/search',
    //     handle: function (params, callback) {
    //         var keyword = params.data.keywords[0];
    //         Database.group.search(keyword, callback);
    //     }
    // }
];

intercepts = intercepts.concat(groupIntercept);

export default {
    find(method, path) {
        for (let i = 0, length = intercepts.length; i < length; i += 1) {
            const item = intercepts[i];
            const methodSame = (item.method || 'get').toLowerCase() === method.toLowerCase();
            const reg = new RegExp(`^${item.path.replace(/{\w+}/g, '([a-zA-Z0-9\\_\\-]+)')}(?:[?]|$)`);
            const pathSame = reg.test(path);
            if (methodSame && pathSame) {
                if (item.pass) {
                    break;
                }
                return item;
            }
        }
        return null;
    },
    parseUrl(rule, url) {
        const reg = new RegExp(`^${rule.replace(/{\w+}/g, '([a-zA-Z0-9\\_\\-]+)')}(?:[?]|$)`);
        const pathSame = reg.test(url);
        if (!pathSame) {
            return null;
        }
        // 获取 url 参数
        const params = {};
        let paramsKey = rule.match(/{\w+}/g);
        if (paramsKey) {
            paramsKey = paramsKey.map(str => str.substring(1, str.length - 1));
            const paramsValue = reg.exec(url);
            paramsKey.forEach((key, index) => {
                params[key] = paramsValue[index + 1];
            });
        }
        const query = {};
        // 获取 query 参数
        const queryStr = url.split('?')[1];
        if (queryStr) {
            const queryList = queryStr.split('&');
            queryList.forEach((item) => {
                const queryItem = item.split('=');
                const key = queryItem[0];
                query[key] = queryItem[1];
            });
        }
        return {
            query,
            params,
        };
    },
};
