// 获取导航
export default (naviConfig, callback) => {
    if (IS_DESKTOP) {
        RongDesktop.Navi.get(naviConfig, (error, result) => {
            if (error) {
                callback(error);
                return;
            }
            callback(null, { ...result, version: naviConfig.version });
        });
    } else {
        callback();
    }
};
