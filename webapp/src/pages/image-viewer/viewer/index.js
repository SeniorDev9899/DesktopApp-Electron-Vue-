// eslint-disable-next-line import/no-dynamic-require
const initViewer = require(`./viewer_${IS_DESKTOP ? 'pc' : 'web'}`).default;
export default initViewer;
