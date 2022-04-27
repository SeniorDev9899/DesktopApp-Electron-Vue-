const { join } = require('path');
const log4js = require('log4js');

const app = process.type === 'browser'
    ? require('electron').app
    : require('electron').remote.app;

const logPath = join(app.getPath('userData'), 'logs');

const conf = name => ({
    type: 'dateFile',
    filename: join(logPath, `${name}.log`),
    pattern: '.yyyy-MM-dd',
    encoding: 'utf-8',
    keepFileExt: true,
    alwaysIncludePattern: true,
});

log4js.configure({
    appenders: {
        default: { type: 'stdout' },
        app: conf('app'),
        screenshot: conf('screenshot'),
    },
    categories: {
        default: {
            appenders: ['default'],
            level: 'DEBUG',
        },
        app: {
            appenders: ['default', 'app'],
            level: 'DEBUG',
        },
        screenshot: {
            appenders: ['default', 'screenshot'],
            level: 'DEBUG',
        },
    },
});

const appLogger = log4js.getLogger('app');
const screenshotLogger = log4js.getLogger('screenshot');

module.exports = {
    appLogger,
    screenshotLogger,
};
