// 构建消息体，发送消息时的消息体
export default {
    TextMessage(context) {
        return new RongIMLib.TextMessage(context);
    },
    ImageMessage(context) {
        return new RongIMLib.ImageMessage(context);
    },
    GIFMessage(context) {
        return new RongIMLib.GIFMessage(context);
    },
    FileMessage(context) {
        return new RongIMLib.FileMessage(context);
    },
    RCCombineMessage(context) {
        return new RongIMLib.RCCombineMessage(context);
    },
    VoiceMessage(context) {
        return new RongIMLib.VoiceMessage(context);
    },
    LocationMessage(context) {
        return new RongIMLib.LocationMessage(context);
    },
    CardMessage(context) {
        return new RongIMClient.RegisterMessage.CardMessage(context);
    },
    SightMessage(context) {
        return new RongIMClient.RegisterMessage.SightMessage(context);
    },
    RichContentMessage(content) {
        return new RongIMLib.RichContentMessage(content);
    },
    ReferenceMessage(content) {
        return new RongIMClient.RegisterMessage.ReferenceMessage(content);
    },
    RequestFriendVerificationMessage(content) {
        return new RongIMLib.RongIMClient.RegisterMessage.RequestFriendVerificationMessage(content);
    },
};
