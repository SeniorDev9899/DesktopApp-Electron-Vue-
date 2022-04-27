const channel = {
    SEARCH: 'menu.edit.search',
    LOGOUT: 'logout',
    ACCOUNT: 'menu.main.account_settings',
    BALLOON: 'balloon-click',
    DOCKCLICK: 'onDockClick',
    OPENCOVERSATION: 'openConversation',
    WINDOWFOCUS: 'window.focus',
    WINDOWBLUR: 'window.blur',
};

function regListener(listenerKey, callback) {
    RongDesktop.ipcRenderer.on(listenerKey, callback);
}

function unRegListener(listenerKey) {
    // eslint-disable-next-line no-underscore-dangle
    const events = RongDesktop.ipcRenderer._events[listenerKey];
    if (events instanceof Function) {
        RongDesktop.ipcRenderer.removeListener(listenerKey, events);
    } else if (events instanceof Array) {
        events.forEach((event) => {
            RongDesktop.ipcRenderer.removeListener(listenerKey, event);
        });
    }
}

function regSearch(callback) {
    regListener(channel.SEARCH, callback);
}

function unregSearch() {
    unRegListener(channel.SEARCH);
}

function regLogout(callback) {
    regListener(channel.LOGOUT, callback);
}

function unregLogout() {
    unRegListener(channel.LOGOUT);
}

function regAccount(callback) {
    regListener(channel.ACCOUNT, callback);
}

function unregAccount() {
    unRegListener(channel.ACCOUNT);
}

function regBalloon(callback) {
    regListener(channel.BALLOON, callback);
}

function unregBalloon() {
    unRegListener(channel.BALLOON);
}

function unregOpenCoversation() {
    unRegListener(channel.OPENCOVERSATION);
}

function getVersion() {
    return RongDesktop.configInfo.APP_VERSION;
}

function regDockClick(callback) {
    regListener(channel.DOCKCLICK, callback);
}

function unregDockClick() {
    unRegListener(channel.DOCKCLICK);
}

function regWindowFocus(callback) {
    regListener(channel.WINDOWFOCUS, callback);
}

function unregWindowFocus() {
    unRegListener(channel.WINDOWFOCUS);
}

function regWindowBlur(callback) {
    regListener(channel.WINDOWBLUR, callback);
}

function unregWindowBlur() {
    unRegListener(channel.WINDOWBLUR);
}

export default {
    regSearch,
    unregSearch,
    regLogout,
    unregLogout,
    regAccount,
    unregAccount,
    unregOpenCoversation,
    regBalloon,
    unregBalloon,
    getVersion,
    userStatusTitle: 'Login_Status_PC',
    regDockClick,
    unregDockClick,
    getEmojiUrl: RongDesktop.emoji,
    regWindowFocus,
    unregWindowFocus,
    regWindowBlur,
    unregWindowBlur,
};
