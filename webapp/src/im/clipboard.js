export default IS_DESKTOP ? {
    writePath(path) {
        RongDesktop.file.copyToClipboard(path);
    },
} : {
    writePath(/* path */) {
        // TODO: 确定迁移前 clipboard.writePath
    },
};
