const fs = require('fs');

const electron = require('electron');
const { BrowserWindow, globalShortcut } = require('electron');
const path = require('path');
const Config = require('../config.js');

const { platform } = require('../utils');

class ImageViewer {
    /**
   * options = {
   *   bounds: { x, y, width, height },
   *   dataSource:[message1, message2],
   *   locale, parentWindow
   * }
   */
    constructor(options) {
        this.options = options;
        this.createWindow();
        this.center();
        this.initWindowEvents();
        this.initWindowWebContent();
    }

    show() {
        if (this.imageViewer) {
            this.imageViewer.show();
            // this.imageViewer.setAlwaysOnTop(true);
        }
    }

    center() {
        if (!this.imageViewer) {
            return;
        }
        const size = this.imageViewer.getSize();
        const [width, height] = size;
        const mainWinBounds = BrowserWindow.mainWindow.getBounds();
        const { bounds } = electron.screen.getDisplayMatching(mainWinBounds);
        let x = Math.round(bounds.x + (bounds.width - width) / 2);
        let y = Math.round(bounds.y + (bounds.height - height) / 2);
        x = x === 0 ? 0 : x;
        y = y === 0 ? 0 : y;
        this.imageViewer.setPosition(x, y);
    }

    close() {
        if (this.imageViewer) this.imageViewer.close();
    }

    createWindow() {
        const options = this.options || {};
        let isShow = options.show;
        if (typeof isShow === 'undefined') {
            isShow = true;
        }
        this.imageViewer = new BrowserWindow({
            minWidth: 800,
            minHeight: 600,
            width: 800,
            height: 600,
            title: Config.IMAGE_VIEWER.TITLE || '图片查看',
            show: isShow,
            frame: !!platform.darwin,
            resizable: true,
            alwaysOnTop: false,
            webPreferences: {
                preload: path.join(__dirname, '..', 'inject', 'image_viewer.js'),
                nodeIntegration: false,
                allowDisplayingInsecureContent: true,
                webSecurity: false,
                enableRemoteModule: true,
            },
        });
    }

    changed(options) {
        this.options = options;
        this.imageViewer.webContents.send('update', options);
    }

    logout() {
        this.imageViewer.webContents.send('logout');
    }

    recallMessage(messageUId) {
        this.imageViewer.webContents.send('recallMessage', messageUId);
    }

    loadURL(url) {
        this.imageViewer.loadURL(url);
    }

    reload() {
        this.rceWindow.webContents.reload();
    }

    reloadIgnoringCache() {
        this.rceWindow.webContents.reloadIgnoringCache();
    }

    connectImageViewer() {
        this.loadURL(Config.getAppHost(Config.IM_SUB_MODULE) + Config.IMAGE_VIEWER.INDEX);
    }

    getCurrentDisplay() {
        const bounds = this.imageViewer.getBounds();
        const display = electron.screen.getDisplayMatching(bounds);
        return display;
    }

    initWindowWebContent() {
        const { webContents } = this.imageViewer;
        this.connectImageViewer();
        webContents.on('dom-ready', () => {
            const cssfile = path.join(
                __dirname,
                '..',
                'inject',
                'browser_imageViewer.css',
            );
            webContents.insertCSS(fs.readFileSync(cssfile, 'utf8'));
        });
        webContents.on('did-finish-load', () => {
            webContents.loadFinished = true;
            webContents.setZoomFactor(1);
            webContents.setVisualZoomLevelLimits(1, 1);
        });
    }

    initWindowEvents() {
        this.imageViewer.on('focus', () => this.registerLocalShortcut());
        this.imageViewer.on('blur', () => this.unregisterLocalShortcut());

        this.imageViewer.on('close', (event) => {
            event.preventDefault();
            const context = this;
            if (this.imageViewer.isFullScreen()) {
                this.imageViewer.once('leave-full-screen', () => {
                    context.imageViewer.webContents.send('closeImageViewer');
                });
                this.imageViewer.setFullScreen(false);
            } else {
                this.imageViewer.webContents.send('closeImageViewer');
            }
        });

        this.imageViewer.on('closed', () => {
            this.imageViewer.removeAllListeners();
            this.imageViewer = null;
        });
    }

    toggleDevTools() {
        if (this.imageViewer) this.imageViewer.webContents.toggleDevTools();
    }

    registerLocalShortcut() {
        if (platform.darwin) {
            globalShortcut.register('Ctrl+Cmd+Shift+I', () => {
                this.toggleDevTools();
            });
        } else {
            globalShortcut.register('Ctrl+Alt+Shift+I', () => {
                this.toggleDevTools();
            });
        }
    }

    // eslint-disable-next-line class-methods-use-this
    unregisterLocalShortcut() {
        if (platform.darwin) {
            globalShortcut.unregister('Ctrl+Cmd+Shift+I');
        } else {
            globalShortcut.unregister('Ctrl+Alt+Shift+I');
        }
    }
}
module.exports = ImageViewer;
