import Cache from './Cache';

/**
 * 用户缓存数据键
 */
export const Type = Object.freeze({
    /**
     * 自动登录标记
     */
    AUTO_LOGIN: 'AUTO_LOGIN',
    /**
     * 当前已登录用户 id
     */
    CURRENT_ID: 'current_id',
});

/**
 * 用户缓存，用户退出登录后或进入应用时登录态失效后需清理
 */
export default new Cache('USER', [
    Type.AUTO_LOGIN, Type.CURRENT_ID,
]);
