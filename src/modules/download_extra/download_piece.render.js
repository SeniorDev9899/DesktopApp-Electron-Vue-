const { remote } = require('electron');

const { app } = remote;
const { dialog } = remote;
const fs = require('fs');
const path = require('path');
const request = require('../../common/httpRequest');
const pieceCacheConfig = require('../../common/cachePath').download;
const file = require('../file/file.render');

const Utils = require('../../utils');

const downloadDir = path.join(app.getPath('userData'), 'downloadFiles');
Utils.mkDir(downloadDir);
/**
 * 文件分片最大值 单位 M
 */
const CHUNK_MAX_SIZE = 20;
/**
 * 文件分片最小值 单位 M
 */
const CHUNK_MIN_SIZE = 5;
const pieceCacheDir = pieceCacheConfig.tmpPath;

const utils = {
    mkdir: function mkdir(targetPath) {
        const parent = path.join(targetPath, '..');
        if (!fs.existsSync(parent)) {
            mkdir(parent);
        }
        if (!fs.existsSync(targetPath)) {
            fs.mkdirSync(targetPath);
        }
    },
    delDir: function delDir(targetPath) {
        if (fs.existsSync(targetPath)) {
            const files = fs.readdirSync(targetPath);
            files.forEach((fileItem) => {
                const curPath = `${targetPath}/${fileItem}`;
                if (fs.statSync(curPath).isDirectory()) {
                    delDir(curPath);
                } else {
                    fs.unlinkSync(curPath);
                }
            });
            fs.rmdirSync(targetPath);
        }
    },
    isFunction(fun) {
        return typeof fun === 'function';
    },
    extend(target, ext) {
        if (!ext) {
            return target;
        }
        Object.keys(ext).forEach((key) => {
            target[key] = ext[key];
        });
        return target;
    },
    concatFile(rangeList, dist, callback, writable) {
        if (!writable) {
            writable = fs.createWriteStream(dist);
            writable.once('error', (error) => {
                writable.end();
                // 写入失败无权限或者文件被占用，删除也会失败此方法无需调用
                // fs.unlink(dist);
                callback(error);
            });
        }
        if (rangeList.length === 0) {
            writable.end();
            callback(null, { path: dist });
            return;
        }
        // 创建可读流
        const readable = fs.createReadStream(rangeList.shift());
        // 监听 pip end 事件，读取下一个文件
        readable.once('end', () => {
            utils.concatFile(rangeList, dist, callback, writable);
        });
        readable.once('error', (error) => {
            writable.end();
            fs.unlink(dist, () => {});
            callback(error);
        });
        readable.pipe(writable, { end: false });
    },
    getUId() {
        let date = Date.now();
        const uuid = 'xxxxxx4xxxyxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (date + Math.random() * 16) % 16 | 0;
            date = Math.floor(date / 16);
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
        return uuid;
    },
};

const pieceCache = {
    get(uid) {
        return pieceCacheConfig.rangeConf[uid];
    },
    set(uid, value) {
        value = utils.extend({}, value);
        pieceCacheConfig.rangeConf[uid] = value;
        pieceCacheConfig.flush();
    },
    remove(uid) {
        delete pieceCacheConfig.rangeConf[uid];
        pieceCacheConfig.flush();
    },
};

class Piece {
    // 属性
    // url = ''; // 资源地址
    // sessionId = ''; // 下载唯一标识
    // totalSize = 0; // 文件总大小
    // range = [];
    // size = 0; // 分片大小
    // current = 0; // 下载进度

    // 事件
    // onprogress = null;
    // onsuccess = null;
    // onerror = null;

    constructor(options) {
        this.url = options.url;
        this.sessionId = options.sessionId;
        this.totalSize = options.totalSize;
        this.range = options.range;
        this.size = (options.range[1] - options.range[0]);
        this.current = 0;
    }

    start() {
        const self = this;

        const pieceFilePath = path.join(pieceCacheDir, self.sessionId);
        utils.mkdir(pieceFilePath);
        const pieceFileName = path.join(pieceFilePath, self.range.join('-'));

        self.req = request({
            method: 'get',
            url: self.url,
            encoding: null,
            headers: {
                Range: `bytes=${self.range[0]}-${self.range[1]}`,
                'X-File-TransactionId': self.sessionId,
                'X-File-Total-Size': self.totalSize,
            },
        }, (error, response) => {
            if (error || !response || [200, 206].indexOf(response.statusCode) === -1) {
                if (utils.isFunction(self.onerror)) {
                    self.onerror(error || response || {
                        statusCode: 504,
                        message: error.message || 'NET_ERROR',
                    });
                }
                return;
            }
            if (utils.isFunction(self.onsuccess)) {
                fs.writeFile(pieceFileName, response.body, (err) => {
                    if (err) {
                        self.error(err);
                        return;
                    }
                    self.onsuccess();
                });
            }
        });
        self.req.on('data', (chunk) => {
            self.current += chunk.length;
            if (utils.isFunction(self.onprogress)) {
                self.onprogress();
            }
        });
    }

    pause() {
        this.req.pause();
    }

    resume() {
        this.req.resume();
    }

    abort() {
        this.req.abort();
        this.current = 0;
        if (this.onprogress) {
            this.onprogress();
        }
    }
}

class PieceManage {
    // 属性
    // limit = 5; // 最多发起请求个数
    // waitingList = [];
    // loadingList = [];
    // loadedList = [];

    // 事件
    // onprogress = null;
    // onsuccess = null;
    // onerror = null;

    /**
     *
     * @param {object} options { url: '',sessionId: '',totalSize: 0,rangeList: [] }
     */
    constructor(options) {
        this.limit = 5;
        this.waitingList = [];
        this.loadingList = [];
        this.loadedList = [];
        this._init(options);
    }

    _init(options) {
        const self = this;
        options.rangeList.forEach((range) => {
            const piece = new Piece({
                url: options.url,
                sessionId: options.sessionId,
                totalSize: options.totalSize,
                range,
            });
            piece.onprogress = function () {
                let size = 0;
                (self.loadedList.concat(self.loadingList)).forEach((item) => {
                    size += item.current;
                });
                if (utils.isFunction(self.onprogress)) {
                    self.onprogress(size);
                }
            };
            piece.onsuccess = function () {
                const index = self.loadingList.indexOf(piece);
                self.loadingList.splice(index, 1);
                self.loadedList.push(piece);

                if (self.waitingList.length > 0) {
                    const next = self.waitingList.shift();
                    self.loadingList.push(next);
                    next.start();
                } else if (self.loadingList.length === 0) {
                    if (utils.isFunction(self.onsuccess)) {
                        self.onsuccess();
                    }
                }
            };
            piece.onerror = function (error) {
                self.loadingList.forEach((item) => {
                    item.abort();
                });
                if (utils.isFunction(self.onerror)) {
                    self.onerror(error);
                }
            };
            self.waitingList.push(piece);
        });
    }

    start() {
        const length = Math.min(this.limit, this.waitingList.length);
        for (let i = 0; i < length; i++) {
            const piece = this.waitingList.shift();
            this.loadingList.push(piece);
            piece.start();
        }
    }

    pause() {
        this.loadingList.forEach((item) => {
            item.pause();
        });
    }

    resume() {
        this.loadingList.forEach((item) => {
            item.resume();
        });
    }

    abort() {
        this.loadingList.forEach((item) => {
            item.abort();
        });
    }
}

function getChunksizeByToalsize(size) {
    // 换算成兆按比例分片
    const sizeM = size / 1024 / 1024;
    const chunkSize = Math.min(Math.max(Math.ceil(sizeM / 10), CHUNK_MIN_SIZE), CHUNK_MAX_SIZE);
    return chunkSize * 1024 * 1024;
}

class Download {
    // stats 只读外部不允许改变
    // stats = {
    //     id: '',
    //     url: '',
    //     name: '',
    //     size: 0,
    //     path: '',
    //     chunkSize: 3 * 1024
    // }
    // rangeList = [];
    // manage = null;
    // isPause = false;

    // 事件
    // onReady = null;
    // onProgress = null;
    // onComplete = null;
    // onError = null;
    // onCancel = null;

    /**
     *
     * @param {object} options {id: 唯一标识, url: 下载资源地址, name: 文件名称, size: 文件大小, path: 保存位置}
     */
    constructor(options) {
        this.stats = {
            id: options.uId || utils.getUId(),
            url: encodeURI(options.url),
            name: options.name,
            size: options.size,
            path: options.path,
            chunkSize: getChunksizeByToalsize(options.size),
        };
        if (this.stats.id) {
            utils.extend(this.stats, Download.getStats(this.stats.id));
        }
        this.rangeList = [];
        this.manage = null;
        this.isPause = false;
        this._init();
    }

    /**
     * 根据创建对象传入参数初始化 rangeList
     */
    _init() {
        const { stats } = this;
        const { size } = stats;
        const { chunkSize } = stats;
        const pieceCount = Math.ceil(size / chunkSize);
        for (let i = 0; i < pieceCount; i += 1) {
            const start = i * chunkSize;
            const end = i === pieceCount - 1 ? size - 1 : (i + 1) * chunkSize - 1;
            this.rangeList.push([start, end]);
        }
    }

    /**
     * 检查并返回需要下载的分片
     */
    _check() {
        const pieceFilePath = path.join(pieceCacheDir, this.stats.id);
        let fileList = [];
        try {
            fileList = fs.readdirSync(pieceFilePath);
        } catch (e) {
            // 文件不存在
        }
        return this.rangeList.filter((item) => {
            const fileName = item.join('-');
            return fileList.indexOf(fileName) === -1;
        });
    }

    /**
     * 开始分片下载
     * 检查需要下载的分片,创建分片管理对象开始下载
     */
    _start() {
        const self = this;
        const concatPiece = function concatPiece(id, rangeList, savePath, complete) {
            const pieceFilePath = path.join(pieceCacheDir, id);
            const pathList = rangeList.map(item => path.join(pieceFilePath, item.join('-')));
            // 下载时选择覆盖需要删除原文件
            fs.unlink(savePath, (err) => {
                // 删除成功或文件不存在时进行合并文件分片
                if (!err || err.code === 'ENOENT') {
                    utils.concatFile(pathList, savePath, (error, data) => {
                        if (error) {
                            self.onError(error.code.toLowerCase());
                            return;
                        }
                        pieceCache.remove(id);
                        utils.delDir(pieceFilePath);
                        complete(data);
                    });
                } else {
                    self.onError(err.code.toLowerCase());
                }
            });
        };
        const unexistRangeList = self._check();
        const manage = new PieceManage({
            url: this.stats.url,
            sessionId: this.stats.id,
            totalSize: this.stats.size,
            rangeList: unexistRangeList,
        });
        self.manage = manage;
        let unloadSize = 0;
        unexistRangeList.forEach((range) => {
            unloadSize += (range[1] - range[0]);
        });
        if (unexistRangeList.length === 0) {
            concatPiece(self.stats.id, self.rangeList, self.stats.path, self.onComplete);
            return;
        }
        const loadedSize = self.stats.size - unloadSize;
        manage.onprogress = function onprogress(size) {
            self.stats.offset = loadedSize + size;
            if (utils.isFunction(self.onProgress)) {
                self.onProgress({
                    loaded: self.stats.offset,
                    total: self.stats.size,
                });
            }
        };
        manage.onsuccess = function onsuccess() {
            concatPiece(self.stats.id, self.rangeList, self.stats.path, self.onComplete);
        };
        manage.onerror = function onerror(error) {
            if (error.statusCode === 404) {
                const { id } = self.stats;
                pieceCache.remove(id);
                const pieceFilePath = path.join(pieceCacheDir, id);
                utils.delDir(pieceFilePath);
            }
            if (utils.isFunction(self.onError)) {
                self.onError('error');
            }
        };
        manage.start();
        pieceCache.set(self.stats.id, self.stats);
        if (utils.isFunction(self.onReady)) {
            self.onReady({
                total: this.stats.size,
                path: this.stats.path,
            });
        }
    }

    directDownload() {
        const fileName = this.stats.name;
        let ext = '';
        let name = fileName;
        const extIndex = fileName.lastIndexOf('.');
        if (extIndex !== -1) {
            ext = fileName.substring(extIndex + 1, fileName.length);
        }
        if (ext) {
            name = fileName.substring(0, extIndex);
        }
        let index = 0;
        function getFileName(nameStr) {
            const filePath = path.join(downloadDir, nameStr);
            if (file.checkExist(filePath)) {
                index++;
                nameStr = ext ? `${name}(${index}).${ext}` : `${nameStr}(${index})`;
                return getFileName(nameStr);
            }
            return nameStr;
        }

        this.stats.name = getFileName(fileName);
        this.stats.path = path.join(downloadDir, this.stats.name);
        this.isDirectDownload = true;
        this._start();
    }

    /**
     * 首次下载选择保存位置
     * TODO: 兼容之前调用，showSaveDialog 方法不应出现在这个类中
     */
    saveAs() {
        const self = this;
        const fileItem = {
            name: self.stats.name,
            path: self.stats.path || downloadDir,
        };
        const distPath = path.join(fileItem.path, fileItem.name);
        const dialogOptions = {
            title: fileItem.name,
            defaultPath: distPath,
        };
        dialogOptions.filters = [{
            name: '*.*',
            extensions: ['*'],
        }];
        let ext = '';
        const fileName = self.stats.name;
        const extIndex = fileName.lastIndexOf('.');
        if (extIndex !== -1) {
            ext = fileName.substring(extIndex + 1, fileName.length);
        }
        if (ext) {
            dialogOptions.filters.unshift({
                name: `[文件](*.${ext})`,
                extensions: [ext],
            });
        }
        const res = dialog.showSaveDialogSync(remote.getCurrentWindow(), dialogOptions);
        if (!res) {
            self.onCancel();
            return;
        }
        self.stats.path = res;
        self._start();
    }

    /**
     * 继续上次断点续传的位置开始下载
     */
    continue() {
        if (this.stats.path) {
            this._start();
        } else {
            this.saveAs();
        }
    }

    /**
     * 暂停下载
     */
    pause() {
        this.isPause = true;
        if (this.manage) {
            this.manage.pause();
        }

        if (this.onPause) {
            this.onPause();
        }
    }

    /**
     * 暂停后的开始下载
     */
    resume() {
        this.isPause = false;
        if (this.manage) {
            this.manage.resume();
        } else {
            // 38858 - 【文件】下载PIN中的文件暂停每次都需要重新进行下载
            // [期望]应该可以暂停下载保留当前下载进度，再次点击下载时可以继续进行下载
            this._start();
        }
        if (this.onResume) {
            this.onResume();
        }
    }

    /**
     * 取消下载
     */
    abort() {
        if (this.manage) {
            this.manage.abort();
        }
    }

    static getStats(downloadUid) {
        const downloadStats = pieceCache.get(downloadUid);
        if (!downloadStats) {
            return null;
        }
        // 获取准确的下载文件大小，暂停下载再次打开应用时获取 range.json 中已下载大小不正确
        let downloadSize = 0;
        try {
            const fileList = fs.readdirSync(path.join(pieceCacheDir, downloadUid));
            fileList.forEach((fileName) => {
                const range = fileName.split('-');
                downloadSize += (Number(range[1]) - Number(range[0]));
            });
        } catch (e) {
            // 文件不存在
        }
        if (!Number.isNaN(downloadSize)) {
            downloadStats.offset = downloadSize;
        }
        return downloadStats;
    }
}

module.exports = {
    load(fileItem, config) {
        return new Download(fileItem, config);
    },
    getProgress(uId) {
        return Download.getStats(uId) || {};
    },
};
