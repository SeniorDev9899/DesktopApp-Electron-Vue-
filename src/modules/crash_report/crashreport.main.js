
const {
    crashReporter,
    app,
} = require('electron');
const path = require('path');
const Config = require('../../config');

const uploadToServer = !!Config.REPORT_URL;

crashReporter.start({
    productName: Config.APP_NAME,
    companyName: Config.AUTHOR,
    submitURL: Config.REPORT_URL,
    uploadToServer,
    crashesDirectory: path.resolve(app.getPath('userData'), 'crashes'),
    extra: {
        versionCode: Config.APP_VERSION_CODE,
        version: Config.APP_VERSION,
        rceServer: Config.APP_SERVER,
    },
});
