const { ipcRenderer } = require('electron');

const db = {};
(() => {
    function callSync(method, ...args) {
        let callback = function noop() {};
        if (typeof args[args.length - 1] === 'function') {
            callback = args.pop();
        }
        ipcRenderer.invoke('SQLITE_ASYNC', method, ...args).then((result) => {
            callback(null, result);
        }, (error) => {
            callback(error);
        });
    }
    [
        'init',
        'exec',
        'all',
        'get',
        'prepare',
        'close',
        'clean',
    ].forEach((method) => {
        db[method] = callSync.bind(db, method);
    });
})();

(() => {
    function callSync(method, ...args) {
        const result = ipcRenderer.sendSync('SQLITE_SYNC', method, ...args);
        if (result.error) {
            throw result.error;
        }
        return result.value;
    }
    [
        'existsSync',
    ].forEach((method) => {
        db[method] = callSync.bind(db, method);
    });
})();

module.exports = db;
