import config from './config';
import locale from './locale';
import editOtherapp from './components/edit-otherapp.vue';
import template from './components/app.shtml';

/* eslint-disable no-param-reassign */
export default function (RongWork) {
    const utils = RongWork.utils;
    const serverApi = RongWork.serverApi;
    let confirmeQuit = false;

    function getCurrentWebview(context) {
        const webview = context.$refs[context.currentTab.id];
        if ($.isArray(webview)) {
            return webview[0];
        }
        return webview;
    }

    function init(el) {
        const browserWindow = RongWork.browserWindow;
        const isDesktop = browserWindow.getPlatform() !== 'web';
        const work = new Vue({
            el,
            template,
            data: {
                busy: false,
                config,
                query: {},
                isMaxWindow: false,
                baseApps: [], // 基础apps
                otherApps: [], // 自建apps
                otherApps_types: [], // 自建apps 带分类的
                likeAppList: [], // 常用apps
                currentTab: null,
                tabList: [],
                location: window.location.href,
                canGoForward: false,
                canGoBack: false,
                canReload: false,
                isDesktop,
            },
            components: {
                editOtherapp,
            },
            created() {
                const context = this;
                browserWindow.onCommandClose(() => {
                    confirmeQuit = true;
                    browserWindow.close();
                });
                browserWindow.onPublicNotify((notify) => {
                    getAppList(context);
                    getLikeAppList(context);
                    context.removeTab(notify);
                });
            },
            computed: {
                tabWidth() {
                    const context = this;
                    let width = 0;
                    if (context.tabList.length > 0) {
                        width = 99 / context.tabList.length;
                        width = width > 50 ? 50 : width;
                    }
                    return `${width}%`;
                },
                locale() {
                    return locale[config.locale];
                },
                os() {
                    return browserWindow.getPlatform();
                },
                search() {
                    return window.location.search;
                },
                productName() {
                    return config.product.name[config.locale];
                },
                tabPadding() {
                    return `padding-left: ${isDesktop ? 110 : 20}px`;
                },
            },
            watch: {
                currentTab(newVal) {
                    if (newVal) {
                        const webview = getCurrentWebview(this);
                        let canGoBack = false;
                        let canGoForward = false;
                        if (webview) {
                            canGoBack = webview.canGoBack();
                            canGoForward = webview.canGoForward();
                        }
                        this.canGoBack = canGoBack;
                        this.canGoForward = canGoForward;
                        this.canReload = validUrl(newVal.pc_home_page_url);
                    }
                },
            },
            mounted() {
                const context = this;
                this.query = getQuery();
                const params = {
                    id: this.query.targetId,
                };
                getAppList(this);
                getLikeAppList(this);
                if (params.id) {
                    context.openApp(params);
                }
                browserWindow.reloadWork((path) => {
                    const newQuery = getQuery(path);
                    params.id = newQuery.targetId;
                    if (params.id) {
                        context.openApp(params);
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
                    if (!confirmeQuit) {
                        RongWork.browserWindow.focus();
                        // context.closeBefore = true;
                        utils.messagebox({
                            type: 'confirm',
                            message: this.locale.closeWorkTip,
                            callback() {
                                confirmeQuit = true;
                                browserWindow.close();
                            },
                        });
                    }
                },
                goBack() {
                    const webview = getCurrentWebview(this);
                    if (webview) {
                        webview.goBack();
                    }
                },
                goForward() {
                    const webview = getCurrentWebview(this);
                    if (webview) {
                        webview.goForward();
                    }
                },
                reload() {
                    const webview = getCurrentWebview(this);
                    if (webview) {
                        webview.reload();
                    }
                },
                removeTab(notify) {
                // 后台关闭后消息通知，移除当前已经打开的应用
                    const context = this;
                    const notifyApp = context.tabList.filter(item => item.id === notify.targetId);
                    if (context.isSelected(notifyApp[0])) {
                        utils.messagebox({
                            message: context.locale.theAppCloseTip,
                            callback() {
                                context.closeTab(notifyApp[0]);
                            },
                        });
                    } else if (notifyApp[0]) {
                        context.closeTab(notifyApp[0]);
                    }
                },
                closeTab(item) {
                    const index = this.tabList.indexOf(item);
                    this.tabList.splice(index, 1);
                    this.currentTab = this.tabList[0];
                },
                showPublicDetail(item) {
                    const valid = validUrl(item.pc_home_page_url);
                    if (!valid && item.type !== -1) {
                        return true;
                    }
                    return false;
                },
                isSelected(item) {
                    return item === this.currentTab && item !== undefined;
                },
                // 打开app
                openApp(app) {
                    const context = this;
                    let appIndex;
                    $.each(context.tabList, (index, value) => {
                        if (value.id === app.id) {
                            appIndex = index;
                        }
                    });
                    if (appIndex > -1) {
                        context.currentTab = context.tabList[appIndex];
                    } else if (app.type !== -1) {
                        serverApi.getPublicInfo(app.id, (errorCode, result) => {
                            if (errorCode) {
                                return;
                            }
                            if (context.tabList.indexOf(result) === -1) {
                                context.tabList.push(result);
                                Vue.nextTick(() => {
                                    initWebview(result, context);
                                });
                            }
                            context.currentTab = result;
                        });
                    } else {
                        context.tabList.push(app);
                        context.currentTab = app;
                        Vue.nextTick(() => {
                            initWebview(app, context);
                        });
                    }
                },
                enterPublic(app) {
                    const context = this;
                    if (!context.busy) {
                        context.busy = true;
                        browserWindow.enterPublic(app, () => {
                            context.busy = false;
                        });
                    }
                },
                edit() {
                    const editApp = {
                        name: this.locale.setCommonApp,
                        type: -1,
                    };
                    this.openApp(editApp);
                },
                reloadFavApp() {
                    this.closeTab(this.currentTab);
                    getAppList(this);
                    getLikeAppList(this);
                },
            },
        });
        // watchClose(work);
        RongWork.instance = work;
    }

    function validUrl(str) {
        const reg = /^(http|https):\/\/\S+$/;
        return reg.test(str);
    }

    function getQuery(path) {
        const query = {};
        if (path) {
            path = path.substring(path.indexOf('.html?') + 6);
        }
        const str = path || window.location.search.substring(1);
        str.split('&').forEach((item) => {
            const arr = item.split('=');
            query[arr[0]] = arr[1];
        });
        return query;
    }
    /**
     * 获取常用的应用
     * @param {*} context
     */
    function getLikeAppList(context) {
        const BaseApp = utils.appType.base; // 1

        const query = context.query;
        serverApi.getFavApps(query.userId, (errorCode, result) => {
            if (errorCode) {
                return;
            }
            result.apps.forEach((item) => {
            // eslint-disable-next-line eqeqeq
                if (item.type == 1) {
                    item.type = BaseApp;
                }
            });
            // context.baseApps = result.apps.filter(item => item.type === BaseApp && !item.favorite);
            // context.otherApps = result.apps.filter(item => item.type !== BaseApp && !item.favorite);
            serverApi.getLikeApps((error, likeAppResult) => {
                const likeAppId = likeAppResult.apps;
                const likeAppList = likeAppId.map((item) => {
                    const likeAppDetail = result.apps.filter(detail => detail.id === item);
                    return likeAppDetail[0];
                });
                context.likeAppList = likeAppList;
            });
        });
    }
    /**
     * 获取分类的应用数据（不包括常用的应用）
     * @param {*} context
     */
    function getAppList(context) {
        // ⽤户状态 0，正常 1，禁⽤，2，删除
        const data = {
            state: [0, 1],
        };
        // 获取所有分类及其一下的应用列表
        serverApi.getList_all(data, (errorCode, res) => {
            if (errorCode) {
                return;
            }
            const r = res;
            // 基础应用
            if (r && r.type1) {
                context.baseApps = Array.isArray(r.type1.apps) ? r.type1.apps : [];
            } else {
                context.baseApps = [];
            }
            // 其他应用
            if (r && r.type2) {
                context.otherApps = Array.isArray(r.type2.apps) ? r.type2.apps : [];
                context.otherApps_types = Array.isArray(r.type2.types) ? r.type2.types : [];
            } else {
                context.otherApps = [];
                context.otherApps_types = [];
            }
        });
    }

    function initWebview(item, context) {
        if (!item) {
            return;
        }
        const id = item.id;

        let webview = context.$refs[id];
        if ($.isArray(webview)) {
            webview = webview[0];
        }

        context.canGoBack = false;
        context.canGoForward = false;
        context.canReload = validUrl(item.pc_home_page_url);
        if (webview) {
            webview.addEventListener('did-navigate', () => {
                if (context.currentTab.id === id) {
                    context.canGoBack = webview.canGoBack();
                    context.canGoForward = webview.canGoForward();
                }
            });
            webview.addEventListener('new-window', (event) => {
                const url = event.url;
                if (url.startsWith('http:') || url.startsWith('https:')) {
                    RongDesktop.shell.openExternal(url);
                }
            });
        }
    }
    RongWork.init = init;
}
