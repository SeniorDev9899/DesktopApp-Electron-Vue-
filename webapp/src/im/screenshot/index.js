// eslint-disable-next-line import/no-dynamic-require
const screenshot = require(`./${IS_DESKTOP ? 'desktop' : 'web'}`).default;
export default screenshot;
