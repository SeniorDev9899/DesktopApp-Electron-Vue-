import appCache, { Type as APP_CACHE } from '../cache/app';
import config from '../config';


export const FILE_NET_TYPE = {
    // 不管有没有开启内外网隔离，都可以查看
    ALL_CONNECT: 0,
    // 开启隔离时，无法查看，不开启隔离，可以查看。
    GENERAL: 1,
};

export function getNetUrl(url, type) {
    const fileIsolationEnable = appCache.get(APP_CACHE.SERVER_CONFIG).security.file_isolation_enable;
    if ((type === FILE_NET_TYPE.GENERAL && fileIsolationEnable) || !fileIsolationEnable) {
        return url;
    }
    return url.replace(/^https?:\/\/[^/]+/, config.download.domain);
}

export function messageIfSupportView(url) {
    const fileIsolationEnable = appCache.get(APP_CACHE.SERVER_CONFIG).security.file_isolation_enable;
    if (!url) {
        return [url, !!fileIsolationEnable];
    }
    const fileUrl = getNetUrl(url, FILE_NET_TYPE.GENERAL);
    return [fileUrl, !((fileUrl.indexOf(config.download.domain) > -1))];
}
