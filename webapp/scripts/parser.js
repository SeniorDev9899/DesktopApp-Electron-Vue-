const path = require('path');
const fs = require('fs');
const { ConfigIniParser } = require('config-ini-parser');

const parser = new ConfigIniParser('\n');
const config = path.join(__dirname, './build.conf');
try {
    const iniContent = fs.readFileSync(config, 'utf-8');
    parser.parse(iniContent);
} catch (error) {
    process.stdout.write('error' + error);
    process.stdout.write('请先运行 npm install 以安装依赖并初始化配置！！\n\n');
    process.exit(1);
}

module.exports = {
    read(key) {
        return parser.get('base', key);
    },
    write(key, value) {
        parser.set('base', key, value);
    },
    flush() {
        fs.writeFileSync(config, parser.stringify().replace(/=/g, ' = '));
    },
};
