const { Sqlstring, noop } = require('./utils');
const db = require('./sqlite.render');

const tablename = 'table_version';
const tableschema = {
    table_name: 'TEXT NOT NULL UNIQUE',
    version: 'INTEGER CHECK(version > 0)',
};

function createTable(callback) {
    db.exec(Sqlstring.createTable(tablename, tableschema), callback || noop);
}

function get(table_name, callback) {
    const sql = `select * from ${tablename} where table_name = '${table_name}'`;
    db.get(sql, (error, row) => {
        callback(error, (row || {}).version);
    });
}

function set(table_name, version) {
    const sql = Sqlstring.insertOrReplace(tablename, tableschema, {
        table_name,
        version,
    });
    db.exec(sql);
}

module.exports = {
    createTable,
    get,
    set,
};
