const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const URL = require('url');
const { promisify } = require('util');

const isExists = promisify(fs.exists);
const stat = promisify(fs.stat);

const request = require('../../../common/httpRequest');
const { appLogger } = require('../../../common/logger');


function createDir(root, target) {
    const dirPath = path.join(root, target);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath);
    }
    return dirPath;
}

function md5(content) {
    const hash = crypto.createHash('md5');
    hash.update(content);
    return hash.digest('hex');
}

/**
 * 获取文件后缀名称
 * @param {string} filename 文件名或文件 path 路径
 * @returns {string}
 */
function getExtname(filename) {
    const arr = filename.split('.');
    return arr.length > 1 ? `.${arr.pop()}` : '';
}

const loading = {};
function saveFile(localPath, remoteUrl) {
    let promise = loading[localPath];
    if (promise) {
        return promise;
    }
    promise = new Promise((resolve) => {
        // 发起网络请求并写入缓存目录
        const resquestItem = request.get(remoteUrl);
        let contentLength = 0;
        resquestItem
            .on('error', async (err) => {
                appLogger.warn(`\nFile Request ERROR!\n  ${remoteUrl}\n  ${err.stack}`);
                resolve({ status: 404, msg: err.stack });
                await deleteFileDownloadFile(localPath, contentLength);
            })
            .on('response', async (resp) => {
                if (resp.statusCode !== 200) {
                    appLogger.warn(`\nFile Request Complate!\n  ${
                        remoteUrl
                    }\n  Status: ${resp.statusCode} | Msg: ${
                        resp.statusMessage
                    }\n ${resp.body}`);
                    resolve({ status: resp.statusCode, msg: resp.body });
                    await deleteFileDownloadFile(localPath, contentLength);
                    return;
                }
                contentLength = resp.headers['content-length'];
                resquestItem
                    .pipe(fs.createWriteStream(localPath))
                    .on('close', async () => {
                        // 先将请求结果返回给页面
                        resolve();
                        // 检查文件是否完整，若不完整删除文件，以便下一次请求时可恢复
                        await deleteFileDownloadFile(localPath, contentLength);
                    });
            });
    });
    loading[localPath] = promise;
    return promise;
}

async function deleteFileDownloadFile(localPath, contentLength) {
    let stats;
    let error;
    try {
        stats = await stat(localPath);
    } catch (err) {
        error = err;
    }
    if (error || stats.size.toString() !== contentLength) {
        fs.unlink(localPath, () => {});
    }
    loading[localPath] = null;
}
/**
 *
 * @params {string} root 应用缓存根目录
 */
module.exports = (root) => {
    // 解析请求 Request
    function parseReq(req) {
        const {
            url, // 远程文件地址
            dir, // 指定文件缓存目录
        } = req.query;
        // 文件远程路径
        const fileUrl = URL.parse(decodeURIComponent(url));
        const remotePath = `${fileUrl.protocol}//${fileUrl.host}${fileUrl.pathname}`;
        // 本地存储文件名
        const localName = `${md5(remotePath)}${getExtname(fileUrl.pathname)}`;
        // 文件缓存根目录
        const localDir = createDir(root, 'localfiles');
        // 文件缓存目录，目录不存在则创建目录
        const targetDir = dir ? createDir(localDir, encodeURIComponent(dir)) : localDir;
        // 文件诠释路径
        const localPath = path.join(targetDir, localName);
        return {
            fileUrl, remotePath, localName, targetDir, localPath,
        };
    }
    return {
        pipe: async (req, res) => {
            const { fileUrl, localPath } = parseReq(req);
            const exists = await isExists(localPath);
            // 有限监测队列数据加载是否正常，如果正常，需要等待其加载完成；
            const promise = loading[localPath];
            if (promise) {
                Promise.all([promise]).then(() => {
                    res.sendFile(localPath);
                });
                return;
            }
            // 发送本地缓存文件
            if (exists) {
                res.sendFile(localPath);
                return;
            }
            // 增加请求队列，确保同一文件只派发一次 http 请求
            const error = await saveFile(localPath, encodeURI(fileUrl.href));
            if (!error) {
                res.sendFile(localPath);
                return;
            }
            const { status, msg } = error;
            res.status(status).send(msg);
        },
        getPath: async (req, res) => {
            const { localPath } = parseReq(req);
            const exists = await isExists(localPath);
            // 发送本地路径
            res.send(JSON.stringify({
                localPath: exists ? localPath : null,
            }));
        },
    };
};
