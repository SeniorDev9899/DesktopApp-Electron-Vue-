
function chkFileExist(dir) {
    return RongDesktop.file.checkExist(dir);
}

function openFile(localPath) {
    RongDesktop.file.open(localPath);
}

function openFileDir(dir) {
    RongDesktop.file.openDir(dir);
}

function getBlobs(arrPath) {
    return RongDesktop.file.getBlobs(arrPath);
}

function getPaths() {
    return RongDesktop.file.getPaths();
}

function getImgByPath(paths) {
    return RongDesktop.file.getImgByPath(paths);
}

function getFiles() {
    return RongDesktop.file.getFiles();
}

// 1. 原来代码本意是通过ajax异步读取大文件的
// 2. 但是现在限了2G上传， 并且ajax读取出来也是一起发， 并未分片， 所以没啥用。
function getBlob(filePath) {
    return new Promise((resolve, reject) => {
        const file = RongDesktop.file.getBlob(filePath);
        if (file) {
            resolve(file);
        }
        reject(Error(404));
    });
    // //读取大文件传用。
    // const defer = $.Deferred();
    // // 38908 - 【文件消息】部分文件在会话窗口无法复制
    // // 一个文件后缀为.json 的文件没有发送
    // const fileInfo = RongDesktop.file.getFileInfo(filePath);
    // responseType = "arraybuffer";  //blob,text
    // $.ajax({
    //     xhrFields: {
    //         responseType: responseType,
    //     },
    //     url: `file:///${filePath}`,
    //     type: 'GET',
    // }).then((buffer) => {
    //     fileInfo.buffer = buffer;
    //     const blob = new window.Blob([fileInfo.buffer], {
    //         type: fileInfo.type,
    //     });
    //     file = new window.File([blob], fileInfo.name, {
    //         type: fileInfo.type,
    //         lastModified: fileInfo.lastModified,
    //     });
    //     file.localPath = filePath;
    //     defer.resolve(file);
    // }, (err) => {
    //     defer.reject(err);
    // });
    // return defer.Promise();
}

export default {
    checkExist: chkFileExist,
    open: openFile,
    openDir: openFileDir,
    getBlobs,
    getPaths,
    getImgByPath,
    getFiles,
    zipFolders: RongDesktop.file.zipFolders,
    unzip: RongDesktop.file.unzip,
    delZip: RongDesktop.file.delZip,
    getFileStat: RongDesktop.file.getFileStat,
    mkDir: RongDesktop.file.mkDir,
    writeFile: RongDesktop.file.writeFile,
    getBlob,
};
