const fs = require('fs');
const path = require('path');

const IMAGE_PATH = path.join(__dirname, 'images');
const IMAGE_NAMES = fs.readdirSync(IMAGE_PATH);
const TPL = {
    name: '{{0}}.png',
    url: 'file://{{0}}',
};

/**
 * 根据unicode获取emoji地址
 * @param  {array | string} names unicode数组或字符串
 * @return {array | string}
 */
const getEmojiImg = (names) => {
    let tmpNames = typeof names === 'string' ? [names] : names;
    tmpNames = tmpNames.map((temp) => {
        let name = temp.replace('u', '');
        name = TPL.name.replace('{{0}}', name);
        if (IMAGE_NAMES.indexOf(name) !== -1) {
            let url = path.join(IMAGE_PATH, name);
            url = TPL.url.replace('{{0}}', url);
            url = url.replace(/\\/g, '/');
            return url;
        }
        return '';
    });
    return tmpNames.length === 1 ? tmpNames[0] : tmpNames;
};

module.exports = getEmojiImg;
