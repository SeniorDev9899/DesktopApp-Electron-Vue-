// eslint-disable-next-line import/no-dynamic-require
const imageViewer = require(`./${IS_DESKTOP ? 'desktop' : 'web'}`).default;
export default imageViewer;
