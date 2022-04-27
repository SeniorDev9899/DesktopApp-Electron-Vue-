const {
    Sqlstring,
    formatStr,
} = require('./utils');
const db = require('./sqlite.render');
const common = require('./common');

const tablename = 'group_members';
const tableschema = {
    id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
    group_id: 'TEXT NOT NULL',
    staff_id: 'TEXT NOT NULL',
    alias: 'TEXT NOT NULL',
    role: 'INTEGER', // 群成员角色: 1: 群主 2: 管理员 4: 普通成员
    gorder: 'INTEGER', // 排序
    mute_status: 'INTEGER', // 群成员禁言状态 0: 正常状态, 1: 禁言黑名单, 2: 禁言白名单
    create_dt: 'INTEGER', // 入群时间，群消息回执(已读/未读成员)使用
};
const tableversion = 2;
const upgradeSql = [
    `
    alter table ${tablename} add column role;
    alter table ${tablename} add column gorder;
    `,
];
// 注意：修改表结构时修改 insertOrReplace 方法，群成员做了 map

function upgrade(callback) {
    common.upgrade(tablename, tableversion, upgradeSql, callback);
}

function createTable(callback) {
    const sql = Sqlstring.createTable(tablename, tableschema);
    db.exec(sql, callback);
}

function insertOrReplace(groupId, members, callback) {
    let deleteSql = 'delete from {tablename} where group_id = {group_id};';
    deleteSql = formatStr(deleteSql, {
        tablename,
        group_id: Sqlstring.parseStr(groupId),
    });
    let insertMembers = members.map(item => ({
        group_id: groupId,
        staff_id: item.id,
        create_dt: item.create_dt,
        alias: item.alias || '',
        role: item.role,
        gorder: item.gorder,
        mute_status: item.mute_status,
    }));
    let insertSql = '';
    insertMembers.forEach((item) => {
        insertSql += Sqlstring.insertInto(tablename, tableschema, item);
    });
    insertMembers = null;
    const sql = `begin;${deleteSql}${insertSql}commit;`;
    db.exec(sql, callback);
}

function get(groupId, callback) {
    let sql = 'select staff_id as id,create_dt,alias,role,gorder,mute_status from {tablename} where group_id = {id}';
    sql = formatStr(sql, {
        tablename,
        id: Sqlstring.parseStr(groupId),
    });
    db.all(sql, (error, rows) => {
        if (!rows) {
            callback(error, []);
            return;
        }
        callback(error, rows);
    });
}

function getMembers(groupId, callback) {
    let sql = `
    select staff_id as id,name,m.alias as alias,portrait_url,role,gorder,create_dt,state,user_type,mute_status 
    from ( select staff_id,alias,role,gorder,mute_status,create_dt 
            from {tablename} 
            where group_id = {group_id} ) as m 
    left join staffs as s on m.staff_id = s.id`;
    sql = formatStr(sql, {
        tablename,
        group_id: Sqlstring.parseStr(groupId),
    });
    db.all(sql, callback);
}

function getEarliest(groupId, limit, callback) {
    let sql = `
    select gm.staff_id as id,s.name,s.portrait_url 
    from (select * from group_members where group_id = {group_id} order by id desc limit {limit}) as gm 
    left join staffs s on gm.staff_id = s.id;`;
    sql = formatStr(sql, {
        group_id: Sqlstring.parseStr(groupId),
        limit,
    });
    db.all(sql, callback);
}

/**
 * 获取群组前 9 个成员名称头像信息
 * @param {Array} groupIdList 群组Id集合
 * @param {function} callback 回调函数
 */
function batch(groupIdList, callback) {
    const promiseList = [];
    const result = [];
    groupIdList.forEach((groupId) => {
        const promise = new Promise(((resolve, reject) => {
            getEarliest(groupId, 9, (error, members) => {
                if (error) {
                    reject(error);
                    return;
                }
                const ids = members.map(item => item.id);
                result.push({
                    group_id: groupId,
                    member_ids: ids,
                    member_infos: members,
                });
                resolve();
            });
        }));
        promiseList.push(promise);
    });
    Promise.all(promiseList).then(() => {
        callback(null, result);
    }, (error) => {
        callback(error);
    });
}

module.exports = {
    upgrade,
    createTable,
    insertOrReplace,
    get,
    getMembers,
    batch,
};
