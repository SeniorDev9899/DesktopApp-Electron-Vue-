
export const SERVER_CONFLIST_KEY = 'SERVER_CONFLIST_KEY';
export const SERVER_CONFLIST_KEY_ISSETDEFAULT = 'SERVER_CONFLIST_KEY_ISSETDEFAULT';
const { RongDesktop, config: setting } = window;
// 默认的服务地址的id
export const DEFAULT_SERVER_PATH_ID = 'DEFAULT_SERVER_PATH_ID';

export const Accessor = {
    getList() {
        // 初始化是否设置默认值变量
        const isSetDefault = window.localStorage.getItem(SERVER_CONFLIST_KEY_ISSETDEFAULT);
        if (isSetDefault === null) {
            window.localStorage.setItem(SERVER_CONFLIST_KEY_ISSETDEFAULT, false);
        }
        if (!isSetDefault) {
            // 设置默认值
            Accessor.setDefault();
            window.localStorage.setItem(SERVER_CONFLIST_KEY_ISSETDEFAULT, true);
        }
        let r = window.localStorage.getItem(SERVER_CONFLIST_KEY);
        if (!r) {
            Accessor.setList([]);
            r = window.localStorage.getItem(SERVER_CONFLIST_KEY);
        }
        return JSON.parse(r);
    },
    // 设置默认值（项目默认配置的服务地址）
    setDefault() {
        let r = window.localStorage.getItem(SERVER_CONFLIST_KEY);
        if (r) {
            r = JSON.parse(r);
        } else {
            r = [];
        }
        const getCheckedStatus = () => {
            let flag = true;
            r.forEach((item) => {
                if (item && item.id !== DEFAULT_SERVER_PATH_ID) {
                    if (item.checked === true) {
                        flag = false;
                    }
                }
            });
            return flag;
        };
        // 如果缓存中没有默认的地址，就添加
        if (!(r.some(item => item && item.name === delServerConfSuffix(getserverData())))) {
            r = [{
                id: DEFAULT_SERVER_PATH_ID, // id
                name: delServerConfSuffix(getserverData()), // 服务地址,删除/api后缀
                createTime: 0, // 创建时间
                isDefault: true, // 是否是项目配置文件的默认配置
                checked: getCheckedStatus(), // 是否是选中状态
            }, ...r];
        }
        // set
        Accessor.setList(r);
    },
    // 设置默认server地址
    setDefaultServer() {
        let r = window.localStorage.getItem(SERVER_CONFLIST_KEY);
        if (r) {
            r = JSON.parse(r);
        } else {
            r = [];
        }
        // 如果缓存中没有默认的地址，就添加
        if (!(r.some(item => item && item.name === delServerConfSuffix(getserverData())))) {
            r = [{
                id: DEFAULT_SERVER_PATH_ID, // id
                name: delServerConfSuffix(getserverData()), // 服务地址
                createTime: 0, // 创建时间
                isDefault: true, // 是否是项目配置文件的默认配置
                checked: true, // 是否是选中状态
            }, ...r];
        }
        r.forEach((l) => {
            const tmpL = l;
            if (tmpL.id === DEFAULT_SERVER_PATH_ID) {
                tmpL.checked = true;
            } else {
                tmpL.checked = false;
            }
        });
        // set
        Accessor.setList(r);
    },
    setList(list) {
        window.localStorage.setItem(SERVER_CONFLIST_KEY, JSON.stringify(list));
    },
    // 添加
    add(current) {
        const list = Accessor.getList();
        // const [defaultItem, ...others] = list;
        const r = [current, ...list];
        window.localStorage.setItem(SERVER_CONFLIST_KEY, JSON.stringify(r));
    },
    delete(current) {
        const list = Accessor.getList();
        const r = list.filter(item => item.id !== current.id);
        window.localStorage.setItem(SERVER_CONFLIST_KEY, JSON.stringify(r));
    },
    clear() {
        this.store.setItem(SERVER_CONFLIST_KEY, JSON.stringify([]));
    },
    isExist(current) {
        function isSameName(itemName, currentName) {
            if (itemName === currentName) return true;
            if (itemName.length > currentName.length) {
                if (itemName.endsWith('/')) {
                    const r = [
                        `${currentName}/`,
                        `${currentName}api/`,
                        `${currentName}/api/`,
                    ];
                    if (r.includes(itemName)) {
                        return true;
                    }
                    return false;
                }
                const r = [
                    currentName,
                    `${currentName}api`,
                    `${currentName}/api`,
                ];
                if (r.includes(itemName)) {
                    return true;
                }
                return false;
            }
            if (currentName.endsWith('/')) {
                const r = [
                    `${itemName}/`,
                    `${itemName}api/`,
                    `${itemName}/api/`,
                ];
                if (r.includes(currentName)) {
                    return true;
                }
                return false;
            }
            const r = [
                itemName,
                `${itemName}api`,
                `${itemName}/api`,
            ];
            if (r.includes(currentName)) {
                return true;
            }
            return false;
        }
        const list = Accessor.getList();
        const currentId = current.id;
        return list.some(item => (isSameName(item.name, current.name) && (item.id !== currentId)));
    },
    update(current) {
        const list = Accessor.getList();
        const r = list.findIndex(item => item.id === current.id);
        if (r > -1) {
            list.splice(r, 1, current);
        }
        window.localStorage.setItem(SERVER_CONFLIST_KEY, JSON.stringify(list));
    },
    // 设置选中
    setChecked(current, checked) {
        const list = Accessor.getList();
        list.forEach((item) => {
            const tmpItem = item;
            if (tmpItem.id === current.id) {
                tmpItem.checked = checked;
            } else {
                tmpItem.checked = false;
            }
        });
        Accessor.setList(list);
    },
    // 获取选中的item
    getCheckedItem() {
        const list = Accessor.getList();
        const r = list.find(item => item.checked === true);
        if (r) {
            return r;
        }
        return false;
    },
    getItemById(currentId) {
        const list = Accessor.getList();
        const r = list.find(item => item.id === currentId);
        if (r) {
            return r;
        }
        return false;
    },
};

/**
 * 是否是对象
 * @param {*} val
 * @returns
 */
export const isObject = val => (typeof val === 'object' && val !== null);

/**
 * deepcopy
 * @param {*} sourceObj
 * @param {*} target
 * @returns
 */
export function cloneDeep(sourceObj, target = {}) {
    const tmpTarget = target;
    if (!isObject(sourceObj)) return {};
    Object.keys(sourceObj).forEach((key) => {
        // 判断是普通值还是复杂类型
        if (typeof sourceObj[key] !== 'object' || sourceObj[key] === null) {
            // 基本数据类型
            tmpTarget[key] = sourceObj[key];
        } else {
            // 复杂数据类型
            tmpTarget[key] = Array.isArray(sourceObj[key]) ? [] : {};
            cloneDeep(sourceObj[key], tmpTarget[key]);
        }
    });
    return tmpTarget;
}

// 获取server地址
function getserverData() {
    let res;
    if (RongDesktop && RongDesktop.configInfo) {
        // 桌面端
        res = RongDesktop.configInfo.APP_SERVER;
    } else {
        res = setting.server;
    }
    return res;
}

// 服务地址的后缀
export const serverConfSuffix = '/api';

/**
 * 增加服务地址后缀
 * @param {*} serverName
 * @returns
 */
export function addServerConfSuffix(serverName) {
    if (!serverName) return serverName;
    if (typeof serverName === 'string') {
        if (serverName.endsWith(serverConfSuffix) || serverName.endsWith(`${serverConfSuffix}/`)) {
            if (serverName.endsWith(serverConfSuffix)) {
                return serverName;
            }
            return serverName.slice(0, -1);
        }
        if (serverName.endsWith('/')) {
            return `${serverName}api`;
        }
        return `${serverName}${serverConfSuffix}`;
    }
    return serverName;
}
/**
 * 删除服务地址后缀
 * @param {*} serverName
 * @returns
 */
export function delServerConfSuffix(serverName) {
    if (!serverName) return serverName;
    if (typeof serverName === 'string') {
        if (serverName.endsWith(serverConfSuffix)) {
            return serverName.slice(0, -4);
        }
        return serverName;
    }
    return serverName;
}

/**
 * 服务地址合法性校验
 * @param {*} serverName
 */
export function isValidteServerName(serverName) {
    const ips = /^((https|http|ftp|rtsp|mms)?:\/\/)(([0-9]{1,3}\.){3}[0-9]{1,3})(:[0-9]{1,4})\/?$/;
    // let wangzhi = /^((https|http|ftp|rtsp|mms):\/\/)(www.)?[a-zA-Z0-9\.\-]+(:[0-9]{1,4})?\/?$/
    const wangzhi = /^[a-zA-z]+:\/\/[^\s]*\/?$/;
    return ips.test(serverName) || wangzhi.test(serverName);
}


/**
 * 校验地址的合法性
 * @param {*} callback
 */
export function httpRequest(url, callback) {
    const options = {
        url,
        method: 'get',
        dataType: 'json',
        xhrFields: {
            withCredentials: true,
        },
    };
    function getErrorCode(code) {
        const SUCCESS_CODE = 10000;
        return (code === SUCCESS_CODE) ? null : code;
    }
    $.ajax(options).then((response) => {
        const errorCode = getErrorCode(response.code);
        if (errorCode) {
            callback(false, response);
        } else {
            const result = response.result;
            callback(true, result);
        }
    }, () => {
        callback(false);
    });
}
