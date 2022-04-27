/* eslint-disable no-param-reassign */
import config from './config';
import locale from './locale';

export default function (RongAppversion) {
    const utils = RongAppversion.utils;
    const cache = utils.cache;
    const serverApi = RongAppversion.serverApi;

    function init(el) {
        cache.setKeyNS(config.appkey);
        const pcWin = RongAppversion.browserWindow;
        // eslint-disable-next-line no-new
        new Vue({
            el,
            data: {
                config,
                isMaxWindow: false,
                versionList: [],
                selected: null,
            },
            computed: {
                os() {
                    return pcWin.platform;
                },
                locale() {
                    return locale[config.locale];
                },
                selectedNote() {
                    const note = this.selected.release_note;
                    // note = '当前版本的描述\n当前版本的描述\n当前版本的描述\n当前版本的描述\n当前版本的描述\n';
                    return note.split('\n').filter(item => item);
                },
            },
            methods: {
                min() {
                    pcWin.min();
                },
                max() {
                    pcWin.max();
                    this.isMaxWindow = true;
                },
                restore() {
                    pcWin.restore();
                    this.isMaxWindow = false;
                },
                close() {
                    pcWin.close();
                },
                getTime(version) {
                    const timestamp = version.create_dt;
                    return utils.dateFormat(timestamp, {
                    // alwaysShowTime: true
                    });
                },
                selectVersion(version) {
                    this.selected = version;
                },
            },
            mounted() {
                setupVersionList(this);
            },
        });
    }

    function setupVersionList(context) {
        serverApi.getAppVersions((errorCode, result) => {
            if (errorCode) {
                console.warn(errorCode);
                return;
            }
            context.versionList = result;
            context.selected = context.versionList[0];
        });
    }

    RongAppversion.init = init;
}
