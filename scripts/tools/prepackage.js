const config = require('../../src/config');
const { runShell, webapp, sealmeeting } = require('../tools');

const runWebapp = () => {
    const { write, flush } = require('../../webapp/scripts/parser');
    write('appserver', config.APP_SERVER);

    flush();

    runShell('npm run build desktop', webapp);
};

const runSealmeeting = () => {
    runShell('npm run web:build', sealmeeting);
};


(async () => {
    // 环境信息
    // write('version', config.APP_VERSION);
    // write('versioncode', config.APP_VERSION_CODE);
    // write('appname', config.APP_NAME);
    runWebapp();
    runSealmeeting();
})();
