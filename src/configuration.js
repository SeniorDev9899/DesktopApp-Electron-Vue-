
const { app } = require('electron');
const fs = require('fs');
const nconf = require('nconf');

const configPath = `${app.getPath('userData')}/setting_rong.json`;
let config;
try {
    config = nconf.file({
        file: configPath,
    });
} catch (exception) {
    fs.unlinkSync(configPath);
    config = nconf.file({
        file: configPath,
    });
}

function saveSettings(settingKey, settingValue) {
    config.set(settingKey, settingValue);
    config.save();
}

function readSettings(settingKey) {
    config.load();
    return config.get(settingKey);
}

module.exports = {
    saveSettings,
    readSettings,
};
