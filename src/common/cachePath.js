const {
    remote,
} = require('electron');
const fs = require('fs');
const path = require('path');

const cachePath = remote.app.getPath('userData');
const utils = remote.require('./utils');

// 保证缓存路径存在
function initDir(basepath, dirname) {
    const destDir = dirname ? path.join(basepath, dirname) : basepath;
    if (!utils.dirExists(destDir)) {
        utils.makeDir(destDir);
    }
    return destDir;
}

function saveRangeConf(targetPath, content) {
    fs.writeFileSync(targetPath, JSON.stringify(content));
}

// 分片下载/上传缓存区
const sliceDir = initDir(cachePath, 'slice');

// 分片下载
const downloadDir = initDir(sliceDir, 'download');
const downloadRangePath = path.join(downloadDir, 'range.json');
let downloadConf;
try {
    // eslint-disable-next-line import/no-dynamic-require
    downloadConf = require(downloadRangePath);
} catch (err) {
    downloadConf = {};
}
const download = {
    tmpPath: path.join(downloadDir, 'tmp-files'),
    rangeConf: downloadConf,
    flush() {
        saveRangeConf(downloadRangePath, download.rangeConf);
    },
};
// 初始化分片存储目录
initDir(download.tmpPath);


// 分片上传
const uploadDir = initDir(sliceDir, 'upload');
const uploadRangePath = path.join(uploadDir, 'range.json');
let uploadConf;
try {
    // eslint-disable-next-line import/no-dynamic-require
    uploadConf = require(uploadRangePath);
} catch (err) {
    uploadConf = {};
}
const upload = {
    tmpPath: path.join(uploadDir, 'tmp-files'),
    rangeConf: uploadConf,
    flush() {
        saveRangeConf(uploadRangePath, upload.rangeConf);
    },
};
initDir(upload.tmpPath);

// 图片/小视频缓存,暂时未用
const mediaCacheBase = path.join(cachePath, 'rongCache');
const mediaCacheTmp = '{appKey}/{userId}';

module.exports = {
    download,
    upload,
    mediaCache: {
        base: mediaCacheBase,
        tmp: mediaCacheTmp,
    },
};
