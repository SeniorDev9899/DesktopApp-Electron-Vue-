/* eslint-disable no-param-reassign */
import config from '../config';
import locale from '../locale';
import sortAppDialog from './sort-app-dialog.vue';

export default {
    name: 'edit-otherapp',
    data() {
        return {
            allApps: [],
            selectedApps: [], // 选中的apps
            oldSelectIdList: [],
            sortAppshowDia: false, // dialog
            // 分类的应用
            baseApps: [], // 基础应用
            otherApps: [], // 其他应用（不带分类）
            otherAppsTypes: [], // 其他应用（带分类）
        };
    },
    computed: {
        locale() {
            return locale[config.locale];
        },
    },
    components: {
        'sort-app-dialog': sortAppDialog,
    },
    mounted() {
        const context = this;
        const userId = window.RongWork.instance.query.userId;
        const browserWindow = window.RongWork.browserWindow;
        // 获取分类的应用列表
        getAppList(context);
        // 获取常用的应用列表
        getLikeAppList(context, userId);
        browserWindow.onPublicNotify((/** notify */) => {
            getAppList(context);
            getLikeAppList(context, userId);
        });
    },
    methods: {
        isSelected(app) {
            const context = this;
            let selected = false;
            context.selectedApps.forEach((item) => {
                if (app.id === item.id) {
                    selected = true;
                }
            });
            return selected;
        },
        add(app) {
            const context = this;
            if (!context.isSelected(app)) {
                context.selectedApps.push(app);
            }
        },
        remove(app) {
            const context = this;
            const index = context.selectedApps.indexOf(app);
            context.selectedApps.splice(index, 1);
        },
        save() {
            const { utils, serverApi } = window.RongWork;
            const context = this;
            const oldSelectIdList = context.oldSelectIdList;
            const selectedIdList = context.selectedApps.map(item => item.id);
            const removeList = utils.without(oldSelectIdList, selectedIdList);
            const addList = utils.without(selectedIdList, oldSelectIdList);
            const promisList = [];
            if (addList.length >= 0) {
                const addPromist = serverApi.addFavApp(selectedIdList);
                promisList.push(addPromist);
            }
            if (removeList.length > 0) {
                const removePromis = serverApi.removeFavApp(removeList);
                promisList.push(removePromis);
            }
            $.when.apply(null, promisList).always(() => {
                context.$emit('complete');
            });
        },
        // 排序点击
        sortAppClick() {
            const context = this;
            context.sortAppshowDia = true;
            context.$nextTick(() => {
                context.$refs.sortAppDiaRef.init();
            });
        },
        // 排序点击保存
        sortChange(list) {
            const context = this;
            context.selectedApps = list;
        },
    },
};

/**
 * 获取常用的应用
 * @param {*} context
 * @param {*} userId
 */
function getLikeAppList(context, userId) {
    const serverApi = window.RongWork.serverApi;
    serverApi.getFavApps(userId, (errorCode, result) => {
        if (errorCode) {
            return;
        }
        context.allApps = result.apps;
        // 获取我常用的应用列表
        serverApi.getLikeApps((error, likeAppResult) => {
            if (error) {
                return;
            }
            const likeApps = [];
            likeAppResult.apps.forEach((item) => {
                const likeAppDetail = context.allApps.filter(detail => detail.id === item) || {};
                likeApps.push(likeAppDetail[0]);
            });
            context.selectedApps = likeApps;
            context.oldSelectIdList = likeApps.map(item => item.id);
        });
    });
}
/**
 * 获取分类的应用（不包括常用应用）
 * @param {*} context
 */
function getAppList(context) {
    const serverApi = window.RongWork.serverApi;
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
            context.otherAppsTypes = Array.isArray(r.type2.types) ? r.type2.types : [];
        } else {
            context.otherApps = [];
            context.otherAppsTypes = [];
        }
    });
}
