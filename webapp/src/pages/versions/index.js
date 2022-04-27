import './css/appversion.scss';

import config from './config';
import locale from './locale';
import browserWindow from './browserWindow';

import initUtils from './utils';
import initServerApi from './server';
import initApp from './appversion';

const RongAppversion = {
    config,
    locale,
    browserWindow,
};

initUtils(RongAppversion);
initServerApi(RongAppversion);
initApp(RongAppversion);

RongAppversion.init('#appversion');
