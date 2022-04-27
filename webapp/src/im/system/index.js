// eslint-disable-next-line import/no-dynamic-require
const system = require(`./${IS_DESKTOP ? 'desktop' : 'web'}`).default;
export default system;
