/*
https://electron.atom.io/docs/api/ipc-main/
*/
const { remote } = require('electron');

const { dialog } = remote;
const fs = require('fs');
const Path = require('path');
const Url = require('url');
const retry = require('retry');
const request = require('../../common/httpRequest');
const Utils = require('../../utils');

const { app } = remote;
const downloadDir = Path.join(app.getPath('userData'), 'downloadFiles');
Utils.mkDir(downloadDir);
// 暴露方法给页面dom注册调用

class Download {
    /*
    file: {url: 文件下载链接, name: 保存后的别名, prefix: 前缀名, path:保存路径}
    config: {timeout: timeout 连接超时, retries: 重试次数}
    */
    constructor(file, config) {
        config = config || {};
        const parsed = Url.parse(file.url);
        let filename = Path.basename(parsed.pathname);
        const ext = Path.extname(parsed.pathname);
        filename = `${Utils.getDateID()}${ext}`;
        filename = file.name || filename;
        if (file.prefix) {
            filename = file.prefix + filename;
        }

        try {
            filename = decodeURI(decodeURI(filename));
        } catch (ex) {
            console.log('decodeURI filename error', ex);
        }

        const downloadPath = file.path || downloadDir;
        /* if(file.path && file.path.dir){
            downloadPath = Path.join(downloadPath, file.path.dir);
        } */
        if (!Utils.dirExists(downloadPath)) {
            Utils.makeDir(downloadPath);
        }
        // var savePath = Path.join(downloadPath, filename);
        this.default = {
            url: encodeURI(file.url), path: downloadPath, name: filename, ext,
        };
        config.timeout = config.timeout || 100000; // 100秒
        config.retries = config.retries || 10;
        this.config = config;
    }

    save(name) {
        const me = this;
        let tempName = name || me.default.name;
        if (tempName.indexOf('.') < 0) {
            tempName += me.default.ext;
        }
        const path = Path.join(me.default.path, tempName);
        const file = {
            url: me.default.url,
            path,
        };
        // me.start(file);
        me.retryStart(file);
    }

    retryStart(file) {
        const me = this;
        const retryOperation = retry.operation({
            retries: me.config.retries,
            // factor: 3,
            // minTimeout: 1 * 1000,
            // maxTimeout: 60 * 1000,
            // randomize: true
        });
        me.retryOperation = retryOperation;
        retryOperation.attempt((currentAttempt) => {
            console.log(`Connect Times:${currentAttempt}:${file}`);
            me.start(file);
        });
    }

    /* file {
        path: path, 另存为的默认路径
        name: 保存的别名
    } */
    saveAs(file) {
        file = file || {};
        const me = this;
        const path = Path.join(file.path || me.default.path, file.name || me.default.name);
        const dialogOptions = {
            title: file.name || me.default.name,
            defaultPath: path,
        };

        const res = dialog.showSaveDialogSync(dialogOptions);
        if (!res) {
            if (me.onCancel) {
                me.onCancel();
            }
            return;
        }
        // 如果没有扩展名,自动保留原扩展名
        let savePath = res;
        const ext = Path.extname(savePath);
        if (!ext) {
            savePath += me.default.ext;
        }
        me.retryStart({
            url: me.default.url,
            path: savePath,
        });
    }

    /* file {
        url: url,  文件下载链接
        path: path 文件保存路径/包括文件名
    } */
    start(file) {
        const me = this;
        let receivedBytes = 0;
        let totalBytes = 0;
        const savePath = Path.resolve(file.path);
        const stream = fs.createWriteStream(savePath);
        const options = {
            method: 'GET',
            uri: file.url,
            timeout: me.config.timeout,
        };
        let errorData = null;
        // Electron bug request 请求成功后依然会触发 error 超时
        let requestSuccess = false;
        let req = null;
        try {
            req = request(options);
        } catch (error) {
            if (me.onError) me.onError(error);
            return;
        }

        me.request = req || [];
        req.pipe(stream);

        let data = {
            state: '',
            loaded: '',
            total: '',
            path: '',
        };
        req.on('response', (_data) => {
            if (_data.statusCode !== 200) {
                errorData = { code: _data.statusCode, description: _data.statusMessage };
                me.abort();
                return;
            }
            receivedBytes = 0;
            totalBytes = parseInt(_data.headers['content-length']);
            data = {
                total: totalBytes,
                path: savePath,
            };
            if (me.onReady) me.onReady(data);
        });

        req.on('data', (chunk) => {
            // console.log(chunk.length);
            receivedBytes += chunk.length;
            data = {
                loaded: receivedBytes,
                total: totalBytes,
                path: savePath,
            };
            if (me.onProgress) me.onProgress(data);
        });

        req.on('end', () => {
            requestSuccess = true;
            data = {
                loaded: receivedBytes,
                total: totalBytes,
                path: savePath,
            };
            if (errorData && me.onError) {
                me.onError(errorData);
                // delete downloaded file
                fs.unlinkSync(data.path);
                return;
            }
            // 取消也会触发 end
            if (data.loaded >= data.total) {
                if (me.onComplete) me.onComplete(data);
            } else {
                // delete downloaded file
                fs.unlinkSync(data.path);
                if (me.onCancel) me.onCancel(data);
            }
        });

        req.on('error', (error) => {
            if (requestSuccess) {
                return;
            }
            if (me.retryOperation.retry(error)) {
                return;
            }
            // console.log('err', me.retryOperation.mainError());
            if (error.code === 'ETIMEDOUT' && me.onTimeout) {
                me.onTimeout(error);
                return;
            }
            switch (error.code) {
            case 'ENOTFOUND':
                error.description = 'dns 找不到域名导致。请检查 1. 域名是否写错 2. 网络连接是否正常';
                break;
            case 'ECONNREFUSED':
                error.description = '这可能是因为防火墙或代理程序无法访问网络。请检查防火墙或者代理设置';
                break;
            case 'ECONNRESET':
                error.description = '请尝试在 options 中加入 {originalHostHeaderName: "Host"}';
                break;
            case 'EPIPE':
                error.description = '请检查您的 node 版本是否过低';
                break;
            default:
                error.description = '请参考官方文档 https://nodejs.org/api/errors.html';
                break;
            }
            if (me.onError) me.onError(error);

            if (error.code === 'ESOCKETTIMEDOUT') {
                try {
                    // remove instance image from folder
                    stream.end(() => {
                        fs.unlinkSync(savePath);
                    });
                } catch (e) {
                    console.log(e.message);
                }
            }
        });
    }

    pause() {
        if (this.request) this.request.pause();
    }

    resume() {
        if (this.request) this.request.resume();
    }

    abort() {
        if (this.retryOperation) this.retryOperation.stop();
        if (this.request) this.request.abort();
    }
}

module.exports = function initDownload(file, config) {
    return new Download(file, config);
};
