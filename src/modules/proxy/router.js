const express = require('express');

const LocalFilesGenerator = require('./controller/localfiles');
const file2http = require('./controller/file2http');

/**
 * @param {string} root 应用缓存根目录
 */
module.exports = (root) => {
    const router = express.Router();

    // controller
    const localfiles = LocalFilesGenerator(root);

    // 本地文件缓存服务
    router.get('/localfile/*', localfiles.pipe);
    router.get('/localpath', localfiles.getPath);
    // 读取本地既有文件
    router.get('/file2http/*', file2http);

    return router;
};
