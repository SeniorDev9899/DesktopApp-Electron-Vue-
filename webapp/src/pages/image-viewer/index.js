import './css/image-viewer.scss';

import config from './config';
import locale from './locale';
import drag from './drag';

import initPlatfrom from './platform';
import initUtils from './utils';
import initImageViewer from './image-viewer';
import initViewer from './viewer';

const ImageViewer = {
    config,
    locale,
    components: {},
    dialog: {},
    drag,
};

initPlatfrom(ImageViewer);
initUtils(ImageViewer);
initImageViewer(ImageViewer);
initViewer(ImageViewer);

// web 依赖全局挂载 ImageViewer
window.ImageViewer = ImageViewer;

if (IS_DESKTOP) {
    ImageViewer.init(config, '#viewer');
}
