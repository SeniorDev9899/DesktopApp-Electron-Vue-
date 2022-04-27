const { webapp, runShell } = require('./tools');
const config = require('../src/config');
const { write, flush } = require('../webapp/scripts/parser');

(async () => {
    const [proxyPort] = process.argv.slice(2, 3);
    // pc时debug，vue.config.js用此端口做本地资源文件代理。
    write('proxy', proxyPort);
    write('appserver', config.APP_SERVER);

    flush();
    runShell('npm run dev desktop', webapp);
})();
