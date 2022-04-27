const net = require('net');

/**
 * 查找可用端口号
 * @param {Number} port 起始端口
 * @returns {Promise<Number>} 可用的端口号
 */
function portIsOccupied(port) {
    const server = net.createServer().listen(port);
    return new Promise((resolve, reject) => {
        server.on('listening', () => {
            server.close();
            resolve(port);
        });
        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                const nextPort = port + 1;
                // 端口号 + 1 重试
                resolve(portIsOccupied(nextPort));
            } else {
                reject(err);
            }
        });
    });
}

module.exports = {
    portIsOccupied,
};
