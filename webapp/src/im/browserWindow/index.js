// eslint-disable-next-line import/no-dynamic-require
const browserWindow = require(`./${IS_DESKTOP ? 'desktop' : 'web'}`).default;
export default browserWindow;
