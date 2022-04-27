const fs = require('fs');
const decompress = require('decompress');
const decompressUnzip = require('decompress-unzip');
const { createHash } = require('crypto');

exports.getNameByUrl = function getNameByUrl(field, url) {
    // eslint-disable-next-line no-undef
    const href = url || window.location.href;
    const reg = new RegExp(`[?&]${field}=([^&#]*)`, 'i');
    const string = reg.exec(href);
    return string ? decodeURIComponent(decodeURIComponent(string[1])) : null;
};

function stringFormat(temp, data, regexp) {
    if (!(Object.prototype.toString.call(data) === '[object Array]')) data = [data];
    const ret = [];
    for (let i = 0, j = data.length; i < j; i += 1) {
        ret.push(replaceAction(data[i]));
    }
    return ret.join('');

    function replaceAction(object) {
        return temp.replace(regexp || (/{([^}]+)}/g), (match, name) => {
            if (match.charAt(0) === '\\') return match.slice(1);
            // eslint-disable-next-line eqeqeq
            return (object[name] != undefined) ? object[name] : `{${name}}`;
        });
    }
}
exports.stringFormat = stringFormat;

exports.platform = {
    win32: /^win/i.test(process.platform),
    darwin: /^darwin/i.test(process.platform),
    linux: /^linux/i.test(process.platform),
};

exports.fileExists = function fileExists(filePath) {
    try {
        return fs.statSync(filePath)
            .isFile();
    } catch (err) {
        return false;
    }
};

exports.dirExists = function dirExists(filePath) {
    try {
        return fs.statSync(filePath)
            .isDirectory();
    } catch (err) {
        return false;
    }
};

exports.makeDir = function makeDir(dir) {
    try {
        fs.mkdirSync(dir);
        return true;
    } catch (err) {
        return false;
    }
};

exports.getModulePath = (mod) => {
    const { platform } = process;
    const { version } = mod;
    const tpl = mod.path;
    return stringFormat(tpl, { platform, version });
};

// 自动创建目录
exports.unzip = function unzip(params) {
    const { origin } = params;
    const { dist } = params;

    return decompress(origin, dist, {
        plugins: [
            decompressUnzip(),
        ],
    });
};

function sizeBase64(base64) {
    let str = base64;
    const equalIndex = str.indexOf('=');
    if (equalIndex > 0) {
        str = str.substring(0, equalIndex);
    }
    const strLength = str.length;
    const size = parseInt(strLength - (strLength / 8) * 2, 10);
    return size;
}

exports.splitBase64 = function splitBase64(dataurl) {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const size = sizeBase64(arr[1]);
    return {
        dataURL: dataurl, base64: arr[1], type: mime, size,
    };
};

exports.deleteDir = function deleteDir(targetPath) {
    let files = [];
    if (fs.existsSync(targetPath)) {
        files = fs.readdirSync(targetPath);
        files.forEach((file) => {
            const curPath = `${targetPath}/${file}`;
            if (fs.statSync(curPath).isDirectory()) { // recurse
                deleteDir(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(targetPath);
    }
};

exports.deleteFile = function deleteFile(targetPath) {
    if (this.fileExists(targetPath)) {
        fs.unlinkSync(targetPath);
    }
};

exports.extend = function extend(...args) {
    if (args.length === 0) {
        return undefined;
    }
    const obj = args[0];
    for (let i = 1, len = arguments.length; i < len; i += 1) {
        const other = args[i];
        Object.keys(other).forEach((key) => {
            obj[key] = other[key];
        });
    }
    return obj;
};
exports.mkDir = function (dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
};

exports.prettyJSON = content => JSON.stringify(content, null, 4);

exports.md5 = str => createHash('md5').update(str).digest('hex');

exports.getDevPorts = (argvs, Config) => {
    const portObj = {};
    portObj[Config.IM_SUB_MODULE] = argvs.slice(3, 4);
    portObj[Config.SEALMEETING_SUB_MODULE] = argvs.slice(4, 5);
    return portObj;
};

function formateNum(n) {
    if (n < 10) {
        return `0${n}`;
    }
    return n.toString();
}

exports.getDateID = function getDateId() {
    const date = new Date();
    const components = [
        date.getFullYear(),
        formateNum(date.getMonth() + 1),
        formateNum(date.getDate()),
        date.getHours(),
        date.getMinutes(), '_',
        date.getSeconds(),
        date.getMilliseconds(),
    ];
    return components.join('');
};
