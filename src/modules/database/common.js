const db = require('./sqlite.render');
const TableVersion = require('./table-version');

function upgrade(tablename, tableversion, upgradeSql, callback) {
    TableVersion.get(tablename, (error, v) => {
        if (error) {
            callback(error);
            return;
        }
        if (tableversion === v) {
            callback(null);
            return;
        }
        if (!v) {
            TableVersion.set(tablename, tableversion);
            callback(null);
            return;
        }
        const sql = upgradeSql.slice(v - 1).join('');
        db.exec(sql, (err) => {
            if (err) {
                callback(err);
                return;
            }
            TableVersion.set(tablename, tableversion);
            callback(null);
        });
    });
}

module.exports = {
    upgrade,
};
