const { read } = require('./parser');

// const packageInfo = require('../package.json');
// 其他运行时需要使用的配置信息
// const VERSION_CODE = read('versioncode');
// 字符串信息需要再以 " 包裹，因 webpack 是字符串直接替换，否则编译失败
// const VERSION = JSON.stringify(packageInfo.version);
const APP_SERVER = JSON.stringify(read('appserver'));
// 运行时环境：Desktop or Web
const IS_DESKTOP = read('runtime') === 'desktop';
// 构件时系统类型
// const OS = JSON.stringify('MacOSX');

module.exports = {
    IS_DESKTOP, APP_SERVER
};
