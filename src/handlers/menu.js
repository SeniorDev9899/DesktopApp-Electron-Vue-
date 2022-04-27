
const {
    remote,
    shell,
    ipcRenderer,
} = require('electron');

const {
    Menu,
    // BrowserWindow,
} = remote;

const Config = require('../config.js');
const Utils = require('../utils');

let screenshot;
let AboutWindow; let
    aboutWindow = null;

class MenuHandler {
    create(locale) {
        const template = this.getTemplate(locale);
        if (template) {
            const menuFromTemplate = Menu.buildFromTemplate(template);
            Menu.setApplicationMenu(menuFromTemplate);
            this.instance = menuFromTemplate;
        }
    }

    getTemplate(locale) {
        const darwinTemplate = [{
            label: locale.__('menus.Product').replace('RCE', Config.APP_NAME),
            submenu: [{
                label: locale.__('menus.ProductSub.About').replace('RCE', Config.APP_NAME),
                click: MenuHandler._about,
            },
            {
                type: 'separator',
            }, {
                label: locale.__('menus.ProductSub.Settings'),
                click: MenuHandler._setting,
                enabled: false,
            }, {
                type: 'separator',
            }, {
                label: locale.__('menus.ProductSub.Services'),
                role: 'services',
                submenu: [],
            }, {
                type: 'separator',
            }, {
                label: locale.__('menus.ProductSub.HApp').replace('RCE', Config.APP_NAME),
                accelerator: 'Command+H',
                role: 'hide',
            }, {
                label: locale.__('menus.ProductSub.HOthers'),
                accelerator: 'Command+Shift+H',
                role: 'hideothers',
            }, {
                label: locale.__('menus.ProductSub.SAll'),
                role: 'unhide',
            }, {
                type: 'separator',
            }, {
                label: locale.__('menus.ProductSub.Quit'),
                accelerator: 'Command+Q',
                click: MenuHandler._quitApp,
            },
            ],
        }, {
            label: locale.__('menus.Edit'),
            submenu: [{
                label: locale.__('menus.EditSub.SearchUser'),
                accelerator: 'Command+F',
                click: MenuHandler._search,
                enabled: false,
            }, {
                type: 'separator',
            }, {
                label: locale.__('menus.EditSub.Undo'),
                accelerator: 'Command+Z',
                role: 'undo',
            }, {
                label: locale.__('menus.EditSub.Redo'),
                accelerator: 'Shift+Command+Z',
                role: 'redo',
            }, {
                type: 'separator',
            }, {
                label: locale.__('menus.EditSub.Cut'),
                accelerator: 'Command+X',
                role: 'cut',
            }, {
                label: locale.__('menus.EditSub.Copy'),
                accelerator: 'Command+C',
                role: 'copy',
            }, {
                label: locale.__('menus.EditSub.Paste'),
                accelerator: 'Command+V',
                role: 'paste',
            }, {
                label: locale.__('menus.EditSub.SelectAll'),
                accelerator: 'Command+A',
                role: 'selectall',
            }],
        },
        {
            label: locale.__('menus.Window'),
            role: 'window',
            submenu: [{
                label: locale.__('menus.WindowSub.Minimize'),
                accelerator: 'Command+M',
                role: 'minimize',
            }, {
                label: locale.__('menus.WindowSub.Close'),
                accelerator: 'Command+W',
                role: 'close',
            }, {
                type: 'separator',
            }, {
                label: locale.__('menus.WindowSub.AllToFront'),
                role: 'front',
            }],
        }, {
            label: locale.__('menus.Application'),
            submenu: [{
                label: locale.__('menus.ApplicationSub.takeScreenshot'),
                accelerator: 'Command+Ctrl+S',
                enabled: false,
                click: MenuHandler._takeScreenshot,
            }],
        }, {
            label: locale.__('menus.Help'),
            role: 'help',
            submenu: [{
                label: locale.__('menus.HelpSub.Homepage'),
                click: MenuHandler._home,
            }, {
                label: locale.__('menus.HelpSub.Purgecache'),
                click: MenuHandler._purgeCache,
            }],
        }];
        const linuxTemplate = [];
        if (Utils.platform.darwin) {
            return darwinTemplate;
        } if (Utils.platform.linux) {
            return linuxTemplate;
        }
        // 目前仅支持 Mac linux Windows，Windows无系统菜单
        return null;
    }

    static _quitApp() {
        ipcRenderer.send('quit');
    }

    static _reload() {
        ipcRenderer.send('reload');
    }

    static _devTools() {
        remote.getCurrentWindow()
            .toggleDevTools();
    }

    static _update() {
        ipcRenderer.send('update');
    }

    static _setting() {
        ipcRenderer.send('open-settings');
    }

    static _takeScreenshot() {
        if (!screenshot) {
            screenshot = require('../modules/screenshot/screenshot.render');
        }
        screenshot.start();
    }


    static _purgeCache() {
        ipcRenderer.send('purge-cache');
    }

    static _search() {
        ipcRenderer.send('search');
    }

    static _about() {
        if (aboutWindow && aboutWindow.aboutWindow) {
            aboutWindow.aboutWindow.focus();
            return;
        }
        if (!AboutWindow) {
            AboutWindow = remote.require('./windows/about');
        }
        aboutWindow = new AboutWindow();
    }

    static _home() {
        shell.openExternal(Config.HOME);
    }

    static _bringFront(isFront) {
        ipcRenderer.send('bring-front', isFront);
    }

    static _changeLanguage(language) {
        ipcRenderer.send('set-locale', language);
    }

    static showContextMenu(params) {
        const { locale } = params;
        const inputMenu = [
            // {label: locale.__('context.Undo'), role: 'undo'},
            // {label: locale.__('context.Redo'), role: 'redo'},
            // {type: 'separator'},
            { label: locale.__('context.Cut'), role: 'cut' },
            { label: locale.__('context.Copy'), accelerator: 'CommandOrControl+C', role: 'copy' },
            { label: locale.__('context.Paste'), accelerator: 'CommandOrControl+V', role: 'paste' },
            { type: 'separator' },
            { label: locale.__('context.SelectAll'), role: 'selectall' },
        ];
        const selectionMenu = [
            { label: locale.__('context.Copy'), role: 'copy' },
            { type: 'separator' },
            { label: locale.__('context.SelectAll'), click: this.selectAllHistory },
        ];
        const menuTemplate = params.isEditable ? inputMenu : selectionMenu;
        const contextMenu = Menu.buildFromTemplate(menuTemplate);
        contextMenu.popup({ window: params.window });
    }

    static selectAllHistory() {
        remote.getCurrentWindow().send('select-all', true);
    }

    static enableScreenshot(enabled) {
        let screenShotMenu = Menu.getApplicationMenu();
        if (screenShotMenu) {
            screenShotMenu = screenShotMenu.items[3].submenu.items[0];
            screenShotMenu.enabled = enabled;
        }
    }

    // 设置 mac 下某些功能按钮在 logout 后不可用
    static enableAppMenu(enabled, key) {
        if (Utils.platform.win32 || Utils.platform.linux) {
            return;
        }
        const menu = Menu.getApplicationMenu();
        const menuItem = {
            setting: menu.items[0].submenu.items[2],
            search: menu.items[1].submenu.items[0],
        };
        const setEnabled = function (_key, _enabled) {
            const curMenu = menuItem[_key];
            curMenu.enabled = _enabled;
        };
        if (key) {
            setEnabled(key, enabled);
            return;
        }
        Object.keys(menuItem).forEach((_key) => {
            setEnabled(_key, enabled);
        });
        this.enableScreenshot(enabled);
    }
}
module.exports = MenuHandler;
