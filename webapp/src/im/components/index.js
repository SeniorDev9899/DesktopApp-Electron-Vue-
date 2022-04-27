import getValidate from './mixins/validate';
import getFullscreen from './mixins/fullscreen';
import getContextMenu from './mixins/context-menu';

import getAvatar from './avatar.vue';
import getOnlineStatus from './online-status.vue';
import editAvatar from './edit-avatar.vue';
import getImageLoader from './image-loader.vue';
import forgetPassword from './forget-password/index.vue';
import getSearch from './search.vue';

import getSyncdataLoading from './syncdata-loading.vue';
import getSignup from './signup.vue';
import getLogin from './login.vue';
import getStatus from './status.vue';
import customSelect from './custom-select.vue';

import getPinDetail from './pin/pin-detail.vue';
import getNav from './pin/nav.vue';
import getReceived from './pin/received.vue';
import getSent from './pin/sent.vue';

// 消息组件
import getUnknownMessage from './message/unknown.vue';
import getTextMessage from './message/text.vue';
import getVoiceMessage from './message/voice.vue';
import getImageMessage from './message/image.vue';
import getFileMessage from './message/file.vue';
import getCardMessage from './message/card.vue';
import getLocationMessage from './message/location.vue';
import getApprovalMessage from './message/approval.vue';
import getGroupNoticeNotifyMessage from './message/groupnotice.vue';
import getJrmfRedPacketMessage from './message/jrmf-red-packet.vue';
import getQuoteFile from './message/quote/quote-file.vue';
import getQuoteImage from './message/quote/quote-image.vue';
import getQuoteImagetext from './message/quote/quote-imagetext.vue';
import getQuoteText from './message/quote/quote-text.vue';
import getQuoteMessage from './message/quote/quote.vue';
import getRichContentMessage from './message/richcontent.vue';
import getPSImageTextMessage from './message/ps-image-text.vue';
import getSummaryMessage from './message/summary.vue';
import getRecallCommandMessage from './message/recall-command.vue';
import getSightMessage from './message/sight.vue';
import getPSMultiImageTextMessage from './message/ps-multi-image-text.vue';
import getRequestFriendVerificationMessage from './message/request-friend-verification.vue';

// 设置弹窗组件
import getSettingAbout from './setting/about';
import getSettingAccount from './setting/account';
import getSettingPassword from './setting/password';
import getSettingSystem from './setting/system';

// Conversation
import getEmojiPanel from './conversation/emoji-panel.vue';
import getPublicMenu from './conversation/public-menu.vue';
import getPublicInfo from './conversation/public-detail.vue';
import getEditBox from './conversation/edit-box.vue';
import getMessageInput from './conversation/message-input.vue';
import getLatestMessage from './conversation/latest-message.vue';
import getConversationSetting from './conversation/conversation-setting.vue';
import getConversationList from './conversation/conversation-list.vue';
import getGroupNotice from './conversation/group-notice.vue';
import getGroupSetting from './conversation/group-setting.vue';
import getHistory from './conversation/history.vue';
import getMessageList from './conversation/message-list.vue';
import getConversation from './conversation/conversation.vue';

// Colloect
import getCollectSearch from './collect/search.vue';
import getCollectList from './collect/collect.vue';
import getCollect from './collect/collect-list.vue';

import group from './group';
import contact from './contact';

export default {
    getValidate,
    getFullscreen,
    getContextMenu,

    getPinDetail,
    getAvatar,
    getStatus,
    getOnlineStatus,
    editAvatar,
    getImageLoader,
    forgetPassword,
    getSearch,

    getUnknownMessage,
    getTextMessage,
    getVoiceMessage,
    getImageMessage,
    getFileMessage,
    getCardMessage,
    getLocationMessage,
    getApprovalMessage,
    getGroupNoticeNotifyMessage,
    getJrmfRedPacketMessage,
    getQuoteFile,
    getQuoteImage,
    getQuoteImagetext,
    getQuoteText,
    getQuoteMessage,
    getRichContentMessage,
    getPSImageTextMessage,
    getSummaryMessage,
    getRecallCommandMessage,
    getSightMessage,
    getPSMultiImageTextMessage,
    getRequestFriendVerificationMessage,

    getSyncdataLoading,
    getSignup,
    getLogin,
    customSelect,

    getSettingAbout,
    getSettingAccount,
    getSettingPassword,
    getSettingSystem,

    group,
    contact,
    pin: {
        getNav,
        getReceived,
        getSent,
    },

    getEmojiPanel,
    getPublicMenu,
    getPublicInfo,
    getEditBox,
    getLatestMessage,
    getMessageInput,
    getConversationSetting,
    getConversationList,
    getGroupNotice,
    getGroupSetting,
    getHistory,
    getMessageList,
    getConversation,

    getCollectSearch,
    collect: {
        getCollect,
        getCollectList,
    },
};
