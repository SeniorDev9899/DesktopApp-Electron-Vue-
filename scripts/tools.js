const { execSync } = require('child_process');
const { join } = require('path');
const config = require('../src/config');
/**
 * @param {String} cmd
 * @param {String} cwd
 */
module.exports.runShell = (cmd, cwd) => execSync(cmd, { stdio: 'inherit', cwd });

module.exports.root = join(__dirname, '..');
module.exports.webapp = join(__dirname, `../${config.IM_SUB_MODULE}`);
module.exports.sealmeeting = join(__dirname, `../${config.SEALMEETING_SUB_MODULE}`);

module.exports.sleep = millisecond => new Promise((resolve) => {
    setTimeout(resolve, millisecond);
});
