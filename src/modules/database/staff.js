const {
    Sqlstring,
    formatStr,
    getRange,
} = require('./utils');
const db = require('./sqlite.render');
const tableUpdateTime = require('./table-update-time');
const common = require('./common');

const company = require('./company');
const department = require('./department');
const organization = require('./organization');

const tablename = 'staffs';
const tableschema = {
    id: 'TEXT NOT NULL UNIQUE',
    name: 'TEXT',
    name_keyword_initial: 'TEXT',
    name_keyword_initial_num: 'TEXT',
    name_keyword_full: 'TEXT',
    name_keyword_full_num: 'TEXT',
    name_pinyin_full: 'TEXT',
    portrait_url: 'TEXT',
    email: 'TEXT',
    staff_no: 'TEXT',
    mobile: 'TEXT',
    tel: 'TEXT',
    company_id: 'TEXT',
    depart_id: 'TEXT',
    supervisor_id: 'TEXT',
    is_deleted: 'INTEGER',
    duty_name: 'TEXT',
    duty_keyword_initial: 'TEXT',
    duty_keyword_full: 'TEXT',
    duty_pinyin_full: 'TEXT',
    state: 'INTEGER',
    is_executive: 'INTEGER',
    user_type: 'INTEGER',
    portrait_big_url: 'TEXT',
    executive_level: 'INTEGER',
    int_p1: 'INTEGER',
    int_p2: 'INTEGER',
    vchar_p3: 'TEXT',
    extra: 'TEXT',
};
const tableversion = 2;
const upgradeSql = [
    `
    ALTER TABLE ${tablename} ADD COLUMN name_pinyin_full TEXT;
    ALTER TABLE ${tablename} ADD COLUMN duty_pinyin_full TEXT;
    `,
];

function upgrade(callback) {
    common.upgrade(tablename, tableversion, upgradeSql, callback);
}

const UserType = {
    STAFF: 0,
    VISITOR: 1,
    OTHERAPP: 2,
    ROBOT: 3,
};

function createTable(callback) {
    let sql = Sqlstring.createTable(tablename, tableschema);
    sql += 'create index if not exists idx_user_id ON staffs(id);';
    db.exec(sql, callback);
}

function insertOrReplace(dataset, callback) {
    const reg = /(^\$)|(\|.*)/g;
    let sql = dataset.map((item) => {
        const temp = {
            name_pinyin_full: (item.name_keyword_full || '').replace(reg, ''),
            duty_pinyin_full: (item.duty_keyword_full || '').replace(reg, ''),
            ...item,
        };
        return Sqlstring.insertOrReplace(tablename, tableschema, temp);
    }).join(';');
    // /staffs/diff 接口会将 superadmin 同步到本地现在不在使用 diff 接口屏蔽此段代码
    // sql += formatStr('delete from {tablename} where name = {name};', {
    //     tablename,
    //     name: Sqlstring.parseStr('superadmin'),
    // });
    sql = `begin;${sql}commit;`;
    db.exec(sql, callback);
}

function update(dataset, callback) {
    const ids = dataset.map(item => Sqlstring.parseStr(item.id)).join(',');
    let checkExistSql = 'select id from {tablename} where id in ({ids})';
    checkExistSql = formatStr(checkExistSql, {
        tablename,
        ids,
    });
    db.all(checkExistSql, (error, rows) => {
        if (error) {
            callback(error);
            return;
        }
        const sqlList = [];
        const idList = rows.map(item => item.id);
        dataset.forEach((staff) => {
            if (idList.indexOf(staff.id) === -1) {
                sqlList.push(Sqlstring.insertInto(tablename, tableschema, staff));
            } else {
                sqlList.push(Sqlstring.update(tablename, tableschema, staff, 'id'));
            }
        });
        const sql = sqlList.join('');
        db.exec(sql, callback);
    });
}

function get(id, callback) {
    let sql = 'select p.name as supervisor_name ,s.* from (select * from {tablename} where state = 0 and id = {id}) as s left join staffs as p on s.supervisor_id = p.id';
    sql = formatStr(sql, {
        tablename,
        id: Sqlstring.parseStr(id),
    });
    db.get(sql, (error, user) => {
        if (error || !user) {
            callback(error, []);
            return;
        }
        addUserOrgsInfo([user], (err) => {
            callback(err, user);
        });
    });
}

function addUserOrgsInfo(userList, callback) {
    let ids = [];
    userList.forEach((item) => {
        if (item.user_type === UserType.STAFF) {
            ids.push(Sqlstring.parseStr(item.id));
        }
    });
    ids = ids.join(',');
    const orgSql = `select member_uid,path from ${organization.tablename} where member_uid in (${ids})`;
    db.all(orgSql, (err, orgList) => {
        if (err) {
            callback(err);
            return;
        }
        const companyIdList = new Set();
        const departIdList = new Set();
        orgList.forEach((member) => {
            member.path = JSON.parse(member.path);
            member.path.forEach((item) => {
                const orgId = item.id;
                let arr = departIdList;
                if (item.type === 2) {
                    arr = companyIdList;
                }
                const exist = arr.has(orgId);
                if (exist) {
                    return;
                }
                arr.add(orgId);
            });
        });
        company.getName([...companyIdList], (error, companyMap) => {
            if (error) {
                callback(error);
                return;
            }
            department.getName([...departIdList], (e, departMap) => {
                if (e) {
                    callback(e);
                    return;
                }
                const orgsInfoMap = {};
                orgList.forEach((member) => {
                    orgsInfoMap[member.member_uid] = orgsInfoMap[member.member_uid] || [];
                    member.path.forEach((item) => {
                        if (item.type === 1) {
                            item.name = departMap[item.id];
                        } else {
                            item.name = companyMap[item.id];
                        }
                    });
                    const org = member.path.slice(-1)[0];
                    orgsInfoMap[member.member_uid].push({
                        id: org.id,
                        name: org.name,
                        type: org.type,
                        path: member.path,
                    });
                });
                userList.forEach((user) => {
                    user.orgs_info = orgsInfoMap[user.id];
                });
                callback(null, userList);
            });
        });
    });
}

function batch(idList, callback) {
    const ids = idList.map(id => Sqlstring.parseStr(id)).join(',');
    let sql = 'select id,name,mobile,portrait_url,portrait_big_url,duty_name,company_id,state,user_type,is_executive from {tablename} where id in ({ids})';
    sql = formatStr(sql, {
        tablename,
        ids,
    });
    db.all(sql, (error, userList) => {
        if (error) {
            callback(error);
            return;
        }
        addUserOrgsInfo(userList, callback);
    });
}

/**
 * 根据姓名查询用户
 * @param {object} params
 * @param {function} callback
 */
function search(keyword, callback) {
    keyword = Sqlstring.escape(keyword);
    const sql = `select id,name,portrait_url,company_id,name_keyword_initial,user_type,is_executive,state,name_pinyin_full from ${tablename} 
    where state = 0 and
    user_type = 0 and
    ( name like '%${keyword}%'
    or name_keyword_initial like '%${keyword}%'
    or name_keyword_full like '%$${keyword}%')
    order by name_pinyin_full `;
    db.all(sql, (error, userList) => {
        if (error) {
            callback(error);
            return;
        }
        addUserOrgsInfo(userList, (err, list) => {
            if (err) {
                callback(err);
                return;
            }
            list.forEach((item) => {
                item.range = getRange(item.name, item.name_keyword_initial, keyword);
            });
            callback(null, list);
        });
    });
}

function searchByStaffNo(keyword, callback) {
    keyword = Sqlstring.escape(keyword);
    const sql = `select * from ${tablename} where state = 0 and staff_no = '${keyword}'`;
    db.get(sql, (error, user) => {
        if (error || !user) {
            callback(error, []);
            return;
        }
        addUserOrgsInfo([user], callback);
    });
}

function searchByMobile(keyword, partial_match, callback) {
    keyword = Sqlstring.escape(keyword);
    let where = `mobile = '${keyword}'`;
    if (partial_match) {
        where = `mobile like '%${keyword}%'`;
    }
    const sql = `select * from ${tablename} where state = 0 and ${where}`;
    db.all(sql, (error, userList) => {
        if (error) {
            callback(error);
            return;
        }
        addUserOrgsInfo(userList, callback);
    });
}

function searchByEmail(keyword, callback) {
    keyword = Sqlstring.escape(keyword);
    const sql = `select * from ${tablename} where state = 0 and email = '${keyword}'`;
    db.all(sql, (error, userList) => {
        if (error) {
            callback(error);
            return;
        }
        addUserOrgsInfo(userList, callback);
    });
}

function getByDutyname(dutyName, callback) {
    dutyName = Sqlstring.escape(dutyName);
    const sql = `select * from ${tablename} where state = 0 and duty_name = '${dutyName}' order by name_pinyin_full`;
    db.all(sql, (error, userList) => {
        if (error) {
            callback(error);
            return;
        }
        addUserOrgsInfo(userList, callback);
    });
}

function dutySearch(tmpKeyword, callback) {
    const keyword = Sqlstring.escape(tmpKeyword);
    const sql = `select duty_name as name,count(*) as count,duty_keyword_initial,duty_keyword_full,duty_pinyin_full from ${tablename} 
    where state = 0 and
    ( duty_name like '%${keyword}%' 
    or duty_keyword_initial like '%${keyword}%'
    or duty_keyword_full like '%$${keyword}%' )
    group by duty_name
    order by duty_pinyin_full`;
    db.all(sql, (error, list) => {
        if (error) {
            callback(error);
            return;
        }
        list.forEach((item) => {
            item.range = getRange(item.name, item.duty_keyword_initial, keyword);
        });
        callback(null, list);
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
    update,
    get,
    batch,
    search,
    searchByStaffNo,
    searchByMobile,
    searchByEmail,
    getByDutyname,
    dutySearch,
    getVersion,
    updateVersion,
};
