const db = require('./sqlite.render');
const tableVersion = require('./table-version');
const tableUpdateTime = require('./table-update-time');
const company = require('./company');
const department = require('./department');
const organization = require('./organization');
const staff = require('./staff');
const group = require('./group');
const groupMember = require('./group_member');
const officialAccount = require('./official_account');

function noop() {}

function init(appkey, userId, handle) {
    const callback = handle || noop;
    db.init(appkey, userId, (error) => {
        if (error) {
            callback(error);
            return;
        }
        const createTableList = [];
        [
            tableVersion,
            tableUpdateTime,
            company,
            department,
            organization,
            staff,
            group,
            groupMember,
            officialAccount,
        ].forEach((item) => {
            if (typeof item.createTable !== 'function') {
                return;
            }
            const p = new Promise((resolve, reject) => {
                item.createTable((err) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve();
                });
            });
            createTableList.push(p);
        });
        Promise.all(createTableList)
            .then(() => {
                const upgradeList = [];
                [
                    company,
                    department,
                    organization,
                    staff,
                    group,
                    groupMember,
                    officialAccount,
                ].forEach((item) => {
                    if (typeof item.upgrade !== 'function') {
                        return;
                    }
                    const p = new Promise((resolve, reject) => {
                        item.upgrade((err) => {
                            if (err) {
                                reject(err);
                                return;
                            }
                            resolve();
                        });
                    });
                    upgradeList.push(p);
                });
                return Promise.all(upgradeList);
            }).then(() => {
                callback();
            }).catch((err) => {
                callback(err);
            });
    });
}

module.exports = {
    init,
    close: db.close,
    clean: db.clean,
    existsSync: db.existsSync,
    company,
    department,
    organization,
    staff,
    group,
    groupMember,
    officialAccount,
};
