import getQuerystr from '../utils/getQuerystr';
import config from '../config';
// import { getAppKey, getNaviURL } from '../cache/helper';

const noop = $.noop;

export default {
    max: noop,
    min: noop,
    restore: noop,
    close: noop,
    hide: noop,
    show: noop,
    flashFrame: noop,
    shakeWindow: noop,
    isFocused: noop,
    isVisible: noop,
    displayBalloon: noop,
    updateBadgeNumber: noop,
    toggleDevTools: noop,
    openWork({ conversationType, targetId }, auth) {
        const query = {
            userId: auth.id,
            code: auth.code,
            language: config.locale,
            conversationType,
            targetId,
        };
        const querystr = getQuerystr(query);
        const url = `./worker.html?${querystr}`;

        const a = document.createElement('A');
        a.target = '_blank';
        a.href = url;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    },
    closeWork() {
        // TOOD: web 如何关闭工作窗口 postMessage ?
    },
    openSealMeeting() {
        // const querystr = getQuerystr({
        //     appkey: getAppKey(),
        //     navi: getNaviURL(),
        // });
        // const querystr = getQuerystr(params);
        // const url = `./index.html?${querystr}`;

        // const a = document.createElement('sealmeeting');
        // a.target = '_blank';
        // a.href = url;
        // document.body.appendChild(a);
        // a.click();
        // document.body.removeChild(a);
    },
    closeSealMeeting() {

    },
    openPSArticle(url) {
        const a = document.createElement('A');
        a.target = '_blank';
        a.href = url;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    },
    openVersions() {
        const url = './versions.html';
        const a = document.createElement('A');
        a.target = '_blank';
        a.href = url;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    },
    closeAll() {},
    enterPublic() {},
    // sendPublicMessage() {},
    sendPublicNotify() {},
};
