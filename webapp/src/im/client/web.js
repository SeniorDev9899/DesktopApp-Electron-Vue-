const noop = $.noop;

export default {
    regSearch: noop,
    unregSearch: noop,
    regLogout: noop,
    unregLogout: noop,
    regAccount: noop,
    unregAccount: noop,
    unregOpenCoversation: noop,
    regBalloon: noop,
    unregBalloon: noop,
    getVersion() {
        return '';
    },
    // showMessageBox: showMessageBox,
    userStatusTitle: 'Login_Status_Web',
    regDockClick: noop,
    unregDockClick: noop,
};
