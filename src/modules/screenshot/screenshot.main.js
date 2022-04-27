const { BrowserWindow, ipcMain, globalShortcut } = require("electron");
const { arch, platform } = require('os');
const Utils = require('../../utils.js');
const path = require("path");
const Config = require('../../config');
const AppConfig = require("../../configuration");

const defaultShortcuts = {
  screenshot: "s",
  visualization: "d",
};
const electronVersion = Config.getElectronVersion();
const screencaptureUrl = path.resolve(__dirname, `electron-v${electronVersion}-${platform()}-${arch()}`, "screencapture.node");
let capture;
try {
  // eslint-disable-next-line import/no-dynamic-require
  capture = require(screencaptureUrl);
} catch (err) {
  console.log("screen capture load error ===> ", err);
}

const appCapture = capture ? new capture.Main() : null;
   

global.sharedObj = { appCapture };

ipcMain.on("toggle-screenshot-shortcut", (event, enabled) => {
  enableScreenshot(!!enabled);
});

ipcMain.on("screenshot-hide", (event, time) => {
  setTimeout(() => {
    BrowserWindow.mainWindow.sendCommand("takeScreenshot-hide");
  }, time);
});

ipcMain.on("set-screenshot-shortcut", (event, newKey) => {
  // todo 1. 去原来的快捷键  2. unreg 原快捷键 3. 新快捷键如果有则更新;否则取消
  const oldKey =
    AppConfig.readSettings("screenshot") || defaultShortcuts.screenshot;
  let oldeShortcut;
  let newShortcut;
  if (Utils.platform.darwin) {
    oldeShortcut = `ctrl+cmd+${oldKey}`;
    newShortcut = `ctrl+cmd+${newKey}`;
  } else if (Utils.platform.win32) {
    oldeShortcut = `ctrl+alt+${oldKey}`;
    newShortcut = `ctrl+alt+${newKey}`;
  }
  if (oldKey) {
    if (oldeShortcut) globalShortcut.unregister(oldeShortcut);
    AppConfig.saveSettings("screenshot", "");
  }
  if (newKey) {
    globalShortcut.register(newShortcut, takeScreenshot);
    AppConfig.saveSettings("screenshot", newKey);
  }
});

ipcMain.on("login", () => {
  enableScreenshot(true);
});

ipcMain.on("logout", () => {
  enableScreenshot(false);
});

function takeScreenshot() {
  BrowserWindow.mainWindow.sendCommand("takeScreenshot", false);
}

function enableScreenshot(enabled) {
  console.log("enableScreenshot", enabled);
  const currentWindow = BrowserWindow.mainWindow;
  if (!currentWindow) {
    return;
  }
  let screenshotReg;
  if (Utils.platform.darwin) {
    currentWindow.sendCommand("enableScreenshot", enabled);
    screenshotReg = "Ctrl+Cmd+S";
  } else {
    screenshotReg = "Ctrl+Alt+S";
  }
  if (enabled) {
    globalShortcut.register(screenshotReg, () => {
      takeScreenshot();
    });
    return;
  }
  globalShortcut.unregister(screenshotReg);
}

exports.deleteScreenCapture = function () {
    let result;
    try {
      global.sharedObj = { appCapture };
      appCapture.deleteScreenCapture();
    } catch (error) {
        // eslint-disable-next-line no-param-reassign
        console.log(error.stack);
    }
    return result;
};
