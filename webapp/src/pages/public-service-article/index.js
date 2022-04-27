/* eslint-disable no-param-reassign */
import './css/index.scss';

const RPSA = {
    config: {},
    browserWindow: {
        max() {
            RongDesktop.Win.max();
        },
        min() {
            RongDesktop.Win.min();
        },
        restore() {
            RongDesktop.Win.restore();
        },
        close() {
            RongDesktop.Win.close();
        },
        platform: RongDesktop.platform,
        openLocaleBrowser(url) {
            RongDesktop.shell.openExternal(url);
        },
        onReload(callback) {
            RongDesktop.ipcRenderer.on('reload', (event, url) => {
                callback(url);
            });
        },
    },
};

RongDesktop.Win.on('maximize', () => {
    if (RPSA.instance) {
        RPSA.instance.isMaxWindow = true;
    }
});
RongDesktop.Win.on('unmaximize', () => {
    if (RPSA.instance) {
        RPSA.instance.isMaxWindow = false;
    }
});

function init(config) {
    const browserWindow = RPSA.browserWindow;
    const psAticle = new Vue({
        el: config.el,
        data: {
            canGoBack: false,
            isMaxWindow: false,
        },
        computed: {
            os() {
                return browserWindow.platform;
            },
        },
        mounted() {
            const context = this;
            Vue.nextTick(() => {
                if (context.$refs.browser) {
                    const query = getQuery();
                    const browser = context.$refs.browser;
                    initBrowser(browser, query, context);
                }
            });
            browserWindow.onReload((url) => {
                if (context.$refs.browser) {
                    const query = getQuery(url);
                    const browser = context.$refs.browser;
                    initBrowser(browser, query, context);
                }
            });
        },
        methods: {
            min() {
                browserWindow.min();
            },
            max() {
                browserWindow.max();
                this.isMaxWindow = true;
            },
            restore() {
                browserWindow.restore();
                this.isMaxWindow = false;
            },
            close() {
                browserWindow.close();
            },
            copyUrl() {
                const url = this.$refs.browser.getURL();
                copyToClipboard(url);
            },
            openUrl() {
                const url = this.$refs.browser.getURL();
                browserWindow.openLocaleBrowser(url);
            },
            goBack() {
                const browser = this.$refs.browser;
                browser.goBack();
            },
            reload() {
                const browser = this.$refs.browser;
                browser.reload();
            },
        },
    });
    RPSA.instance = psAticle;
}

function initBrowser(browser, query, context) {
    browser.src = query.url;
    browser.addEventListener('did-navigate', () => {
        context.canGoBack = browser.canGoBack();
    });
    browser.addEventListener('new-window', (event) => {
        const url = event.url;
        if (url.startsWith('http:') || url.startsWith('https:')) {
            RongDesktop.shell.openExternal(url);
        }
    });
}

// 复制到剪切板
function copyToClipboard(str) {
    if (window.copy) {
        window.copy(str);
    } else if (document.execCommand) {
        const input = document.createElement('input');
        input.style.position = 'fixed';
        input.style.top = '-99999999px';
        const $input = $('<textarea></textarea>').css({
            position: 'fixed',
            left: '-99999999px',
        });
        $(document.body).append($input);
        $input.val(str);
        $input.select();
        document.execCommand('copy');
        $input.remove();
    }
}

function getQuery(url) {
    let search = window.location.search;
    if (url) {
        search = url.substring(url.indexOf('?'));
    }
    const query = {};
    const str = search.substring(1);
    str.split('&').forEach((item) => {
        const arr = item.split('=');
        query[arr[0]] = decodeURIComponent(arr[1]);
    });
    return query;
}

$(() => {
    const config = {
        el: document.getElementById('rong-psarticle'),
    };
    init(config);
});
