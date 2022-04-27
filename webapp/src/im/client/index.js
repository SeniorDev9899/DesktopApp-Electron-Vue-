// eslint-disable-next-line import/no-dynamic-require
const client = require(`./${IS_DESKTOP ? 'desktop' : 'web'}`).default;
export default client;
