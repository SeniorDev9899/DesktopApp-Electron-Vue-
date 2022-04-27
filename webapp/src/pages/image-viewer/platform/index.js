// eslint-disable-next-line import/no-dynamic-require
const initPlatform = require(`./${IS_DESKTOP ? 'desktop' : 'web'}`).default;
export default initPlatform;
