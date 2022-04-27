const {
    Sqlstring,
    formatStr,
    hanyuToPinyin,
    getRange,
} = require('./utils');
const db = require('./sqlite.render');
const groupMember = require('./group_member');
const common = require('./common');

const tablename = 'groups';
const tableschema = {
    id: 'TEXT NOT NULL UNIQUE',
    name: 'TEXT',
    name_keyword_initial: 'TEXT',
    name_keyword_full: 'TEXT',
    portrait_url: 'TEXT',
    type: 'INTEGER', // 0:自建群 1:企业群
    creator_id: 'TEXT',
    member_count: 'INTEGER',
    max_count: 'INTEGER',
    manager_id: 'TEXT',
    organization_id: 'TEXT',
    update_dt: 'INTEGER',
    need_join_permit: 'INTEGER', // 加群是否需要审批 0：否；1：是；
    is_all_mute: 'INTEGER', // 该群是否开启全员禁言，0: 未开启, 1: 已开启
    group_status: 'INTEGER', // 0：正常状态；2：已删除状态
    invite_member: 'INTEGER', // 具有邀请成员的权限 1：群主；3：群主、管理员；7：所有；
    publish_group_notice: 'INTEGER', // 具有发布公告的权限
    view_chat_history: 'INTEGER', // 允许新成员可查看历史消息
};
const tableversion = 1;
const upgradeSql = [];

function upgrade(callback) {
    common.upgrade(tablename, tableversion, upgradeSql, callback);
}

function createTable(callback) {
    let sql = Sqlstring.createTable(tablename, tableschema);
    sql += 'create index if not exists idx_group_id on groups(id);';
    db.exec(sql, callback);
}

function getPinyinFull(keyword) {
    const arr = [];
    let lastIndex = 0;
    // TODO: 算法性能问题，for..or 太重了
    /* eslint-disable-next-line */
    for (const char of keyword) {
        const index = keyword.indexOf(char, lastIndex);
        lastIndex = index + 1;
        const result = keyword.substr(index);
        arr.push(hanyuToPinyin(result).map(item => `$${item}|`).join(''));
    }
    return arr.join('');
}

function insertOrReplace(groupList, callback) {
    let sql = '';
    const promiseList = groupList.map((group) => {
        const groupName = group.name;
        const initial = hanyuToPinyin(groupName, 'firstLetter').map(item => `${item}|`).join('');
        const full = getPinyinFull(groupName);
        group.name_keyword_initial = initial;
        group.name_keyword_full = full;
        sql += Sqlstring.insertOrReplace(tablename, tableschema, group);
        const promise = new Promise(((resolve, reject) => {
            groupMember.insertOrReplace(group.id, group.members, (error) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve();
            });
        }));
        return promise;
    });
    Promise.all(promiseList).then(() => {
        db.exec(sql, callback);
    }, (error) => {
        callback(error);
    });
}

function get(id, callback) {
    let sql = 'select * from {tablename} where id = {id}';
    sql = formatStr(sql, {
        tablename,
        id: Sqlstring.parseStr(id),
    });
    db.get(sql, (error, group) => {
        if (error) {
            callback(error);
            return;
        }
        groupMember.get(id, (err, members) => {
            if (err) {
                callback(err);
                return;
            }
            group.members = members;
            callback(null, group);
        });
    });
}

function batch(idList, callback) {
    let sql = 'select * from {tablename} where id in ({ids})';
    const idListStr = idList.map(id => Sqlstring.parseStr(id)).join(',');
    sql = formatStr(sql, {
        tablename,
        ids: idListStr,
    });
    db.all(sql, (error, groupList) => {
        if (error) {
            callback(error);
            return;
        }
        getMembers(groupList, callback);
    });
}

function getMembers(groupList, callback) {
    const promiseList = [];
    groupList.forEach((group) => {
        const promise = new Promise(((resolve, reject) => {
            groupMember.get(group.id, (error, members) => {
                if (error) {
                    reject(error);
                    return;
                }
                group.members = members;
                resolve(members);
            });
        }));
        promiseList.push(promise);
    });
    Promise.all(promiseList).then(() => {
        callback(null, groupList);
    }, (error) => {
        callback(error);
    });
}

function search(keyword, callback) {
    const sql = Sqlstring.searchByName(tablename, keyword);
    db.all(sql, (error, groupList) => {
        if (error) {
            callback(error);
            return;
        }
        groupList.forEach((group) => {
            group.range = getRange(group.name, group.name_keyword_initial, keyword);
        });
        callback(null, groupList);
    });
}

module.exports = {
    upgrade,
    createTable,
    insertOrReplace,
    get,
    batch,
    search,
};
