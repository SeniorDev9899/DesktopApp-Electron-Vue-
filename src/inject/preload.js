const {
    ipcRenderer, remote, shell, desktopCapturer,
} = require('electron');
const fs = require('fs');
const path = require('path');
// 来自于 Electron 无法修复的 bug
// https://github.com/electron/electron/issues/3761
// https://electronjs.org/docs/api/process#event-loaded
const _setImmediate = setImmediate;
const _clearImmediate = clearImmediate;
process.once('loaded', () => {
    global.setImmediate = _setImmediate;
    global.clearImmediate = _clearImmediate;
});

require('@rongcloud/electron-solution/renderer');

const utils = remote.require('./utils');

// 浏览器环境运行
const window = global;
const RongIMLib = require('@rongcloud/imlib-v2');

window.RongIMLib = RongIMLib;
RongIMLib.RongUtil = {
    MD5(str) {
        return utils.md5(str);
    },
};

RongIMLib.Conversation = function Conversation(
    conversationTitle, conversationType, draft, isTop, latestMessage,
    latestMessageId, notificationStatus, objectName, receivedStatus,
    receivedTime, senderUserId, senderUserName, sentStatus, sentTime,
    targetId, unreadMessageCount, senderPortraitUri, isHidden, mentionedMsg,
    hasUnreadMention,
) {
    this.conversationTitle = conversationTitle;
    this.conversationType = conversationType;
    this.draft = draft;
    this.isTop = isTop;
    this.latestMessage = latestMessage;
    this.latestMessageId = latestMessageId;
    this.notificationStatus = notificationStatus;
    this.objectName = objectName;
    this.receivedStatus = receivedStatus;
    this.receivedTime = receivedTime;
    this.senderUserId = senderUserId;
    this.senderUserName = senderUserName;
    this.sentStatus = sentStatus;
    this.sentTime = sentTime;
    this.targetId = targetId;
    this.unreadMessageCount = unreadMessageCount;
    this.senderPortraitUri = senderPortraitUri;
    this.isHidden = isHidden;
    this.mentionedMsg = mentionedMsg;
    this.hasUnreadMention = hasUnreadMention;
    // this._readTime = _readTime;
};

// SDK 升级
RongIMLib.RongIMClient.MessageType = {
    TextMessage: 'TextMessage',
    ImageMessage: 'ImageMessage',
    DiscussionNotificationMessage: 'DiscussionNotificationMessage',
    VoiceMessage: 'VoiceMessage',
    RichContentMessage: 'RichContentMessage',
    HandshakeMessage: 'HandshakeMessage',
    UnknownMessage: 'UnknownMessage',
    LocationMessage: 'LocationMessage',
    InformationNotificationMessage: 'InformationNotificationMessage',
    ContactNotificationMessage: 'ContactNotificationMessage',
    ProfileNotificationMessage: 'ProfileNotificationMessage',
    CommandNotificationMessage: 'CommandNotificationMessage',
    CommandMessage: 'CommandMessage',
    TypingStatusMessage: 'TypingStatusMessage',
    ChangeModeResponseMessage: 'ChangeModeResponseMessage',
    ChangeModeMessage: 'ChangeModeMessage',
    EvaluateMessage: 'EvaluateMessage',
    HandShakeMessage: 'HandShakeMessage',
    HandShakeResponseMessage: 'HandShakeResponseMessage',
    SuspendMessage: 'SuspendMessage',
    TerminateMessage: 'TerminateMessage',
    CustomerContact: 'CustomerContact',
    CustomerStatusUpdateMessage: 'CustomerStatusUpdateMessage',
    SyncReadStatusMessage: 'SyncReadStatusMessage',
    ReadReceiptRequestMessage: 'ReadReceiptRequestMessage',
    ReadReceiptResponseMessage: 'ReadReceiptResponseMessage',
    FileMessage: 'FileMessage',
    AcceptMessage: 'AcceptMessage',
    RingingMessage: 'RingingMessage',
    SummaryMessage: 'SummaryMessage',
    HungupMessage: 'HungupMessage',
    InviteMessage: 'InviteMessage',
    MediaModifyMessage: 'MediaModifyMessage',
    MemberModifyMessage: 'MemberModifyMessage',
    JrmfRedPacketMessage: 'JrmfRedPacketMessage',
    JrmfRedPacketOpenedMessage: 'JrmfRedPacketOpenedMessage',
    GroupNotificationMessage: 'GroupNotificationMessage',
    PublicServiceRichContentMessage: 'PublicServiceRichContentMessage',
    PublicServiceMultiRichContentMessage: 'PublicServiceMultiRichContentMessage',
    PublicServiceCommandMessage: 'PublicServiceCommandMessage',
    RecallCommandMessage: 'RecallCommandMessage',
    ReadReceiptMessage: 'ReadReceiptMessage',
    PresenceNotificationMessage: 'PresenceNotificationMessage',
    RCEUpdateStatusMessage: 'RCEUpdateStatusMessage',
    InactiveCommandMessage: 'InactiveCommandMessage',
    CardMessage: 'CardMessage',
    LocalFileMessage: 'LocalFileMessage',
    LocalImageMessage: 'LocalImageMessage',
    SightMessage: 'SightMessage',
    RealTimeLocationStartMessage: 'RealTimeLocationStartMessage',
    KickoffMsg: 'KickoffMsg',
    RealTimeLocationQuitMessage: 'RealTimeLocationQuitMessage',
    RealTimeLocationJoinMessage: 'RealTimeLocationJoinMessage',
    RealTimeLocationStatusMessage: 'RealTimeLocationStatusMessage',
    VideoSummaryMessage: 'VideoSummaryMessage',
    ConferenceUpdateMessage: 'ConferenceUpdateMessage',
    ConferenceParticipantUpdateMessage: 'ConferenceParticipantUpdateMessage',
    ConferencePingMessage: 'ConferencePingMessage',
    ApprovalMessage: 'ApprovalMessage',
    MomentsCommentMessage: 'MomentsCommentMessage',
    MomentsMentionMessage: 'MomentsMentionMessage',
    MomentsUpdateMessage: 'MomentsUpdateMessage',
    MultiClientMessage: 'MultiClientMessage',
    DeviMonitorMessage: 'DeviMonitorMessage',
    ClickMenuMessage: 'ClickMenuMessage',
    AppNotifyMessage: 'AppNotifyMessage',
    ReferenceMessage: 'ReferenceMessage',
    UserTypeChangedMessage: 'UserTypeChangedMessage',
    EncryptedMessage: 'EncryptedMessage',
    EncryptRequestMessage: 'EncryptRequestMessage',
    EncryptResponseMessage: 'EncryptResponseMessage',
    EncryptConfirmMessage: 'EncryptConfirmMessage',
    EncryptCancelMessage: 'EncryptCancelMessage',
    EncryptTerminateMessage: 'EncryptTerminateMessage',
    SCBurnTimeMessage: 'SCBurnTimeMessage',
    BurnNoticeMessage: 'BurnNoticeMessage',
    GIFMessage: 'GIFMessage',
    GroupMemChangedNotifyMessage: 'GroupMemChangedNotifyMessage',
    GroupNotifyMessage: 'GroupNotifyMessage',
    GroupCmdMessage: 'GroupCmdMessage',
    GroupVerifyNotifyMessage: 'GroupVerifyNotifyMessage',
    PinNotifyMessage: 'PinNotifyMessage',
    PinCommentMessage: 'PinCommentMessage',
    PinConfirmMessage: 'PinConfirmMessage',
    PinNewReciverMessage: 'PinNewReciverMessage',
    PinDeletedMessage: 'PinDeletedMessage',
    PinCommentReadMessage: 'PinCommentReadMessage',
    GroupNoticeNotifyMessage: 'GroupNoticeNotifyMessage',
    ContactNotifyMessage: 'ContactNotifyMessage',
    RequestFriendVerificationMessage: 'RequestFriendVerificationMessage',
};

const configInfo = remote.require('./config');
const emitter = require('../common/globalEvents');

ipcRenderer.setMaxListeners(0);

const RongDesktop = {};
window.RongDesktop = RongDesktop;
RongDesktop.desktopCapturer = desktopCapturer;
RongDesktop.shell = shell;
RongDesktop.ipcRenderer = ipcRenderer;
RongDesktop.require = require;
RongDesktop.remote = remote;
RongDesktop.configInfo = configInfo;
RongDesktop.cache = require('../modules/cache/cache');
RongDesktop.imageViewerOpener = require('../modules/image_viewer/opener.render');

RongDesktop.Ipc = {
    register: (key, callback) => {
        ipcRenderer.on(key, (event, ...args) => {
            callback(...args);
        });
    },
    /*
    opt 类型为: String 或 Object
    为Object时: opt.key 表示 发送标识, opt.windowId 表示发送给哪个窗口
    为String时: opt = key
     */
    send: (opt, ...args) => {
        ipcRenderer.send('browser_window_message', opt, ...args);
    },
    startMain: () => {
        ipcRenderer.send('start_main');
    },
};

RongDesktop.window = require('../modules/window/window.render');
RongDesktop.screenshot = require('../modules/screenshot/screenshot.render');
RongDesktop.system = require('../modules/system/system.render');
RongDesktop.file = require('../modules/file/file.render');
RongDesktop.download = require('../modules/download_extra/download.render');
RongDesktop.downloader = require('../modules/download_extra/download_piece.render');
RongDesktop.voipOpener = require('../modules/voip/opener.render');
RongDesktop.debug = require('../modules/debug/debug.render');
// RongDesktop.addon = require('../modules/ronglib/ronglib.render');
RongDesktop.emoji = require('../modules/emoji/emoji');
RongDesktop.browserWin = require('../modules/browser_window/browser.render');
RongDesktop.Navi = require('./navi');
RongDesktop.upload = require('../modules/upload/upload.render');
RongDesktop.Database = require('../modules/database/database');

/**
 * 删除文件夹删除失败自动跳过
 * @param {string} dirpath 文件夹目录
 */
function removeFolder(dirpath) {
    if (fs.existsSync(dirpath)) {
        fs.readdirSync(dirpath).forEach((file) => {
            const curPath = `${dirpath}/${file}`;
            if (fs.statSync(curPath).isDirectory()) {
                removeFolder(curPath);
            } else {
                try {
                    fs.unlinkSync(curPath);
                } catch (e) {
                    // 删除文件失败调过
                    window.console.log(e);
                }
            }
        });
        try {
            fs.rmdirSync(dirpath);
        } catch (e) {
            // 删除文件失败调过
            window.console.log(e);
        }
    }
}

RongDesktop.cleanStorage = function clean() {
    /**
   * 删除所有消息数据库 {appData}/RongCloud
   *  Mac 为{userData}/RongCloud
   * 删除所有应用数据 {userData}/storage
   * 删除所有文件缓存 {userData}/localfiles
   * 删除文件分片缓存 {userData}/slice
   */
    const { app } = remote;
    const userData = app.getPath('userData');
    const rmdirList = function rmdir(dirList) {
        dirList.forEach((dir) => {
            removeFolder(dir);
        });
    };
    rmdirList([
        path.join(app.getPath('appData'), 'RongCloud'),
        path.join(userData, 'RongCloud'),
        path.join(userData, 'storage'),
        path.join(userData, 'localfiles'),
        path.join(userData, 'slice'),
    ]);
};
function removeListener(listenerKey) {
    const events = emitter._events[listenerKey];
    if (events instanceof Function) {
        emitter.removeListener(listenerKey, events);
    } else if (events instanceof Array) {
        events.forEach((event) => {
            emitter.removeListener(listenerKey, event);
        });
    }
}

emitter.removeAllListeners();
removeListener('onCancel');
emitter.on('onCancel', () => {
    if (RongDesktop.screenshot.onCancel) {
        RongDesktop.screenshot.onCancel();
    }
});

removeListener('onComplete');
emitter.on('onComplete', (data) => {
    if (RongDesktop.screenshot.onComplete) {
        RongDesktop.screenshot.onComplete(data);
    }
});

removeListener('onResume');
emitter.on('onResume', () => {
    if (RongDesktop.system.onResume) {
        RongDesktop.system.onResume();
    }
});
removeListener('onSuspend');
emitter.on('onSuspend', () => {
    if (RongDesktop.system.onSuspend) {
        RongDesktop.system.onSuspend();
    }
});

// init
(() => {
    const videoCache = path.join(remote.app.getPath('userData'), 'video');
    if (utils.dirExists(videoCache)) {
        return;
    }
    utils.makeDir(videoCache);
})();
