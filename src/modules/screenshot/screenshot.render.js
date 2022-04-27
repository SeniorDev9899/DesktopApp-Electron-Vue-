/*
https://electron.atom.io/docs/api/ipc-main/
*/
const { ipcRenderer, clipboard, remote } = require("electron");

const Utils = remote.require("./utils.js");
const MenuHandler = require("../../handlers/menu");
const emitter = require("../../common/globalEvents");
const cWindow = require("../window/window.render");

const sharedObj = remote.getGlobal("sharedObj");

let captureCallback;
let cancelCallback;
let appCapture = null;
appCapture = sharedObj ? sharedObj.appCapture : null;

let isHide = false;
let isBusy = false;

function setCallback(callback) {
  captureCallback = callback;
}

function setCancelCallback(callback) {
  cancelCallback = callback;
}

function take(isHideWindow, isHideBefore) {
  try {
    if (isBusy) {
      return;
    }
    isBusy = true;
    appCapture.screenCapture("", isHideWindow, (result) => {
      let data = result;
      if (result === "image") {
        const clipboardData = clipboard.readImage();
        data = clipboardData.toDataURL();
        data = Utils.splitBase64(data);
        if (captureCallback) {
          captureCallback(data);
        }
        cWindow.show();
        emitter.emit("onComplete", data);
      } else {
        if (cancelCallback) {
          cancelCallback();
        }
        if (!isHideBefore) {
          cWindow.show();
        }
        emitter.emit("onCancel");
      }
      isBusy = false;
    });
  } catch (ex) {
    // logger.error(ex.toString());
  }
}

const takeScreenshot = (isHideWindow, isHideBefore) => {
  isHideWindow = Boolean(isHideWindow);
  if (isHideWindow) {
    cWindow.hide();
    ipcRenderer.send("screenshot-hide", 300);
  } else {
    take(isHideWindow, isHideBefore);
  }
};

const captureScreen = (onComplete, onCancel) => {
  try {
    appCapture.screenCapture("", (result) => {
      let data = result;
      if (result === "image") {
        const clipboardData = clipboard.readImage();
        data = clipboardData.toDataURL();
        // data = {dataURL: data, base64: ,size, type};
        data = Utils.splitBase64(data);
        if (onComplete) {
          onComplete(data);
        } else {
          emitter.emit("onComplete", data);
        }
        if (captureCallback) {
          captureCallback(data);
        }
      } else {
        if (onCancel) {
          onCancel(data);
        } else if (cancelCallback) {
          emitter.emit("onCancel");
        }
        if (cancelCallback) {
          cancelCallback();
        }
      }
    });
  } catch (ex) {
    // logger.error(ex.toString());
  }
};

function setShortcut(shortcut) {
  ipcRenderer.send("set-screenshot-shortcut", shortcut);
}

ipcRenderer.on("takeScreenshot", (/* event */) => {
  const isHideBefore = !cWindow.isVisible() || !cWindow.isFocused();
  takeScreenshot(isHide, isHideBefore);
});

ipcRenderer.on("takeScreenshot-hide", (/* event */) => {
  take(false, false);
});

ipcRenderer.on("enableScreenshot", (event, enabled) => {
  MenuHandler.enableScreenshot(enabled);
});

function setHideWindow(isHideWindow) {
  isHide = isHideWindow;
}

module.exports = {
  start: takeScreenshot,
  setHideWindow,
  captureScreen,
  setShortcut,
  setEnabled(enabled) {
    ipcRenderer.send("toggle-screenshot-shortcut", enabled);
  },
  setCallback,
  setCancelCallback,
};
