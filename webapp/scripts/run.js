const { execSync } = require('child_process');
const { write, flush } = require('./parser');

const target = process.argv[2] || 'web';
write('runtime', target);
flush();

const run = (cmd, cwd) => execSync(cmd, { cwd, stdio: 'inherit' });

module.exports = run;
