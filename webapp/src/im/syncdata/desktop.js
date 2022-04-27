/* eslint-disable no-param-reassign */
import Database from '../Database';
import system from '../system';
import config from '../config';

/**
 * 依赖 RongIM config server 地址 ajax 请求单独实现
 */
const { noop } = $;
const SUCCESS_CODE = 10000;

function getFullURL(path) {
    return config.dataModel.server + path;
}

function ajax(options) {
    options = $.extend({
        method: 'get',
        onanswer: noop,
        onsuccess: noop,
        onerror: noop,
    }, options);

    const onerror = options.onerror;
    const url = getFullURL(options.url);
    const xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function onreadystatechange() {
        if (xhr.readyState === 2) {
            options.onanswer();
        }
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                let response = xhr.response;
                try {
                    console.time(`[JSON.parse][${options.url}]`);
                    response = JSON.parse(response);
                    console.timeEnd(`[JSON.parse][${options.url}]`);
                } catch (e) {
                    onerror('response-body-parsed-error', e);
                    return;
                }
                if (response.code === SUCCESS_CODE) {
                    options.onsuccess(response.result);
                } else {
                    onerror(response.code || 'network-error', response.result);
                }
            } else {
                onerror('network-error', xhr.status);
            }
        }
    };
    xhr.ontimeout = function ontimeout() {
        onerror('timeout');
    };
    xhr.open(options.method, url);
    if (options.method.toLowerCase() !== 'get') {
        xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
    }
    let data = options.data;
    data = JSON.stringify(data);
    xhr.withCredentials = true;
    xhr.send(data);
}

function request(url, method, data, callback) {
    if (typeof data === 'function') {
        callback = data;
        data = null;
    }
    ajax({
        url,
        method,
        data,
        onsuccess(result) {
            callback(null, result);
        },
        onerror(error, msg) {
            callback(error, msg);
        },
    });
}

const sliceSize = 10000;
/**
 * 分批处理数据，仅返回成功或错误信息并不返回具体结果
 * @param {Function} handle 处理数据的函数
 * @param {Array} dataset 需要分批处理的数据
 * @param {Function} callback 处理完成回调
 */
function sliceHandle(handle, dataset, callback) {
    const arr = [];
    let length = dataset.length;
    while (length > 0) {
        arr.push(dataset.splice(0, sliceSize));
        length = dataset.length;
    }
    const promiseList = [];
    arr.forEach((item) => {
        const defer = $.Deferred();
        handle(item, (error, result) => {
            if (error) {
                defer.reject(error);
                return;
            }
            defer.resolve(result);
        });
        promiseList.push(defer.promise());
    });
    $.when.apply(null, promiseList).then(() => {
        callback(null);
    }, (error) => {
        callback(error);
    });
}

/**
 * @param {Function} callback
 * @param {Function} onprogress
 * @param {*} db Sqlite 数据库实例
 * @param {String} url 后台接口地址
 * @param {String} tag 日志标签
 * @param {Function} parser 数据分析函数
 */
function syncMethod(callback, onprogress, db, url, tag, parser) {
    onprogress = onprogress || noop;
    callback = callback || noop;

    db.getVersion((error, version) => {
        if (error) {
            system.appLogger('error', `[PACKAGE.VERSION]${JSON.stringify(error)}`);
            callback(error);
            return;
        }
        let startTime = Date.now();
        console.time(`${tag}[获取]`);
        ajax({
            url: url + version,
            onanswer() {
                onprogress(0.1);
            },
            onsuccess(result) {
                console.timeEnd(`${tag}[获取]`);
                system.appLogger('info', `${tag}[获取]${Date.now() - startTime}ms`);
                onprogress(0.6);

                // 数据解析，获取数据版本、要清理的数据、要插入的数据
                startTime = Date.now();
                console.time(`${tag}[解析]`);
                const data = parser(result, version);
                console.timeEnd(`${tag}[解析]`);
                system.appLogger('info', `${tag}[解析]${Date.now() - startTime}ms`);

                // 清理原始过期数据
                console.time(`${tag}[清理]`);
                startTime = Date.now();
                sliceHandle(db.removeBatch || db.remove, data.removeIdList, () => {
                    console.timeEnd(`${tag}[清理]`);
                    system.appLogger('info', `${tag}[清理]${Date.now() - startTime}ms`);

                    // 插入新数据
                    startTime = Date.now();
                    console.time(`${tag}[插入]`);
                    sliceHandle(db.insertOrReplace || db.insert, data.insertList, (err) => {
                        console.timeEnd(`${tag}[插入]`);
                        system.appLogger('info', `${tag}[插入]${Date.now() - startTime}ms`);
                        if (err) {
                            system.appLogger('error', `${tag}[插入]${JSON.stringify(err)}`);
                            callback(err);
                            return;
                        }
                        db.updateVersion(data.version);
                        onprogress(1);
                        callback(null);
                    });
                });
            },
            onerror(errorCode) {
                system.appLogger('error', `${tag}[获取]${JSON.stringify(errorCode)}`);
                callback(errorCode);
            },
        });
    });
}


function syncCompany(callback, onprogress) {
    syncMethod(callback, onprogress, Database.company, '/companies/diff/', '[公司信息]', (result) => {
        const dataset = result.data || [];
        const insertList = [];
        const removeIdList = [];
        dataset.forEach((item) => {
            const isRemove = item.state === 2;
            if (isRemove) {
                removeIdList.push(item.id);
            } else {
                insertList.push(item);
            }
        });
        return {
            version: result.timestamp,
            insertList,
            removeIdList,
        };
    });
}

function syncDepartment(callback, onprogress) {
    syncMethod(callback, onprogress, Database.department, '/departments/diff/', '[部门信息]', (result) => {
        const dataset = result.data || [];
        const insertList = [];
        const removeIdList = [];
        dataset.forEach((item) => {
            const isRemove = item.state === 2;
            if (isRemove) {
                removeIdList.push(item.id);
            } else {
                insertList.push(item);
            }
        });
        return {
            version: result.timestamp,
            insertList,
            removeIdList,
        };
    });
}

function syncOrganization(callback, onprogress) {
    syncMethod(callback, onprogress, Database.organization, '/organization/diff/', '[组织机构关系]', (result, version) => {
        let dataset = result.data || [];
        const insertList = [];
        dataset.forEach((item) => {
            if (item.member_state !== 2) {
                insertList.push(item);
            }
        });
        if (version === 0) {
            dataset = [];
        }
        return {
            version: result.timestamp,
            insertList,
            removeIdList: dataset,
        };
    });
}

// function syncStaff(callback, onprogress) {
//     syncMethod(callback, onprogress, Database.staff, '/staffs/diff/', '[员工信息]', result => ({
//         version: result.timestamp,
//         insertList: result.data || [],
//         removeIdList: [],
//     }));
// }

function syncStaffById(id, callback) {
    callback = callback || noop;
    request(`/staffs/${id}`, 'get', (error, result) => {
        if (error) {
            callback(error, result);
            return;
        }
        Database.staff.update([result], (err) => {
            if (err) {
                callback(err);
                return;
            }
            callback(null, result);
        });
    });
}

function syncUserBatchById(idList, callback) {
    callback = callback || noop;
    request('/staffs/batch', 'post', {
        ids: idList,
    }, (error, result) => {
        if (error) {
            callback(error, result);
            return;
        }
        const userList = result.data;
        // 员工不更新 state 状态，通过 diff 接口同步
        userList.forEach((item) => {
            const isStaff = item.user_type === 0;
            if (isStaff) {
                delete item.state;
            }
        });
        Database.staff.insertOrReplace(userList, (err) => {
            if (err) {
                callback(err);
                return;
            }
            callback(null, userList);
        });
        // Database.staff.update(userList, (err) => {
        //     if (err) {
        //         callback(err);
        //         return;
        //     }
        //     callback(null, userList);
        // });
    });
}

function syncOfficialaccount(callback, onprogress) {
    onprogress = onprogress || noop;
    callback = callback || noop;

    const db = Database.officialAccount;
    const url = '/apps/subscriptions/apps?menu=1&update_dt=';
    db.getVersion((error, version) => {
        if (error) {
            callback(error);
            return;
        }
        ajax({
            url: url + version,
            onanswer() {
                onprogress(0.1);
            },
            onsuccess(result) {
                onprogress(0.6);
                const newVersion = result.update_dt;
                const dataset = result.apps || [];
                db.insertOrReplace(dataset, (err) => {
                    if (err) {
                        callback(err);
                        return;
                    }
                    db.updateVersion(newVersion);
                    onprogress(1);
                    callback(null);
                });
            },
            onerror(errorCode) {
                // 无数据更新时返回 11714
                if (errorCode === 11714) {
                    callback(null);
                    return;
                }
                callback(errorCode);
            },
        });
    });
}

/**
 * 串行同步
 */
function serialSyncHandle(list, callback, onchange, index) {
    if (list.length === 0) {
        callback(null);
        return;
    }
    list.shift()((error) => {
        if (error) {
            callback(error);
            return;
        }
        serialSyncHandle(list, callback, onchange, (index || 0) + 1);
    }, (p) => {
        onchange(index || 0, p);
    });
}

/**
 * 并行同步
 */
function parallelSyncHandle(list, callback, onchange) {
    const promiseList = list.map((handle, index) => {
        const defer = $.Deferred();
        handle((error) => {
            if (error) {
                defer.reject(error);
                return;
            }
            defer.resolve();
        }, (p) => {
            onchange(index, p);
        });
        return defer.promise();
    });
    $.when.apply(null, promiseList).then(() => {
        callback(null);
    }, (error) => {
        callback(error);
    });
}

// 同步方式，默认使用串行同步
const syncHandle = [serialSyncHandle, parallelSyncHandle][0];

function syncAllOrgs(callback) {
    syncHandle([syncCompany, syncDepartment, syncOrganization], callback, $.noop);
}


/**
 * 数据同步
 * @param {boolean} isStaff 是否为内部联系人
 * @param {function} callback 同步成功 or 错误回调
 * @param {function} onprogress 同步进度回调
 */
function syncAll(isStaff, callback, onprogress) {
    onprogress = onprogress || noop;
    callback = callback || noop;

    let syncHandleList = [];
    if (isStaff) {
        syncHandleList = syncHandleList.concat([
            syncCompany,
            syncDepartment,
            syncOrganization,
            // syncStaff,
        ]);
    }
    if (syncHandleList.length === 0) {
        onprogress(1);
        callback(null);
        return;
    }
    const progressList = new Array(syncHandleList.length);
    syncHandle(syncHandleList, callback, (index, progress) => {
        progressList[index] = progress;
        const total = progressList.reduce((a, b) => a + b);
        onprogress(total / progressList.length);
    });
}

function syncBatchGroupById(groupIdList, callback) {
    callback = callback || noop;
    ajax({
        url: '/groups/batch',
        method: 'post',
        data: {
            ids: groupIdList,
        },
        onsuccess(groupList) {
            Database.group.insertOrReplace(groupList, (error) => {
                if (error) {
                    console.error(error);
                }
                callback(null, groupList);
            });
        },
        onerror(error) {
            callback(error);
        },
    });
}
function syncGroupById(groupId, callback) {
    callback = callback || noop;
    syncBatchGroupById([groupId], (error, groupList) => {
        if (error) {
            callback(error);
            return;
        }
        const group = groupList ? groupList[0] : {};
        syncGroupMemberById(groupId, (err, members) => {
            if (err) {
                callback(err);
                return;
            }
            group.members = members;
            callback(null, group);
        });
    });
}
function syncGroupMemberById(groupId, callback) {
    callback = callback || noop;
    ajax({
        url: `/groups/${groupId}/members`,
        method: 'get',
        onsuccess(result) {
            const members = result.data;
            Database.groupMember.insertOrReplace(groupId, members, (error) => {
                if (error) {
                    console.error(error);
                }
                callback(null, members);
            });
        },
        onerror(error) {
            callback(error);
        },
    });
}
function distinct(arr) {
    const result = [];
    const obj = {};
    arr.forEach((item) => {
        if (!obj[item]) {
            result.push(item);
            obj[item] = true;
        }
    });
    return result;
}
function syncDepartmentBranchStaff(departmentIdList, callback) {
    callback = callback || noop;
    const promiseList = [];
    departmentIdList.forEach((id) => {
        const defer = $.Deferred();
        request(`/organization/${id}/members`, 'get', (error, members) => {
            if (error) {
                defer.reject(error);
            } else {
                const idList = members.data.map(item => item.id);
                defer.resolve(idList);
            }
        });
        promiseList.push(defer.promise());
    });
    $.when(...promiseList).done((...arg) => {
        let userIdList = [].concat(...arg);
        userIdList = distinct(userIdList);
        syncUserBatchById(userIdList, callback);
    }).fail((error) => {
        callback(error);
    });
}

export default {
    all: syncAll,
    allOrgs: syncAllOrgs,
    company: syncCompany,
    department: syncDepartment,
    organization: syncOrganization,
    // staff: syncStaff,
    staffById: syncStaffById,
    userBatchById: syncUserBatchById,
    groupBatchById: syncBatchGroupById,
    groupById: syncGroupById,
    groupMemberById: syncGroupMemberById,
    officialAccount: syncOfficialaccount,
    departmentBranchStaff: syncDepartmentBranchStaff,
};
