const noop = $.noop;

export default {
    checkExist() { return false; },
    open: noop,
    openDir: noop,
    getBlobs() { return null; },
    getPaths() { return ''; },
    getImgByPath() { return null; },
    getFiles() { return null; },
    zipFolders: noop,
    unzip: noop,
    delZip: noop,
    getFileStat() { return null; },
};
