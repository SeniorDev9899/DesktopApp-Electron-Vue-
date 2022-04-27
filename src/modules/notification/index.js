const { ipcMain, Notification } = require('electron');

module.exports = () => {
    const notiMaps = {};

    ipcMain.on('show-notification', (event, options) => {
        const {
            conversationType, targetId, title, body, permanentNot,
        } = options;
        const key = [conversationType, targetId].join('______');
        let notification = notiMaps[key];
        if (notification) {
            notification.removeAllListeners('click');
            notification.removeAllListeners('close');
            notification.close();
            delete notiMaps[key];
        }
        notification = new Notification({
            // timeoutType 仅在非 mac 平台有效
            timeoutType: permanentNot ? 'never' : 'default',
            title,
            silent: false,
            body,
        });
        notiMaps[key] = notification;
        notification.once('click', () => {
            notification.close();
            event.sender.send('notification-clicked', { conversationType, targetId });
        });
        notification.once('close', () => {
            if (notiMaps[key] === notification) {
                delete notiMaps[key];
            }
        });
        notification.show();
    });
};
