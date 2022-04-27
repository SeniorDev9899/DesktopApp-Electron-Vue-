const config = require('../../common/cachePath').upload;

const RangeUtils = {
    setItem: (key, data) => {
        config.rangeConf[key] = data;
        config.flush();
    },
    getItem: key => config.rangeConf[key],
    removeItem: (key) => {
        const { rangeConf } = config;
        delete rangeConf[key];
        config.flush();
    },
    hasOwnProperty: key => Object.prototype.hasOwnProperty.call(config.rangeConf, key),
};

module.exports = RangeUtils;
