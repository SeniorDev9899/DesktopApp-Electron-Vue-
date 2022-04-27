// eslint-disable-next-line import/no-dynamic-require
const Instercepter = require(`./${IS_DESKTOP ? 'desktop' : 'web'}`).default;
export default Instercepter;
