/* eslint-disable import/extensions */
import './css/voip.scss';

import './config.js';
import './js/locale/zh.js';
import './js/locale/en.js';
import './js/imsdk.js';
import './js/desktop.js';
import './js/voip.js';

$(() => {
    const config = {
        el: '#voip',
    };
    $(config.el).show();
    // eslint-disable-next-line no-undef
    Voip.init(config);
});
