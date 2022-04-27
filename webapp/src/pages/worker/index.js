import './css/work.scss';

import config from './config';
import locale from './locale';

import browserWindow from './browserWindow';

import initUtils from './utils';
import initServer from './server';
import initApp from './work';

const RongWork = {
    locale,
    config,
    browserWindow,
};

initUtils(RongWork);
initServer(RongWork);
initApp(RongWork);

if (IS_DESKTOP) {
    RongDesktop.Win.on('maximize', () => {
        if (RongWork.instance) {
            RongWork.instance.isMaxWindow = true;
        }
    });
    RongDesktop.Win.on('unmaximize', () => {
        if (RongWork.instance) {
            RongWork.instance.isMaxWindow = false;
        }
    });
}

window.RongWork = RongWork;

RongWork.init('#work');
