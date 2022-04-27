const screenshot = {
    start: RongDesktop.screenshot.start,
    setShortcut: RongDesktop.screenshot.setShortcut,
    setHideWindow: RongDesktop.screenshot.setHideWindow,
    setEnabled: RongDesktop.screenshot.setEnabled,
    setCallback: RongDesktop.screenshot.setCallback,
    setCancelCallback: RongDesktop.screenshot.setCancelCallback,
    // 用于区别 窗口隐藏时截图 还是 截图时选择了隐藏窗口
    winShow: false,
};

RongDesktop.screenshot.onComplete = function onComplete(data) {
    if (screenshot.onComplete) {
        screenshot.onComplete(data);
    }
};

RongDesktop.screenshot.onCancel = function onCancel() {
    if (screenshot.onCancel) {
        screenshot.onCancel();
    }
};


export default screenshot;
