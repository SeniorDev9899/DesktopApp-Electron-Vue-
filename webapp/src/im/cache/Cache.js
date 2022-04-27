export default class {
    /**
     * @param {String} prefix 键前缀，用于存储时区分
     * @param {Array<String>} flushKeys 需持久化存储的键数组
     * @param {*} medium 存储媒介，可以是 localStorage 或 sessionStorage
     */
    constructor(prefix, flushKeys = [], medium = localStorage) {
        this.prefix = prefix;
        this.flushKeys = flushKeys;
        this.medium = medium;
        this.data = {};
        flushKeys.forEach(this.reload, this);
    }

    transfrom(key) {
        return `${this.prefix}_${key}`;
    }

    clear() {
        this.flushKeys.forEach(this.delete, this);
    }

    /**
     * 删除缓存数据
     * @param {String} key
     */
    delete(key) {
        if (this.flushKeys.includes(key)) {
            this.medium.removeItem(this.transfrom(key));
        }
        return delete this.data[key];
    }

    /**
     * 取数据
     * @param {Sring} key
     */
    get(key) {
        return this.data[key];
    }

    /**
     * 存储数据
     * @param {String} key
     * @param {any} value
     */
    set(key, value) {
        if (this.flushKeys.includes(key)) {
            this.medium.setItem(this.transfrom(key), JSON.stringify({ v: value }));
        }
        this.data[key] = value;
    }

    /**
     * 从存储介质中恢复数据
     * @param {String} key
     */
    reload(key) {
        const json = this.medium.getItem(this.transfrom(key));
        if (json) {
            const { v } = JSON.parse(json);
            this.data[key] = v;
        }
    }
}
