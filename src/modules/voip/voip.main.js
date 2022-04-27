
const {
    app,
    ipcMain,
} = require('electron');
const VoipWindow = require('../../windows/voip');
const logger = require('../../common/logger');

const { voipLogger } = logger;
const levelsArr = ['debug', 'info', 'warn', 'error'];
let voipWindow = null;

const createVoipWindow = (options, parentWindow) => {
    voipWindow = new VoipWindow(options, parentWindow);
};

const initIpcVoipEvents = (rceWindow) => {
    ipcMain.on('openVoip', (event, options) => {
        createVoipWindow(options, rceWindow);
    });
    ipcMain.on('voipReady', (event, winid) => {
        rceWindow.voipReady(winid);
    });
    ipcMain.on('voipRequest', (event, params) => {
        rceWindow.voipRequest(params);
    });
    ipcMain.on('voipSetBounds', (event, params) => {
        if (voipWindow) {
            voipWindow.setBounds(params);
        }
    });
    ipcMain.on('setRingPos', () => {
        if (voipWindow) {
            voipWindow.setRingPos();
        }
    });
    ipcMain.on('IMRequest', (event, params) => {
        if (voipWindow) {
            voipWindow.IMRequest(params);
        }
    });
    ipcMain.on('showVoip', () => {
        if (voipWindow) {
            voipWindow.show();
        }
    });
    ipcMain.on('toggleDevToolsVoip', () => {
        if (voipWindow) {
            voipWindow.toggleDevTools();
        }
    });
    ipcMain.on('voipLog', (event, levels, log) => {
        let tempLevel;
        if (levels && levelsArr.indexOf(levels.toLowerCase()) > -1) {
            tempLevel = levels.toLowerCase() || 'info';
        } else {
            tempLevel = 'info';
        }
        voipLogger[tempLevel](log);
    });
};

const initApp = () => {
    // app.on('ready', appReady);
    app.on('before-quit', () => {
        if (voipWindow) {
            voipWindow.close();
            // winVoip.destroy();
            console.log('voipWindow before-quit!');
        }
    });
};

module.exports = {
    init: (win) => {
        initApp();
        initIpcVoipEvents(win);
    },
};
