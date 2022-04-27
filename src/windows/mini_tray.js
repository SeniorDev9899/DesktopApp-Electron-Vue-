const path = require('path');
const fs = require('fs');
const {
    BrowserWindow, ipcMain,
} = require('electron');
const sharp = require('sharp');
const request = require('request');
const TrayWindow = require('./js/trayicon');

const baseDir = path.join(__dirname, '../../res');
const winPath = path.join(__dirname, '/views');

class MiniTray {
    constructor() {
        this.win = null;
    }

    createTray(nItemSize) {
        if (this.win) this.win = null;
        this.win = new BrowserWindow({
            width: 340,
            height: 90 + 82 * nItemSize,
            autoHideMenuBar: true,
            frame: false,
            skipTaskbar: true,
            resizable: false,
            webPreferences: {
                nodeIntegration: true,
                enableRemoteModule: true,
            },
        });

        this.win.loadURL(`file://${path.join(winPath, '/tray.html')}`);

        TrayWindow.setOptions({
            trayIconPath: `${path.join(baseDir, 'icon.png')}`,
            window: this.win,
            width: 360,
            height: 90 + 82 * nItemSize,
        });

        ipcMain.on('tray-window-visible', () => {
            // console.log('tray opened');
        });

        ipcMain.on('open-tray-dialog', (evt, args) => {
            // before window show, change tray icon
            // console.log('last message => ', args);

            if (args != null) {
                const lastMessage = args.latestMessage;

                if (lastMessage.conversationType === 1 || lastMessage.conversationType === 7) {
                    // generate user avatar
                    const { user } = lastMessage;

                    if (user.avatar === '') { this.generateIndivisualAvatar(this.win, 128, 64, user.name.charAt(0), '#f56b2f', '#FFFFFF', 0.6, 400); } else { this.generateIndivisualImage(this.win, user.avatar); }
                } else {
                    // generate group avatar
                    // conversationType = 3 -> group
                    // const { firstNine } = args.group;
                    // console.log('first 9 => ', firstNine);

                    this.generateIndivisualAvatar(this.win, 128, 64, 'G', '#74cfde', '#FFFFFF', 0.6, 400);
                }
            } else {
                // no message available to hide tray icon

            }
        });

        ipcMain.on('close-tray-dialog', () => {
            this.win.hide();
        });
    }

    changeWindowSize(nItemSize) {
        if (nItemSize !== undefined) {
            let itemHeight = 0;
            if (nItemSize > 4) { itemHeight = 380; } else { itemHeight = 90 + 82 * nItemSize; }

            this.win.setSize(340, itemHeight, true);
            TrayWindow.setWindowSize({
                width: 340,
                height: itemHeight,
            });
        }
    }

    sendData(items, nItem) {
        let isRun = false;

        this.changeWindowSize(nItem);

        this.win.webContents.once('dom-ready', () => {
            isRun = true;
            this.win.webContents.send('tray-data', items);
        });

        if (isRun === false) { this.win.webContents.send('tray-data', items); }
    }


    generateIndivisualAvatar(_win, size, r, text, bgColor, txtColor, fontSize, fontWeight) { // eslint-disable-line
        const imgPath = path.join(baseDir, 'icon.png');
        const buff = Buffer.from(`<svg width='${size}px' height='${size}px' viewBox='0 0 ${size} ${size}'><rect fill='${bgColor}' width='${size}px' height='${size}px' cx='${r}' cy='${r}' r='${r}'/><text x='50%' y='50%' dominant-baseline="middle" alignment-baseline="middle" text-anchor="middle" font-size="${Math.round(size * fontSize)}" font-weight="${fontWeight}" stroke="${txtColor}" fill="${txtColor}" dy=".35em">${text}</text></svg>`);
        const wStream = fs.createWriteStream(imgPath);

        sharp(buff).png().pipe(wStream).on('close', () => {
            TrayWindow.setTrayIcon(path.join(baseDir, 'icon.png'));
            _win.show();
        });
    }

    generateIndivisualImage(_win, uri) { // eslint-disable-line
        const imgPath = path.join(baseDir, 'icon.png');

        // err, res, body
        request.head(uri, () => {
            request(uri).pipe(fs.createWriteStream(imgPath)).on('close', () => {
                TrayWindow.setTrayIcon(path.join(baseDir, 'icon.png'));
                _win.show();
            });
        });
    }

    desotryTroy() {
        TrayWindow.getTray().destroy();
        this.win.close();
    }
}

module.exports = MiniTray;
