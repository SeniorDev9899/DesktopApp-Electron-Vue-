const { sealmeeting, runShell } = require('./tools');

(async () => {
    runShell('npm run web:serve', sealmeeting);
})();
