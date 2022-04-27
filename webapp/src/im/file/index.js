// eslint-disable-next-line import/no-dynamic-require
const file = require(`./${IS_DESKTOP ? 'desktop' : 'web'}`).default;
export default file;
