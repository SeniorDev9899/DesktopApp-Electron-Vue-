const fs = require('fs');
const { ConfigIniParser } = require('config-ini-parser');

const sectionName = 'base';

module.exports = function ParseConf(path) {
    const content = fs.readFileSync(path, 'utf-8');
    const parser = new ConfigIniParser();
    parser.parse(content);
    const options = parser.options(sectionName);
    const conf = {};
    options.forEach((optionName) => {
        conf[optionName] = parser.get(sectionName, optionName);
    });
    return conf;
};
