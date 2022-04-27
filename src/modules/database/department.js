const {
    Sqlstring,
    formatStr,
    getRange,
} = require('./utils');
const db = require('./sqlite.render');
const tableUpdateTime = require('./table-update-time');
const organization = require('./organization');
const common = require('./common');

const tablename = 'departments';
const tableschema = {
    id: 'TEXT NOT NULL UNIQUE',
    parent_id: 'TEXT',
    name: 'TEXT',
    name_keyword_initial: 'TEXT',
    name_keyword_full: 'TEXT',
    full_name: 'TEXT',
    full_name_keyword_initial: 'TEXT',
    full_name_keyword_full: 'TEXT',
    name_pinyin_full: 'TEXT',
    manager_id: 'TEXT',
    company_id: 'TEXT',
    group_id: 'TEXT',
    member_count: 'INTEGER',
    int_p1: 'INTEGER',
    int_p2: 'INTEGER',
    vchar_p3: 'TEXT',
    version: 'INTEGER',
};
const tableversion = 2;
const upgradeSql = [
    `ALTER TABLE ${tablename} ADD COLUMN name_pinyin_full TEXT;`,
];

function upgrade(callback) {
    common.upgrade(tablename, tableversion, upgradeSql, callback);
}

function createTable(callback) {
    let sql = Sqlstring.createTable(tablename, tableschema);
    sql += 'create index if not exists idx_department_id ON departments(id);';
    db.exec(sql, callback);
}

// 增加名称缓存减少 path 查询时间
const cahceNames = {};

/**
 * 获取部门 id 对应部门名称
 * @param {Array} idList 部门 Id
 * @param {function} callback 回调函数
 */
function getName(idList, callback) {
    const unexistIdList = [];
    const result = [];
    idList.forEach((id) => {
        const name = cahceNames[id];
        if (name) {
            result[id] = name;
        } else {
            unexistIdList.push(id);
        }
    });
    if (unexistIdList.length > 0) {
        let sql = 'select * from {tablename} where id in ({ids})';
        const ids = unexistIdList.map(id => Sqlstring.parseStr(id)).join(',');
        sql = formatStr(sql, {
            tablename,
            ids,
        });
        db.all(sql, (error, deptList) => {
            if (error) {
                callback(error);
                return;
            }
            deptList.forEach((item) => {
                cahceNames[item.id] = item.name;
                result[item.id] = item.name;
            });
            callback(null, result);
        });
    } else {
        callback(null, result);
    }
}

function insertOrReplace(dataset, callback) {
    const reg = /(^\$)|(\|.*)/g;
    let sql = dataset.map((item) => {
        cahceNames[item.id] = item.name;
        const temp = {
            ...item,
            name_pinyin_full: item.name_keyword_full.replace(reg, ''),
        };
        return Sqlstring.insertOrReplace(tablename, tableschema, temp);
    }).join(';');
    sql = `begin;${sql}commit;`;
    db.exec(sql, callback);
}

function removeBatch(idList, callback) {
    const idListStr = idList.map(id => Sqlstring.parseStr(id)).join(',');
    let sql = 'delete from {tablename} where id in ({id})';
    sql = formatStr(sql, {
        tablename,
        id: idListStr,
    });
    db.exec(sql, callback);
}

function get(id, callback) {
    let sql = 'select * from {tablename} where id = {id}';
    sql = formatStr(sql, {
        tablename,
        id: Sqlstring.parseStr(id),
    });
    db.get(sql, callback);
}

function branches(id, callback) {
    let sql = 'select * from {tablename} where parent_id = {id}';
    sql = formatStr(sql, {
        tablename,
        id: Sqlstring.parseStr(id),
    });
    db.all(sql, callback);
}

function search(tmpKeyword, callback) {
    // let sql = Sqlstring.searchByName(tablename, keyword);
    const keyword = Sqlstring.escape(tmpKeyword);
    const sql = `select member_count as count,'${keyword}' as keyword,id,name,name_keyword_initial,name_pinyin_full from ${tablename} 
        where name like '%${keyword}%'
        or name_keyword_initial like '%${keyword}%'
        or name_keyword_full like '%$${keyword}%'
        order by name_pinyin_full`;
    db.all(sql, (error, list) => {
        if (error) {
            callback(error);
            return;
        }
        const idList = [];
        list.forEach((item) => {
            const temp = item;
            idList.push(temp.id);
            temp.range = getRange(item.name, item.name_keyword_initial, keyword);
        });
        organization.getBatchWithOrg(idList, (err, orgList) => {
            if (err) {
                callback(err);
                return;
            }
            const orgCache = {};
            orgList.forEach((org) => {
                orgCache[org.member_uid] = org.path;
            });
            list.forEach((item) => {
                // eslint-disable-next-line no-param-reassign
                item.org_path = orgCache[item.id];
            });
            callback(null, list);
        });
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
    insertOrReplace,
    removeBatch,
    get,
    branches,
    search,
    getName,
    getVersion,
    updateVersion,
};
