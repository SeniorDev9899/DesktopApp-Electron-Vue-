/**
 * Created by Zhengyi on 5/2/17.
 */
const electron = require('electron');
const fs = require('fs');
const path = require('path');
const {
    app, shell, BrowserWindow, globalShortcut,
} = require('electron');

const { debounce } = require('underscore');
const AppConfig = require('../configuration');
const Config = require('../config');
const Utils = require('../utils');

const { platform } = Utils;

const shortcuts = {
    darwin: {
        devTools: 'Ctrl+Cmd+Shift+I',
        shake: 'Ctrl+Cmd+X',
    },
    win32: {
        search: 'Ctrl+F',
        devTools: 'Ctrl+Alt+Shift+I',
        shake: 'Ctrl+Alt+X',
    },
    linux: {
        search: 'Ctrl+F',
        devTools: 'Ctrl+Alt+Shift+I',
        shake: 'Ctrl+Alt+X',
    },
};

const appShortcuts = shortcuts[process.platform];

let shake = null;

function clearShake() {
    if (shake) {
        clearInterval(shake);
    }
    shake = null;
}
const saveWindowBounds = (bounds) => {
    AppConfig.saveSettings('x', bounds.x);
    AppConfig.saveSettings('y', bounds.y);
    AppConfig.saveSettings('width', bounds.width);
    AppConfig.saveSettings('height', bounds.height);
};
const checkScreenInner = (position) => {
    if (!position) {
        return false;
    }
    const { screen } = electron;
    const screenList = screen.getAllDisplays();
    const { x } = position;
    const { y } = position;
    for (let i = 0, { length } = screenList; i < length; i += 1) {
        const { bounds } = screenList[i];
        const xInner = x > bounds.x && x < bounds.x + bounds.width;
        const yInner = y > bounds.y && y < bounds.y + bounds.height;
        if (xInner && yInner) {
            return true;
        }
    }
    return false;
};
const restoreWindow = (context) => {
    const bounds = context.getBounds();
    const isLinux = process.platform.toLowerCase().indexOf('linux') > -1;
    if (isLinux || !checkScreenInner(bounds)) {
        const { workAreaSize } = electron.screen.getPrimaryDisplay();
        const width = Config.WIN.INIT_WIDTH;
        const height = Config.WIN.INIT_HEIGHT;
        const restoreBounds = {
            x: (workAreaSize.width - width) / 2,
            y: (workAreaSize.height - height) / 2,
            width,
            height,
        };
        context.rceWindow.setBounds(restoreBounds);
    }
};

class RCEWindow {
    constructor(winBounds, winLocation) {
        this.isShown = false;
        this.isFocused = false;
        // this.loginState = { NULL: -2, WAITING: -1, YES: 1, NO: 0 };
        // this.loginState.current = this.loginState.NULL;
        // this.inervals = {};
        this.createWindow(winBounds, winLocation);
        this.initRCEWindowShortcut();
        this.initWindowEvents();
        this.initWindowWebContent();
        this.forceQuit = false;
    }

    createWindow(winBounds, winLocation) {
        const mainConfig = {
            x: winLocation.x,
            y: winLocation.y,
            width: winBounds.width,
            height: winBounds.height,
            titleBarStyle: 'hidden',
            backgroundColor: '#0085e1',
            minWidth: 890,
            minHeight: 640,
            show: false,
            frame: false,
            title: Config.APP_NAME,
            webPreferences: {
                preload: path.join(__dirname, '..', 'inject', 'preload.js'),
                nodeIntegration: false,
                allowDisplayingInsecureContent: true,
                webSecurity: false,
                plugins: true,
                enableRemoteModule: true,
            },
        };
        if (platform.linux) {
            mainConfig.icon = path.join(__dirname, '../../res', Config.LINUX.APPICON);
        }
        const rceWindow = new BrowserWindow(mainConfig);
        this.webContents = rceWindow.webContents;

        rceWindow.on('ready-to-show', () => {
            this.webContents.loadFinished = true;
            rceWindow.show();
            if (global.processENV === 'dev') {
                this.webContents.openDevTools();
            }
        });
        this.rceWindow = rceWindow;
        mainConfig.skipTaskbar = true;
        mainConfig.minimizable = false;
        mainConfig.closable = false;
        mainConfig.parent = rceWindow;
        mainConfig.movable = false;
        this.start();
    }

    loadURL(url) {
        this.rceWindow.loadURL(url);
    }

    isVisible() {
        return this.rceWindow.isVisible();
    }

    show() {
        this.rceWindow.show();
        this.rceWindow.focus();
        this.isShown = true;
    }

    $show() {
        this.rceWindow.show();
        this.rceWindow.focus();
    }

    hide() {
        this.rceWindow.hide();
        this.isShown = false;
    }

    connectRCE() {
        const url = `${Config.getAppHost(Config.IM_SUB_MODULE)}/index.html`;
        this.loadURL(url);
    }

    // Story #498 - 【丹东】【PC客户端】PC端产品能力演进 - RCE
    sendConversationData(data) {
        this.rceWindow.webContents.send('open-conversation-tray', data);
    }

    reload() {
        this.rceWindow.webContents.reload();
    }

    reloadIgnoringCache() {
        this.rceWindow.webContents.reloadIgnoringCache();
    }

    search() {
        this.rceWindow.webContents.send('menu.edit.search');
    }

    setting() {
        this.rceWindow.webContents.send('menu.main.account_settings');
    }

    doubleClick() {
        this.rceWindow.webContents.send('onDoubleClick');
    }

    balloonClick(opt) {
        this.rceWindow.webContents.send('balloon-click', opt);
    }

    voipClose() {
        this.rceWindow.webContents.send('onClose', '');
    }

    voipReady(winid) {
        if (this.rceWindow) {
            this.rceWindow.webContents.send('onVoipReady', winid);
        }
    }

    voipRequest(params) {
        if (params.command === 'addMember') {
            this.$show();
        }
        this.rceWindow.webContents.send('onVoipRequest', params);
    }

    dockClick() {
        this.rceWindow.webContents.send('onDockClick');
    }

    resume() {
        this.rceWindow.webContents.send('onResume');
    }

    suspend() {
    // suppend 事件发生时渲染进程已被挂起，无法接收到任何消息
    // 故下面的语句实际无效
        this.rceWindow.webContents.send('onSuspend');
    }

    flashFrame(enabled) {
        this.rceWindow.flashFrame(enabled);
    }

    setAlwaysOnTop(checked) {
        this.rceWindow.setAlwaysOnTop(checked);
    }

    toggleDevTools() {
        if (this.rceWindow) this.rceWindow.webContents.toggleDevTools();
    }

    isAlwaysOnTop() {
        return this.rceWindow.isAlwaysOnTop();
    }

    execShake(flag) {
        if (this.rceWindow) {
            const position = this.rceWindow.getPosition();
            if (flag) {
                this.rceWindow.setPosition(position[0] + 10, position[1]);
            } else {
                this.rceWindow.setPosition(position[0] - 10, position[1]);
            }
        }
    }

    /**
   * [shakeWindow description]
   * @param options {
   *    interval:number [振动频率]
   *    time :number [振动时间]
   * }
   */
    shakeWindow(options) {
        const config = options || {};
        if (this.rceWindow) {
            let flag = false;
            clearShake();
            if (typeof config.interval !== 'number') {
                config.interval = 25;
            }
            if (typeof config.time !== 'number') {
                config.time = 1000;
            }
            shake = setInterval(() => {
                flag = !flag;
                this.execShake(flag);
            }, config.interval);
            setTimeout(() => {
                clearShake();
            }, config.time);
        }
    }

    start() {
        this.connectRCE();
    }

    initWindowWebContent() {
        const { webContents } = this.rceWindow;
        webContents.on('dom-ready', () => {
            const cssfile = path.join(
                __dirname,
                `/../inject/browser_${platform.darwin ? 'mac' : 'win'}.css`,
            );
            webContents.insertCSS(fs.readFileSync(cssfile, 'utf8'));
        });
        webContents.on('new-window', (event, url) => {
            event.preventDefault();
            shell.openExternal(url);
        });
        webContents.on('context-menu', (e, props) => {
            const params = { props };
            webContents.send('contextMenu', params);
        });
    }

    // eslint-disable-next-line class-methods-use-this
    clearAllListeners() {
        BrowserWindow.getAllWindows().forEach((win) => {
            win.removeAllListeners();
        });
    }

    restore() {
        restoreWindow(this);
    }


    initWindowEvents() {
        const context = this;
        this.rceWindow.on('focus', () => {
            context.isFocused = true;
            this.windowFocus();
            this.registerLocalShortcut();
        });
        this.rceWindow.on('blur', () => {
            context.isFocused = false;
            this.windowBlur();
            this.unregisterLocalShortcut();
        });
        this.rceWindow.on('show', () => {
            // this.registerLocalShortcut();
        });
        this.rceWindow.on('hide', () => {
            this.rceWindow.webContents.send('hide');
        });
        this.rceWindow.on('close', (event) => {
            if (this.forceQuit) {
                if (this.rceWindow && this.rceWindow.webContents) {
                    this.rceWindow.webContents.send('lougout');
                }
                globalShortcut.unregisterAll();
                this.clearAllListeners();
                app.exit(0);
            } else {
                event.preventDefault();
                if (this.rceWindow.isFullScreen()) {
                    this.rceWindow.setFullScreen(false);
                } else {
                    this.rceWindow.hide();
                }
            }
        });
        this.rceWindow.on('closed', () => {
            this.rceWindow.removeAllListeners();
            this.rceWindow = null;
        });
        this.rceWindow.on('restore', () => {
            restoreWindow(this);
        });
        const saveBounds = debounce(() => {
            const bounds = this.getBounds();
            if (bounds) {
                saveWindowBounds(bounds);
            }
        }, 2000);
        this.rceWindow.on('resize', saveBounds);
        this.rceWindow.on('move', saveBounds);
    }

    regShortCut() {
        if (globalShortcut.isRegistered(appShortcuts.search)) {
            return;
        }
        globalShortcut.register(appShortcuts.search, () => {
            this.search();
        });
    }

    // eslint-disable-next-line class-methods-use-this
    unregShortCut() {
        if (globalShortcut.isRegistered(appShortcuts.search)) {
            globalShortcut.unregister(appShortcuts.search);
        }
    }

    registerLocalShortcut() {
        if (platform.darwin) {
            globalShortcut.register(appShortcuts.devTools, () => {
                this.toggleDevTools();
            });
            globalShortcut.register(appShortcuts.shake, () => {
                this.shakeWindow();
            });
        } else if (platform.linux) {
            globalShortcut.register(appShortcuts.devTools, () => {
                this.toggleDevTools();
            });
            this.regShortCut();
        } else {
            globalShortcut.register(appShortcuts.devTools, () => {
                this.toggleDevTools();
            });
            globalShortcut.register(appShortcuts.shake, () => {
                this.shakeWindow();
            });
            this.regShortCut();
            /* globalShortcut.register('Ctrl+R', () => {
                this.reload();
            }); */
        }
    }

    // eslint-disable-next-line class-methods-use-this
    unregisterLocalShortcut() {
        Object.keys(appShortcuts).forEach(key => globalShortcut.unregister(appShortcuts[key]));
    // for (const key in appShortcuts) {
    //     globalShortcut.unregister(appShortcuts[key]);
    // }
    }

    initRCEWindowShortcut() {
        this.registerLocalShortcut();
    }

    getBounds() {
        return this.rceWindow.getBounds();
    }

    getWorkAreaSize() {
        const bounds = this.getBounds();
        const display = electron.screen.getDisplayMatching(bounds);
        return display.workAreaSize;
    }

    enableForceQuit() {
        this.forceQuit = true;
    }

    sendCommand(commond, params) {
        if (this.rceWindow.isDestroyed()) {
            return;
        }
        if (this.rceWindow && this.rceWindow.webContents) {
            this.rceWindow.webContents.send(commond, params);
        }
    }

    windowFocus() {
        this.rceWindow.webContents.send('window.focus');
    }

    windowBlur() {
        this.rceWindow.webContents.send('window.blur');
    }
}
module.exports = RCEWindow;
