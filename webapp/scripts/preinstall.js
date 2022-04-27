const fs = require('fs');
const path = require('path');

const target = path.join(__dirname, './build.conf');
const exists = fs.existsSync(target);

if (!exists) {
    try {
        const conf = fs.readFileSync(path.join(__dirname, './build.template.conf'));
        fs.writeFileSync(target, conf);
    } catch (error) {
        process.stderr.write(error);
        process.exit(1);
    }
}
