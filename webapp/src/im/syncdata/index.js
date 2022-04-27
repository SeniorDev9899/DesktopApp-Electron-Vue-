import Database from '../Database';
import { getAppKey } from '../cache/helper';

// eslint-disable-next-line import/no-dynamic-require
const syncdata = require(`./${IS_DESKTOP ? 'desktop' : 'web'}`).default;
export default syncdata;

const firstSyncdataKey = 'rong-firstsyncdata';
export const firstSyncdata = IS_DESKTOP ? {
    remove(userId) {
        if (!userId) {
            return;
        }
        const value = window.localStorage.getItem(firstSyncdataKey) || '';
        const uidList = value.split(',');
        const index = uidList.indexOf(userId);
        if (index > -1) {
            uidList.splice(index, 1);
            window.localStorage.setItem(firstSyncdataKey, uidList.join(','));
        }
    },
    get(userId) {
        const value = window.localStorage.getItem(firstSyncdataKey) || '';
        const dbFileExists = Database.existsSync(getAppKey(), userId);
        return !dbFileExists || value.indexOf(userId) === -1;
    },
    set(userId) {
        let value = window.localStorage.getItem(firstSyncdataKey) || '';
        if (value.indexOf(userId) === -1) {
            value += (`,${userId}`);
            window.localStorage.setItem(firstSyncdataKey, value);
        }
    },
} : {
    get() {
        return false;
    },
    set() {},
};
