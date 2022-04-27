const path = require('path');
const express = require('express');

const { portIsOccupied } = require('../../libs');
const router = require('./router');
const { appLogger } = require('../../common/logger');
const config = require('../../config');
// TODO: 整合 logger 工具，封装等级常量
const INFO = 'info';
const ERROR = 'error';
const WARN = 'warn';
/**
 * 写日志
 * @param {String} level 日志登录
 * @param {String} message 日志内容
 */
function writeLog(level, message) {
    appLogger[level.toLowerCase()](`[ProxyServer ${level.toUpperCase()}] ${message}`);
}

/**
 * 创建代理服务
 * @param {Number} defaultPort 默认监听端口
 * @param {String} userDir 用户缓存目录
 * @returns {Promise<Number>} 所监听的端口
 */
async function createLocalServer(defaultPort, userDir) {
    writeLog(INFO, `查找可用端口，初始端口：${defaultPort}`);
    const port = await portIsOccupied(defaultPort);
    const app = express();
    // 拒绝所有非本机请求
    app.use((req, res, next) => {
        const { remoteAddress, remoteFamily, localAddress } = req.socket;
        if (remoteAddress !== localAddress) {
            writeLog(WARN, `警告!!! ${remoteFamily}-${remoteAddress} 正试图向代理服务发起请求！`);
            res.sendStatus(403);
            return;
        }
        next();
    });
    // const staticRoot = path.join(__dirname, '../../../webapp/dist');
    const staticRoot = path.join(__dirname, `../../../${config.IM_SUB_MODULE}/dist`);
    const sealmeetingRoot = path.join(__dirname, `../../../${config.SEALMEETING_SUB_MODULE}/dist`);
    // 应用所需静态资源
    app.use(express.static(staticRoot));
    app.use('/meeting', express.static(sealmeetingRoot));
    // 代理服务路由解析
    app.use(router(userDir));
    // 记录异常并处理，异常处理中间件需定义 4 个形参
    // eslint-disable-next-line no-unused-vars
    app.use((error, req, res, next) => {
        writeLog(ERROR, `${req.method} ${req.url} ${error.stack}`);
        res.status(500).send(error.stack);
    });
    return new Promise((resolve) => {
        app.listen(port, () => resolve(port));
    });
}
module.exports = createLocalServer;
