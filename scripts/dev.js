const { join } = require('path');
const { fork } = require('child_process');
const { root, runShell, sleep } = require('./tools');
const config = require('../src/config');

const { portIsOccupied } = require('../src/libs');

let proxyPort = config.DEFAULT_PORT;
const devPortObj = {};
const subModules = [config.IM_SUB_MODULE, config.SEALMEETING_SUB_MODULE];

(async () => {
    proxyPort = await portIsOccupied(config.DEFAULT_PORT);
    let devSuccessIndex = 0;

    const devComplete = async () => {
        devSuccessIndex += 1;
        if (devSuccessIndex === subModules.length) {
            const webappPort = devPortObj[config.IM_SUB_MODULE];
            const sealmeetingPort = devPortObj[config.SEALMEETING_SUB_MODULE];
            await sleep(1000);
            runShell(`electron . dev ${webappPort} ${sealmeetingPort}`, root);
        }
    };

    runRender(config.IM_SUB_MODULE, devComplete);
    setTimeout(() => {
        runRender(config.SEALMEETING_SUB_MODULE, devComplete);
    }, 1000);
})();

function runRender(moduleName, callback) {
    const renderer = fork(join(__dirname, `dev_${moduleName}.js`), [proxyPort], { silent: true });
    renderer.stdout.pipe(process.stdout);
    renderer.stderr.pipe(process.stderr);
    renderer.stdout.on('data', (data) => {
        const message = data.toString();
        const regArr = /http:\/{2}localhost:\d+/g.exec(message);
        if (regArr) {
            renderer.stdout.removeAllListeners('data');
            devPortObj[moduleName] = /\d+/.exec(regArr[0])[0];
            callback();
        }
    });
}
