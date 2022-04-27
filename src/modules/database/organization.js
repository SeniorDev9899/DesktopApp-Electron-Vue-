const { Sqlstring, formatStr } = require('./utils');
const db = require('./sqlite.render');
const tableUpdateTime = require('./table-update-time');
const common = require('./common');

const tablename = 'organization2';
const tableschema = {
    virtual_id: 'TEXT NOT NULL UNIQUE',
    parent_uid: 'TEXT',
    parent_type: 'INTEGER',
    member_uid: 'TEXT',
    member_type: 'INTEGER',
    order: 'INTEGER',
    alias: 'TEXT',
    path: 'TEXT',
    path_str: 'TEXT',
    create_dt: 'INTEGER',
    update_dt: 'INTEGER',
};
const tableversion = 1;
const upgradeSql = [];

function upgrade(callback) {
    common.upgrade(tablename, tableversion, upgradeSql, callback);
}

const orgType = {
    staff: 0,
    depart: 1,
    company: 2,
};
// parent_type member_type: 0 人员， 1 部门，2 公司
function convertType(typeStr) {
    return ['staff', 'depart', 'company'].indexOf(typeStr);
}

function createTable(callback) {
    let sql = Sqlstring.createTable(tablename, tableschema);
    sql += `create unique index if not exists idx_organization_id ON ${tablename}( member_uid,member_type,parent_uid,parent_type);`;
    sql += `create unique index if not exists idx_virtual_id on ${tablename}(virtual_id);`;
    db.exec(sql, callback);
}

function insert(dataset, callback) {
    dataset.forEach((item) => {
        const { path } = item;
        item.path = JSON.stringify(path);
        item.path_str = path.map(dic => dic.type + dic.id).join(',');
        item.virtual_id = getVirtualId(
            item.parent_uid, item.parent_type, item.member_uid, item.member_type,
        );
    });
    let sql = dataset.map(item => Sqlstring.insertOrReplace(tablename, tableschema, item)).join(';');
    sql = `begin;${sql}commit;`;
    db.exec(sql, callback);
}

function getVirtualId(parentUid, parentType, memberUid, memberType) {
    return [
        parentUid,
        parentType,
        memberUid,
        memberType,
    ].join('__');
}

function remove(dataset, callback) {
    if (dataset.length === 0) {
        callback();
        return;
    }
    const sql = `delete from ${tablename} where virtual_id in (${
        dataset.map(item => `'${getVirtualId(item.parent_uid, item.parent_type, item.member_uid, item.member_type)}'`).join(',')
    });`;
    db.exec(sql, callback);
}

function getCompanyName(idList, callback) {
    const result = {};
    let sql = 'select id,name from companies where id in ({ids})';
    const ids = idList.map(id => Sqlstring.parseStr(id)).join(',');
    sql = formatStr(sql, {
        ids,
    });
    db.all(sql, (error, deptList) => {
        if (error) {
            callback(error);
            return;
        }
        deptList.forEach((item) => {
            result[item.id] = item.name;
        });
        callback(null, result);
    });
}

function getDepartmentName(idList, callback) {
    const result = {};
    let sql = 'select id,name from departments where id in ({ids})';
    const ids = idList.map(id => Sqlstring.parseStr(id)).join(',');
    sql = formatStr(sql, {
        ids,
    });
    db.all(sql, (error, deptList) => {
        if (error) {
            callback(error);
            return;
        }
        deptList.forEach((item) => {
            result[item.id] = item.name;
        });
        callback(null, result);
    });
}

/**
 * 获取 organization path 属性中对应组织结构的名称, 并赋值
 * @param {organization} rows
 * @param {function} callback
 */
const getAndSetPath = function (rows, callback) {
    const companyIdList = [];
    const departIdList = [];
    rows.forEach((row) => {
        const path = row.path = JSON.parse(row.path);
        path.forEach((item) => {
            let list = companyIdList;
            if (item.type === orgType.depart) {
                list = departIdList;
            }
            const unexist = list.indexOf(item.id) === -1;
            if (unexist) {
                list.push(item.id);
            }
        });
    });
    getCompanyName(companyIdList, (error, companyMap) => {
        getDepartmentName(departIdList, (err, departMap) => {
            if (err) {
                callback(err);
                return;
            }
            rows.forEach((row) => {
                row.path.forEach((org) => {
                    if (org.type === orgType.depart) {
                        org.name = departMap[org.id];
                    } else {
                        org.name = companyMap[org.id];
                    }
                });
            });
            callback(error, rows);
        });
    });
};

function getByType(typeStr, callback) {
    const type = convertType(typeStr);
    let sql = 'select * from {tablename} where member_type = {type}';
    sql = formatStr(sql, {
        tablename,
        type,
    });
    db.all(sql, (error, rows) => {
        if (error) {
            callback(error);
            return;
        }
        getAndSetPath(rows, (e) => {
            if (e) {
                callback(error);
                return;
            }
            callback(null, rows);
        });
    });
}

function root(callback) {
    let sql = 'select * from {tablename} where parent_uid = \'\'';
    sql = formatStr(sql, {
        tablename,
    });
    db.all(sql, (error, rows) => {
        if (error) {
            callback(error);
            return;
        }
        getAndSetPath(rows, (e) => {
            if (e) {
                callback(error);
                return;
            }
            callback(null, rows);
        });
    });
}

/**
 * 获取直属组织架构成员
 * @param {string} id 组织架构 Id
 * @param {function} callback 回调函数
 */
function getMembers(id, callback) {
    const sql = `select  o.member_uid as id,s.name,o.member_type as type,o.parent_uid as parent_id,o.path,0 as member_count,o.[order] as [order] from 
        (select * from ${tablename} where member_type = 0) as o left join staffs as s 
        on o.member_uid = s.id 
        where parent_uid = '${id}'
    union all
    select d.id,d.name,o.member_type as type,o.parent_uid as parent_id,o.path,d.member_count,o.[order] as [order] from 
        (select * from ${tablename} where member_type = 1) as o left join departments as d
        on o.member_uid = d.id
        where parent_uid = '${id}'
    union all
    select c.id,c.name,o.member_type as type,o.parent_uid as parent_id,o.path,c.member_count,o.[order] as [order] from 
        (select * from ${tablename} where member_type = 2) as o left join companies as c 
        on o.member_uid = c.id 
        where parent_uid = '${id}'
        order by [order];`;
    db.all(sql, (error, rows) => {
        if (error) {
            callback(error);
            return;
        }
        getAndSetPath(rows, (e) => {
            if (e) {
                callback(error);
                return;
            }
            callback(null, rows);
        });
    });
}

/**
 * 获取组织架构下所有成员，返回指定 childType 类型的数据
 * @param {string} id 组织架构 Id
 * @param {string} childType 组织架构类型 0 人员， 1 部门，2 公司
 * @param {fcuntion} callback 回调函数
 */
function getAllMembers(id, childType, callback) {
    childType = convertType(childType);
    let sql = '';
    switch (childType) {
    case orgType.staff:
        sql = `select o.member_uid as id,d.name,o.member_type as type,o.parent_uid as parent_id,o.path,0 as member_count,o.[order] as [order] from (select * from ${tablename} as org where member_type = 0 and instr(org.path_str, {path}) > 0) as o left join staffs as d on o.member_uid = d.id`;
        break;
    case orgType.depart:
        sql = `select d.id,d.name,o.member_type as type,o.parent_uid as parent_id,o.path,d.member_count,o.[order] as [order] from (select * from ${tablename} as org where member_type = 1 and instr(org.path_str, {path}) > 0) as o left join departments as d on o.member_uid = d.id`;
        break;
    case orgType.company:
        sql = `select d.id,d.name,o.member_type as type,o.parent_uid as parent_id,o.path,d.member_count,o.[order] as [order] from (select * from ${tablename} as org where member_type = 2 and instr(org.path_str, {path}) > 0) as o left join companies as d on o.member_uid = d.id`;
        break;
    default:
    }
    sql = formatStr(sql, {
        path: Sqlstring.parseStr(id),
    });
    db.all(sql, (error, rows) => {
        if (error) {
            callback(error);
            return;
        }
        getAndSetPath(rows, (e) => {
            if (e) {
                callback(error);
                return;
            }
            callback(null, rows);
        });
    });
}

function getBatch(memberIdList, callback) {
    let sql = 'select * from {tablename} where member_uid in ({ids})';
    const ids = memberIdList.map(id => Sqlstring.parseStr(id)).join(',');
    sql = formatStr(sql, {
        tablename,
        ids,
    });
    db.all(sql, callback);
}

function getBatchWithOrg(memberIdList, callback) {
    getBatch(memberIdList, (error, orgList) => {
        if (error) {
            callback(error);
            return;
        }
        getAndSetPath(orgList, callback);
    });
}

function getVersion(callback) {
    tableUpdateTime.get(tablename, callback);
}

function updateVersion(version) {
    tableUpdateTime.update({
        table_name: tablename,
        update_time: version,
    });
}

module.exports = {
    upgrade,
    createTable,
    insert,
    remove,
    getByType,
    root,
    getMembers,
    getAllMembers,
    getBatch,
    getBatchWithOrg,
    getVersion,
    updateVersion,
    tablename,
};
