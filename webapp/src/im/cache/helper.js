import { getValueByChainedKey } from '../../helper';
import appCache, { Type as APP_CACHE } from './app';
// import userCache, { Type as USER_CACHE } from './user';

/**
 * 获取缓存的服务配置
 */
export function getServerConfig() {
    return appCache.get(APP_CACHE.SERVER_CONFIG);
}

/**
 * 获取缓存的服务下发配置值
 * @param {String} chainedKey 属性链，如: 'im.app_key'
 */
export function getServerConfigByChainedKey(chainedKey) {
    return getValueByChainedKey(chainedKey, getServerConfig());
}

/**
 * 获取应用 appkey
 */
export function getAppKey() {
    return getServerConfigByChainedKey('im.app_key');
}

/**
 * 获取应用导航服务地址
 */
export function getNaviURL() {
    return appCache.get(APP_CACHE.NAVI_URL);
}
