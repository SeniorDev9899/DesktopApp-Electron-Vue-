export default IS_DESKTOP ? {
    getDataProvider() {
        return RongDesktop.addon;
    },
    clearUnreadCountByTimestamp(params, callback) {
        RongIMClient.getInstance().clearUnreadCountByTimestamp(
            params.conversationType,
            params.targetId,
            params.timestamp,
            {
                onSuccess() {
                    callback();
                },
                onError(errorCode) {
                    callback(errorCode);
                },
            },
        );
    },
} : {
    getDataProvider() {
        return null;
    },
    clearUnreadCountByTimestamp(params, callback) {
        RongIMClient.getInstance().clearUnreadCount(params.conversationType, params.targetId, {
            onSuccess() {
                callback();
            },
            onError(errorCode) {
                callback(errorCode);
            },
        });
    },
};
