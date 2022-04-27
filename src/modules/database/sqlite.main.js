const { app, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('./sqlite3').verbose();

const dbFileName = 'sqlcipher_5.0';
const basePath = path.join(app.getPath('userData'), 'storage');
let instance = null;
function noop() {}

function mkdir(targetPath) {
    const parent = path.join(targetPath, '..');
    if (!fs.existsSync(parent)) {
        mkdir(parent);
    }
    if (!fs.existsSync(targetPath)) {
        fs.mkdirSync(targetPath);
    }
}

function init(appkey, userId, callback) {
    close();
    const dbFileDir = path.join(basePath, appkey, userId);
    mkdir(dbFileDir);
    const dbFilePath = path.join(dbFileDir, dbFileName);
    try {
        instance = new sqlite3.Database(dbFilePath);
    } catch (error) {
        callback(error);
        return;
    }
    instance.exec(`PRAGMA key = '${[appkey, userId].join('')}'`, callback);
    // instance.serialize(() => {
    //     instance.run(`PRAGMA key = '${[appkey, userId].join('')}'`);
    //     callback(null);
    // });
}

function existsSync(appkey, userId) {
    const dbFilePath = path.join(basePath, appkey, userId, dbFileName);
    return fs.existsSync(dbFilePath);
}

function exec(sql, callback) {
    callback = callback || noop;
    if (!instance) {
        callback('Not initialized');
        return;
    }
    instance.exec(sql, callback);
}

function get(sql, params, callback) {
    callback = callback || noop;
    if (typeof params === 'function') {
        callback = params;
    }
    if (!instance) {
        callback('Not initialized');
        return;
    }
    instance.get(sql, params, callback);
}

function all(sql, params, callback) {
    callback = callback || noop;
    if (typeof params === 'function') {
        callback = params;
    }
    if (!instance) {
        callback('Not initialized');
        return;
    }
    instance.all(sql, params, callback);
}

// function serialize(callback) {
//     callback = callback || noop;
//     if (typeof params === 'function') {
//         callback = params;
//     }
//     if (!instance) {
//         callback('Not initialized');
//         return;
//     }
//     instance.serialize(callback);
// }

function prepare(sql, params, callback) {
    callback = callback || noop;
    if (typeof params === 'function') {
        callback = params;
    }
    if (!instance) {
        callback('Not initialized');
        return null;
    }
    return instance.prepare(sql, params, callback);
}

function close(callback) {
    callback = callback || noop;
    if (instance) {
        instance.close(callback);
        instance = null;
    } else {
        callback();
    }
}

function clean(appkey, userId) {
    close(() => {
        const dbFilePath = path.join(basePath, appkey, userId, dbFileName);
        fs.unlink(dbFilePath, () => {});
    });
}


const db = {
    init,
    existsSync,
    exec,
    all,
    get,
    prepare,
    close,
    clean,
    // serialize,
};

ipcMain.handle('SQLITE_ASYNC', async (event, method, ...args) => new Promise((resolve, reject) => {
    db[method](...args, (error, value) => {
        if (error) {
            reject(error);
        } else {
            resolve(value);
        }
    });
}));

ipcMain.on('SQLITE_SYNC', (event, method, ...args) => {
    try {
        event.returnValue = { value: db[method](...args) };
    } catch (error) {
        event.returnValue = { error: error.stack };
    }
});
