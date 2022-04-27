import Cache from './Cache';

/**
 * 应用缓存数据键
 */
export const Type = Object.freeze({
    /**
     * 服务下发配置
     */
    SERVER_CONFIG: 'SERVER_CONFIG',
    /**
     * 服务下发的导航地址
     */
    NAVI_URL: 'NAVI_URL',
});

/**
 * 应用缓存
 */
export default new Cache('APP');
