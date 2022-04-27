const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');
const run = require('./run');

const isGit = fs.existsSync(path.join(__dirname, '../.git'));
if (isGit) {
    const commitId = execSync('git rev-parse HEAD').toString();
    const writer = fs.createWriteStream(path.join(__dirname, '../public/version.txt'));
    writer.write(commitId, () => {
        run('vue-cli-service build');
    });
} else {
    run('vue-cli-service build');
}
