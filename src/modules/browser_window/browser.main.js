const {
    shell,
    BrowserWindow,
    globalShortcut,
    // ipcRenderer,
    ipcMain,
} = require('electron');
const path = require('path');
const Utils = require('../../utils.js');

const configInfo = require('../../config.js');

const browserWindowOpened = {};

ipcMain.on('create', (event, params) => {
    create(params);
});

ipcMain.on('close', (event, winId) => {
    close(winId);
});

ipcMain.on('closeAll', () => {
    closeAll();
});


const initIpcEvents = () => {
    // eslint-disable-next-line no-underscore-dangle
    const events = ipcMain._events.openWorkPage;
    if (!events) {
        ipcMain.on('browserWinCommand', (event, params) => {
            const win = browserWindowOpened[params.winId];
            if (win && win.webContents) {
                win.webContents.send(params.commandName, params);
            }
        });
        ipcMain.on('closeApp', (event, params) => {
            const workWin = browserWindowOpened.RceWork;
            if (workWin && workWin.webContents) {
                workWin.webContents.send('closeApp', params);
            }
        });
    }
};

/* params {
    path:新窗口地址, 必填
    isLocal: 是否打开本地页面, 为true时path应该是相对路径, 非必填
    id: 记录该窗口的Id, 不填则为path, 非必填
} */
function create(params) {
    const appHost = params.isLocal ? configInfo.getAppHost(params.moduleName) : '';
    const url = appHost + params.path;
    const winId = params.id || url;
    const opened = browserWindowOpened[winId];
    if (opened) {
        opened.webContents.send('reload', params.path);
        opened.focus();
        return opened;
    }
    const defaultOpt = {
        width: 1000,
        height: 640,
        minWidth: 890,
        minHeight: 640,
        titleBarStyle: 'hiddenInset',
        frame: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            webviewTag: true,
            plugins: true,
            enableRemoteModule: true,
        },
    };
    const opt = Utils.extend(defaultOpt, params);
    let newWindow = new BrowserWindow(opt);
    browserWindowOpened[winId] = newWindow;
    newWindow.loadURL(url);


    newWindow.webContents.on('new-window', (event, openUrl) => {
        event.preventDefault();
        shell.openExternal(openUrl);
    });
    newWindow.on('closed', () => {
        unregisterLocalShortcut();
        newWindow = null;
        delete browserWindowOpened[winId];
    });
    newWindow.on('focus', () => {
        registerLocalShortcut(newWindow);
    });
    newWindow.on('blur', () => {
        unregisterLocalShortcut();
    });
    // newWindow.webContents.toggleDevTools();
    initIpcEvents();
    // newWindow.toggleDevTools();
    return newWindow;
}
function registerLocalShortcut(win) {
    if (Utils.platform.darwin) {
        globalShortcut.register('Ctrl+Cmd+Shift+I', () => {
            win.webContents.toggleDevTools();
        });
    } else {
        globalShortcut.register('Ctrl+Alt+Shift+I', () => {
            win.webContents.toggleDevTools();
        });
    }
}

function unregisterLocalShortcut() {
    if (Utils.platform.darwin) {
        globalShortcut.unregister('Ctrl+Cmd+Shift+I');
    } else {
        globalShortcut.unregister('Ctrl+Alt+Shift+I');
    }
}

function close(winId) {
    const browserWin = browserWindowOpened[winId];
    if (browserWin) {
        browserWin.close();
        delete browserWindowOpened[winId];
    }
}

function closeAll() {
    Object.keys(browserWindowOpened).forEach((key) => {
        const browserWin = browserWindowOpened[key];
        browserWin.close();
        delete browserWindowOpened[key];
    });
}
