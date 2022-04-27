const {
    ipcRenderer,
} = require('electron');

const window = global;

window.RongDesktop = {};
window.RongDesktop.ipcRenderer = ipcRenderer;
window.RongDesktop.imageViewer = require('../modules/image_viewer/image_viewer.render');
window.RongDesktop.download = require('../modules/download_extra/download.render');
window.RongDesktop.file = require('../modules/file/file.render');
window.RongDesktop.cache = require('../modules/cache/cache');
