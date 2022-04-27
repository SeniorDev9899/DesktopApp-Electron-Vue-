const Store = require('electron-store');
const fs = require('fs');
const Path = require('path');
const Utils = require('../../utils');

// ? 缓存是否分用户
class Cache {
    /*
        config: {cacheRoot, appKey, id, maxAge, maxSize}
        cacheDir: userData/rongCache/appKey
    */
    constructor(config) {
        const dir = [];
        const cacheRoot = config.cacheRoot || 'rongCache';
        dir.push(cacheRoot);
        if (config.appKey) {
            dir.push(config.appKey);
        }
        if (config.id) {
            dir.push(config.id);
        }
        // config.cacheRoot = config.cacheRoot || remote.app.getPath('userData');
        // config.maxAge = config.maxAge || 1000 * 60 * 60 * 24 * 30;  // 一个月
        config.maxAge = config.maxAge || 1000 * 60;
        this.config = config;
        this.cache = new Store({ name: config.id, cwd: dir.join('/') });
        this.path = Path.dirname(this.cache.path);
    }

    info() {
        return { config: this.config, cacheHome: this.path };
    }

    /*
   key: url
   value: {localPath, lastVisit, expire}
    */
    set(key, value) {
        this.cache.set(key, value);
    }

    get(key) {
        const tempCache = this.cache.get(key);
        if (tempCache) {
            if (!fs.existsSync(tempCache.localPath)) {
                this.cache.delete(key);
                return null;
            }
        }
        return tempCache;
    }

    getAll() {
        return this.cache.store;
    }

    remove(key) {
        const localPath = this.get(key);
        this.cache.delete(key);
        Utils.deleteFile(localPath);
    }

    removeAll() {
        this.cache.clear();
        const cachePath = this.path;
        if (Utils.dirExists(cachePath)) {
            Utils.deleteDir(cachePath);
        }
    }

    getSize() {
        return this.cache.size;
    }

    // 扫描过期缓存
    // 根据 lastVisit 和 maxAge 做过期判断;过期后删除
    removeExpired() {
        const allSrc = this.cache.store;
        const now = new Date().getTime();
        Object.keys(allSrc).forEach((key) => {
            const { lastVisit } = allSrc[key];
            const visitTime = new Date(lastVisit).getTime();
            const span = now - visitTime;
            if (span > this.config.maxAge) {
                key = key.replace(/\./g, '\\.');
                this.remove(key);
            }
        });
    }
}

module.exports = Cache;
