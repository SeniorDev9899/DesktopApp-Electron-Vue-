// 此模块依赖于截图模块
// 如果不用截图模块而仅用此模块,需引入截图模块
const { remote, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const mime = require('mime');
const archiver = require('archiver');
// const { fileURLToPath } = require('url');
const Utils = require('../../utils');

const { unzip, platform } = require('../../utils');
// const clipboard = require('../clipboard');
let screenCapture = null;
const sharedObj = remote.getGlobal('sharedObj');
screenCapture = sharedObj ? sharedObj.appCapture : screenCapture;

// 上传文件夹 压缩文件临时目录
const tmpDir = path.resolve(remote.app.getPath('userData'), 'tmp');

module.exports = {
    open(targetPath) {
        if (remote.shell) {
            remote.shell.openPath(targetPath);
        }
    },
    openDir(targetPath) {
        let resultPath = targetPath;
        if(platform.win32) {
            resultPath = resultPath.replace(/\//g, () => ('\\'))
        }
        shell.showItemInFolder(resultPath);
    },
    checkExist(savePath) {
        if (!savePath || savePath === '') {
            return false;
        }
        const exist = Utils.fileExists(savePath);
        return exist;
    },
    // windows 截图的粘贴走 web 方法; 图片的粘贴走这里的方法
    // 当改方法返回空时视为截图粘贴,走 web 方法
    getPaths() {
        if (screenCapture) {
            const clipFile = screenCapture.getFilePathFromClipboard();
            return clipFile;
        }
        return null;
    },
    // windows 复制图片时无法获取图片信息,Electron 中需借助壳中模块实现
    // electron 中复制图片统一用这种方式
    // 仅在只复制一张图片时生效,多张图片或文件直接走 文件上传
    getImgByPath(paths) {
    // const paths = this.getPaths();
        let _imgFile = null;
        paths.forEach((filePath) => {
            const mimeType = mime.lookup(filePath);
            if (mimeType.match('^image/')) {
                _imgFile = getFileByPath(filePath);
            }
        });
        return _imgFile;
    },
    getBlobs(arrPaths) {
        const arrBlob = [];
        arrPaths.forEach((filePath) => {
            const exist = fileExists(filePath);
            let file = null;
            if (exist) {
                file = getFileByPath(filePath);
                file.localPath = filePath;
            }
            arrBlob.push(file);
        });
        return arrBlob;
    },
    getBlob(filePath) {
        const exist = fileExists(filePath);
        let file = null;
        if (exist) {
            file = getFileByPath(filePath);
            file.localPath = filePath;
        }
        return file;
    },
    getFiles() {
        const self = this;
        const lists = this.getPaths();
        let arrFiles = [];
        const arrDirs = [];
        /* if(lists.fileList.length){
            lists.fileList.forEach(function(item){
                var _file = self.getBlob(item);
                _file.localPath = item;
                _file && arrFiles.push(_file);
            });
        } */
        arrFiles = self.getBlobs(lists.fileList);
        if (lists.dirList.length) {
            lists.dirList.forEach((item) => {
                let size;
                try {
                    size = getDirSize(item);
                } catch (ex) {
                    console.log('get dir size error:', item);
                }
                const _dir = { path: item, size };
                arrDirs.push(_dir);
            });
        }
        return { fileList: arrFiles, dirList: arrDirs };
    },
    mkDir(targetPath) {
        if (!fs.existsSync(targetPath)) {
            fs.mkdirSync(targetPath);
        }
    },
    zipFolders(folders, fileMaxsize, callback) {
        let folderName;
        let dest;
        const fileList = [];
        const promiseList = [];

        /**
         * 37355 - 【文件】复制发送文件夹没有生成压缩文件
         * if Electron/tmp folder doesn't exist, it caused an error.
         */
        if (!Utils.dirExists(tmpDir)) {
            Utils.makeDir(tmpDir);
        }
        // const folderSize = 0;
        // todo: 加入文件夹大小计算;超过定额则丢弃
        for (let i = 0; i < folders.length; i++) {
            folderName = getDirName(folders[i]);
            dest = path.resolve(tmpDir, `${folderName}.zip`);
            if (!fs.existsSync(tmpDir)) {
                fs.mkdirSync(tmpDir);
            }
            promiseList.push(zip(folders[i], fileMaxsize, dest));
            fileList.push({ zipFile: dest, folder: folders[i] });
        }
        return Promise.all(promiseList)
            .then(() => {
                callback(fileList);
            })
            .catch((err) => {
                // console.log(err);
                callback(fileList, err);
            });
    },
    /*
    config{src, dest, createFolder: Boolean}
    }
     */
    unzip(config, callback) {
    /*
        if(not legal){
            return;
        }
         */
        config.createFolder = config.createFolder || true;
        let defaultDest = path.dirname(config.src);
        if (config.createFolder) {
            defaultDest = path.join(defaultDest, path.basename(config.src, '.zip'));
        }
        config.dest = config.dest || defaultDest;
        unzip({
            origin: config.src,
            dist: config.dest,
        }).then(
            (data) => {
                callback(null, data);
            },
            (error) => {
                callback(error);
            },
        );
    },
    // 删除上传文件夹时  压缩文件夹产生的临时文件
    delZip(zipPath) {
        fs.unlink(zipPath, (err) => {
            if (err) {
                console.log(`文件:${zipPath}删除成功！`);
            }
        });
    },
    getDirSize,
    getFileStat(filepath) {
        const stat = fs.statSync(filepath);
        return stat;
    },
    getFileInfo(filePath) {
        const fileStat = fs.statSync(filePath);
        const fileInfo = {
            name: path.basename(filePath),
            type: mime.lookup(filePath),
            lastModified: fileStat.mtime,
            size: fileStat.size,
        };
        return fileInfo;
    },
    copyToClipboard(filePath) {
        if (screenCapture) {
            screenCapture.setClipboardUrl(filePath);
        }
    },
    writeFile(fileName, data, callback) {
        fs.writeFile(fileName, data, (err) => {
            if (err) {
                return;
            }
            callback();
        });
    },
};

function getFileByPath(filePath) {
    const buffer = fs.readFileSync(filePath);
    const fileStat = fs.statSync(filePath);
    const fileInfo = {
        buffer, // use this Buffer instead of reading file
        name: path.basename(filePath), // optional when using `path`
        type: mime.lookup(filePath),
        lastModified: fileStat.mtime,
    };
    const blob = new window.Blob([fileInfo.buffer], {
        type: fileInfo.type,
    });
    const file = new window.File([blob], fileInfo.name, {
        type: fileInfo.type,
        lastModified: fileInfo.lastModified,
    });
    return file;
}

function fileExists(filePath) {
    try {
        return fs.statSync(filePath).isFile();
    } catch (err) {
        return false;
    }
}

function zip(folder, fileMaxsize, dest) {
    const zipPromise = new Promise((resolve, reject) => {
        let folderSize = 0;
        try {
            folderSize = getDirSize(folder);
        } catch (ex) {
            console.log(`Cannot Compute Dir Size: ${folder}`);
            reject();
            return;
        }
        // 38866 - 【文件】文件夹不能进行发送成功
        // 单个文件夹不超过 fileMaxsize
        if (folderSize > fileMaxsize) {
            const errorMes = {
                message: 'folderOverSize',
                folderName: folder,
            };
            reject(errorMes);
            return;
        }

        const archive = archiver('zip');
        archive.on('error', (err) => {
            reject();
            throw err;
        });

        const output = fs.createWriteStream(dest);
        output.on('close', () => {
            console.log(`${archive.pointer()} total bytes`);
            resolve();
        });

        // This event is fired when the data source is drained no matter what was the data source.
        // It is not part of this library but rather from the NodeJS Stream API.
        // @see: https://nodejs.org/api/stream.html#stream_event_end
        output.on('end', () => {
            console.log('Data has been drained');
        });

        archive.pipe(output);
        archive.directory(folder, false);
        archive.finalize();
    });
    return zipPromise;
}

function getDirName(folder) {
    let arrName = folder.split('/');
    arrName = arrName.filter(name => name !== '');
    return `${arrName[arrName.length - 1]}_${new Date().getTime()}`;
}

// 遍历读取文件
function readFile(dirPath, filesList) {
    const files = fs.readdirSync(dirPath); // 需要用到同步读取
    files.forEach(walk);
    function walk(file) {
        const states = fs.statSync(`${dirPath}/${file}`);
        if (states.isDirectory()) {
            readFile(`${dirPath}/${file}`, filesList);
        } else {
            // 创建一个对象保存信息
            const obj = {};
            obj.size = states.size; // 文件大小，以字节为单位
            obj.name = file; // 文件名
            obj.path = `${dirPath}/${file}`; // 文件绝对路径
            filesList.push(obj);
        }
    }
}

function getDirSize(dir) {
    const geFileList = function (dirPath) {
        const filesList = [];
        readFile(dirPath, filesList);
        return filesList;
    };

    const filesList = geFileList(dir);
    let size = 0;
    filesList.forEach((file) => {
        size += file.size;
    });
    return size;
}
