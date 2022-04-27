const { Sqlstring, formatStr } = require('./utils');
const db = require('./sqlite.render');

const tablename = 'table_update_time';
const tableschema = {
    table_name: 'TEXT NOT NULL UNIQUE',
    update_time: 'INTEGER',
};

function noop() {}

function createTable(callback) {
    db.exec(Sqlstring.createTable(tablename, tableschema), callback || noop);
}

function update(data, callback) {
    const sql = Sqlstring.insertOrReplace(tablename, tableschema, data);
    db.exec(sql, callback || noop);
}

function get(table_name, callback) {
    const sql = formatStr('select * from {tablename} where table_name = \'{table_name}\'', {
        tablename,
        table_name,
    });
    db.get(sql, (error, row) => {
        const updateTime = row ? row.update_time : 0;
        if (callback) {
            callback(error, updateTime);
        }
    });
}

module.exports = {
    createTable,
    get,
    update,
};
