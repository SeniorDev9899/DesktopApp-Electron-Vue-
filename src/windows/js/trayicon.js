/* eslint-disable no-unused-expressions */
/* eslint import/newline-after-import: "off" */
/* eslint-disable camelcase */
/* eslint-disable prefer-destructuring */
/* eslint-disable eslintno-unused-expressions */

const electron = require('electron');
const { BrowserWindow, ipcMain, Tray } = electron;

let tray = '';
let window = '';

let width = 200;
let height = 300;

let margin_x = 0;
let margin_y = 0;
let framed = false;

function setOptions(options) {
    if (!validation(options)) return;
    init(options);
}

function setTrayIcon(path) {
    tray.setImage(path);
}

function getTray() {
    return tray;
}

function validation(options) {
    if (typeof options !== 'object') {
        // console.log("!!!tray-window can not create without any [options]");
        return false;
    }
    if (!options.tray && !options.trayIconPath) {
        // console.log(
        //     "!!!tray-window can not create without [tray] or [trayIconPath] parameters"
        // );
        return false;
    }
    if (!options.window && !options.windowUrl) {
        // console.log(
        //     "!!!tray-window can not create without [window] or [windowUrl] parameters"
        // );
        return false;
    }

    return true;
}

function init(options) {
    setWindowSize(options);

    options.tray ? setTray(options.tray) : createTray(options.trayIconPath);
    options.window ? setWindow(options.window) : createWindow(options.windowUrl);

    tray.on('click', () => {
        ipcMain.emit('tray-window-clicked', { window, tray });
        toggleWindow();
    });

    setWindowAutoHide();
    alignWindow();

    ipcMain.emit('tray-window-ready', { window, tray });
}

function setWindowSize(options) {
    if (options.width) width = options.width;
    if (options.height) height = options.height;
    if (options.margin_x) margin_x = options.margin_x;
    if (options.margin_y) margin_y = options.margin_y;
    if (options.framed) framed = options.framed;
}

function createTray(trayIconPath) {
    tray = new Tray(trayIconPath);
}

function setTray(newTray) {
    tray = newTray;
}

function setWindow(newWindow) {
    window = newWindow;
    setWindowSize(window.getBounds());
}

function createWindow(windowUrl) {
    window = undefined;

    window = new BrowserWindow({
        width,
        height,
        maxWidth: width,
        maxHeight: height,
        show: false,
        frame: framed,
        fullscreenable: false,
        resizable: false,
        useContentSize: true,
        transparent: true,
        alwaysOnTop: true,
        webPreferences: {
            backgroundThrottling: false,
        },
    });
    window.setMenu(null);

    setWindowUrl(windowUrl);

    return window;
}

function setWindowUrl(windowUrl) {
    window.loadURL(windowUrl);
}

function setWindowAutoHide() {
    window.hide();
    window.on('blur', () => {
        if (!window.webContents.isDevToolsOpened()) {
            window.hide();
            ipcMain.emit('tray-window-hidden', { window, tray });
        }
    });
    window.on('close', (event) => {
        event.preventDefault();
        window.hide();
    });
}

function toggleWindow() {
    if (window.isVisible()) {
        window.hide();
        ipcMain.emit('tray-window-hidden', { window, tray });
        return;
    }

    showWindow();
    ipcMain.emit('tray-window-visible', { window, tray });
}

function alignWindow() {
    const position = calculateWindowPosition();
    window.setBounds({
        width,
        height,
        x: position.x,
        y: position.y,
    });
}

function showWindow() {
    alignWindow();
    window.show();
}

function calculateWindowPosition() {
    const screenBounds = electron.screen.getPrimaryDisplay().size;
    const trayBounds = tray.getBounds();

    // where is the icon on the screen?
    let trayPos = 4; // 1:top-left 2:top-right 3:bottom-left 4.bottom-right
    trayPos = trayBounds.y > screenBounds.height / 2 ? trayPos : trayPos / 2;
    trayPos = trayBounds.x > screenBounds.width / 2 ? trayPos : trayPos - 1;

    const DEFAULT_MARGIN = { x: margin_x, y: margin_y };
    let x = 0;
    let y = 0;

    // calculate the new window position
    switch (trayPos) {
    case 1: // for TOP - LEFT
        x = Math.floor(trayBounds.x + DEFAULT_MARGIN.x + trayBounds.width / 2);
        y = Math.floor(trayBounds.y + DEFAULT_MARGIN.y + trayBounds.height / 2);
        break;

    case 2: // for TOP - RIGHT
        x = Math.floor(trayBounds.x - width - DEFAULT_MARGIN.x + trayBounds.width / 2);
        y = Math.floor(trayBounds.y + DEFAULT_MARGIN.y + trayBounds.height / 2);
        break;

    case 3: // for BOTTOM - LEFT
        x = Math.floor(trayBounds.x + DEFAULT_MARGIN.x + trayBounds.width / 2);
        y = Math.floor(trayBounds.y - height - DEFAULT_MARGIN.y + trayBounds.height / 2);
        break;

    case 4: // for BOTTOM - RIGHT
        x = Math.floor(trayBounds.x - width - DEFAULT_MARGIN.x + trayBounds.width / 2);
        y = Math.floor(trayBounds.y - height - DEFAULT_MARGIN.y + trayBounds.height / 2);
        break;
    default:
        break;
    }

    return { x, y };
}

module.exports = {
    setOptions, setTray, setWindow, setWindowSize, setTrayIcon, getTray,
};
