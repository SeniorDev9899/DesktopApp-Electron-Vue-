const fs = require('fs');
const path = require('path');

function getMatches(source) {
    return source.match(/<!--#include[^\n].+/g);
}

function transSource(source, parentDir) {
    const matches = getMatches(source);
    if (!matches) {
        return source;
    }
    let result = source;
    matches.forEach((key, index) => {
        const filePath = path.join(parentDir, key.replace(/(^<!--#include\s+virtual=")|("\s+-->)/g, ''));
        const fileContent = fs.readFileSync(filePath).toString();
        const parent = path.join(filePath, '..');
        result = result.replace(matches[index], transSource(fileContent, parent));
    });
    return result;
}

/**
 * @param {String} source
 */
module.exports = source => transSource(source, path.join(__dirname, '../public'));
