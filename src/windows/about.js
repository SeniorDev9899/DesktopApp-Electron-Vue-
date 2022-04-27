

const path = require('path');
const {
    BrowserWindow,
    shell,
    globalShortcut,
} = require('electron');
const Config = require('../config.js');

const { getNameByUrl } = require('../utils');

class AboutWindow {
    constructor(parentWin) {
        this.parentWin = parentWin;
        this.createWindow();
        this.initWindowEvents();
        this.initWindowWebContent();
        this.registerLocalShortcut();
    }

    createWindow() {
        const about = Config.ABOUT;
        const mainConfig = {
            height: about.SIZE.HEIGHT,
            resizable: false,
            width: about.SIZE.WIDTH,
            title: '',
            minimizable: false,
            maximizable: false,
            fullscreenable: false,
            center: true,
            frame: false,
            titleBarStyle: 'hidden',
            webPreferences: {
                preload: path.join(__dirname, '..', 'inject', 'about.js'),
                enableRemoteModule: true,
            },
        };
        this.aboutWindow = new BrowserWindow(mainConfig);
    }

    loadURL(url) {
        this.aboutWindow.loadURL(url);
    }

    connectAbout() {
        this.loadURL(`file://${path.join(__dirname, '/', Config.ABOUT.INDEX)}`);
    }

    toggleDevTools() {
        this.aboutWindow.toggleDevTools();
    }

    registerLocalShortcut() {
        globalShortcut.register('Ctrl+Cmd+Shift+I', () => this.toggleDevTools());
    }

    // eslint-disable-next-line class-methods-use-this
    unregisterLocalShortcut() {
        globalShortcut.unregister('Ctrl+Cmd+Shift+I');
    }

    close() {
        if (this.aboutWindow) this.aboutWindow.close();
    }

    initWindowWebContent() {
        const { webContents } = this.aboutWindow;
        this.connectAbout();
        webContents.on('new-window', (event, url) => {
            const browser = getNameByUrl('browser', url);
            if (browser === '1') {
                event.preventDefault();
                shell.openExternal(url);
            }
        });
    }

    initWindowEvents() {
        this.aboutWindow.on('focus', () => {
            this.registerLocalShortcut();
        });
        this.aboutWindow.on('blur', () => {
            this.unregisterLocalShortcut();
        });
        this.aboutWindow.on('closed', () => {
            this.aboutWindow.removeAllListeners();
            this.aboutWindow = null;
        });
    }
}

module.exports = AboutWindow;
