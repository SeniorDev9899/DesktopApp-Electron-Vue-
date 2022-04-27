const fs = require('fs');
const path = require('path');

function copy(file, target) {
    const exists = fs.existsSync(target);
    if (!exists) {
        const writeable = fs.createWriteStream(target);
        const readable = fs.createReadStream(file);
        readable.pipe(writeable);
    }
}

(() => {
    // 拷贝配置模板
    copy(path.join(__dirname, './app.tmp.conf'), path.join(__dirname, '../../src/app.conf'));
    copy(path.join(__dirname, './sign.tmp.conf'), path.join(__dirname, '../../src/sign.conf'));
})();
