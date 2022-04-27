import browserWindow from '../../browserWindow';
import getLocaleMixins from '../../utils/getLocaleMixins';
import config from '../../config';

const name = 'setting-about';

/*
说明：设置 - 内容页(系统)
功能：
    1. 查看版本信息
    2. 查看版本功能介绍
*/
export default {
    name,
    data() {
        return {
            showVersion: config.modules.upgrade,
            product: config.product,
        };
    },
    methods: {
        showVersions() {
            browserWindow.openVersions();
        },
    },
    mixins: [getLocaleMixins(name)],
};
