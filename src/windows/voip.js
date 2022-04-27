

const fs = require('fs');
const path = require('path');
const { BrowserWindow, globalShortcut, screen } = require('electron');

const Config = require('../config.js');
const { platform } = require('../utils');

const scaleFactor = 1;

class VoipWindow {
    constructor(options, parentWindow) {
        this.options = options;
        this.parentWindow = parentWindow;
        this.isShown = false;
        this.inervals = {};
        this.createWindow();
        this.initWindowEvents();
        this.initWindowWebContent();
        this.setWorkAreaSize();
    }

    createWindow() {
        const voip = Config.VOIP;
        const mainConfig = {
            x: voip.BOUNDS.X,
            y: voip.BOUNDS.Y,
            width: voip.BOUNDS.WIDTH,
            height: voip.BOUNDS.HEIGHT,
            minWidth: voip.MINWIDTH,
            minHeight: voip.MINHEIGHT,
            titleBarStyle: 'hidden',
            // resizable: false,
            minimizable: true,
            maximizable: true,
            backgroundColor: '#002032',
            // maxHeight: workAreaSize.height, //如果此处设置,mac最大化窗体时 左上角按钮显示有问题
            // icon: path.join(__dirname, 'res', Config.WINICON),
            show: false,
            frame: false,
            transparent: false,
            alwaysOnTop: true,
            // parent: mainWindow,
            webPreferences: {
                preload: path.join(__dirname, '..', 'inject', 'voip.js'),
                nodeIntegration: false,
                allowDisplayingInsecureContent: true,
                enableRemoteModule: true,
            // webSecurity: false,
            },
        };
        this.voipWindow = new BrowserWindow(mainConfig);
        // this.voipWindow.openDevTools();
    }

    loadURL(url) {
        this.voipWindow.loadURL(url);
    }

    show() {
        this.voipWindow.show();
        this.voipWindow.focus();
        this.voipWindow.webContents.send('show-voip-window');
        this.isShown = true;
    }

    hide() {
        this.voipWindow.hide();
        this.voipWindow.webContents.send('hide-voip-window');
        this.isShown = false;
    }

    connectVoip() {
        const url = `${Config.getAppHost(Config.IM_SUB_MODULE) + Config.VOIP.INDEX
        }?userid=${this.options.userid
        }&locale=${this.options.locale
        }&appkey=${encodeURIComponent(this.options.appkey)
        }&navi=${encodeURIComponent(this.options.navi)
        }&token=${encodeURIComponent(this.options.token)}`;
        this.loadURL(url);
    }

    reload() {
        this.voipWindow.webContents.reloadIgnoringCache();
    }

    toggleDevTools() {
        this.voipWindow.webContents.toggleDevTools();
    }

    close() {
        if (this.voipWindow) this.voipWindow.close();
    }

    // 设置 voip 窗体大小,并保证  窗体在主窗体右下侧贴主窗体显示;如果主窗体过大,则 voip 窗体右侧贴屏幕右侧边缘显示
    // setBounds 各个参数必须为整数,如果有小数会出异常
    setBounds(params) {
        const { workAreaSize } = this;
        const position = {};
        const mainBounds = this.parentWindow.getBounds();
        position.x = Math.min(mainBounds.x + mainBounds.width, workAreaSize.width - params.width);
        position.y = Math.min(
            mainBounds.y + mainBounds.height - params.height,
            workAreaSize.height - params.height,
        );
        this.voipWindow.setMinimumSize(params.width, params.height);
        this.voipWindow.setBounds({
            x: position.x, y: position.y, width: params.width, height: params.height,
        });
        this.voipWindow.setAlwaysOnTop(false);
        this.voipWindow.focus();
        this.voipWindow.show();
    }

    // voip 窗体响铃位置
    setRingPos() {
        const { workAreaSize } = this;
        const position = {};
        const voipSize = this.voipWindow.getSize();
        position.x = workAreaSize.width - voipSize[0] * scaleFactor;
        position.y = workAreaSize.height - voipSize[1] * scaleFactor;
        this.voipWindow.setPosition(position.x, position.y);
        this.voipWindow.setMinimumSize(voipSize[0] * scaleFactor, voipSize[1] * scaleFactor);
        this.voipWindow.show();
    }

    setWorkAreaSize() {
        if (this.workAreaSize) {
            return;
        }
        this.workAreaSize = screen.getPrimaryDisplay().workAreaSize;
    }

    initWindowWebContent() {
        const { webContents } = this.voipWindow;
        this.voipWindow.on('focus', () => {
            this.registerLocalShortcut();
        });
        this.voipWindow.on('blur', () => {
            this.unregisterLocalShortcut();
        });
        if (global.processENV === 'demo') {
            this.connectDemo();
        } else {
            this.connectVoip();
        }
        webContents.on('dom-ready', () => {
            const cssfile = path.join(__dirname, '..', 'inject', 'browser_voip.css');
            webContents.insertCSS(fs.readFileSync(cssfile, 'utf8'));
        });

        webContents.on('did-finish-load', () => {
            webContents.loadFinished = true;
        });
    }

    initWindowEvents() {
        this.voipWindow.on('closed', () => {
            if (this.parentWindow) {
                this.parentWindow.voipClose();
            }
            this.voipWindow.removeAllListeners();
            this.voipWindow = null;
        });
    }

    IMRequest(params) {
        const { voipWindow } = this;
        if (voipWindow) {
            voipWindow.webContents.send('onIMRequest', params);
        }
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

module.exports = VoipWindow;
