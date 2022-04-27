const {
    formatStr,
    Sqlstring,
} = require('./utils');
const db = require('./sqlite.render');
const tableUpdateTime = require('./table-update-time');
const common = require('./common');

const tablename = 'official_account_info';
const tableschema = {
    id: 'TEXT NOT NULL UNIQUE',
    type: 'INTEGER NOT NULL',
    name: 'TEXT NOT NULL',
    name_keyword_initial: 'TEXT',
    name_keyword_full: 'TEXT',
    logo_url: 'TEXT',
    state: 'INTEGER',
    description: 'TEXT',
    create_date: 'INTEGER',
    update_date: 'INTEGER',
    menu_config: 'TEXT',
    home_page_url: 'TEXT',
    // menu_enable: 'Boolean DEFAULT true',
    // input_enable: 'Boolean DEFAULT true'
};
const tableversion = 1;
const upgradeSql = [];

function upgrade(callback) {
    common.upgrade(tablename, tableversion, upgradeSql, callback);
}

function createTable(callback) {
    let sql = Sqlstring.createTable(tablename, tableschema);
    sql += 'create index if not exists idx_account_id on official_account_info(id);';
    db.exec(sql, callback);
}

function insertOrReplace(dataset, callback) {
    let sql = dataset.map((item) => {
        // item.menu_enabled = item.menu.menu_enabled;
        // item.input_enabled = item.menu.input_enabled;
        // eslint-disable-next-line no-param-reassign
        item.menu_config = JSON.stringify(item.menu);
        return Sqlstring.insertOrReplace(tablename, tableschema, item);
    }).join(';');
    sql = `begin;${sql}commit;`;
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

function batch(idList, callback) {
    const ids = idList.map(item => Sqlstring.parseStr(item)).join(',');
    let sql = 'select * from {tablename} where id in ({ids})';
    sql = formatStr(sql, {
        tablename,
        ids,
    });
    db.all(sql, callback);
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
    get,
    batch,
    getVersion,
    updateVersion,
};
