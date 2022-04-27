/*
    创建一个通知消息
    参数：
    conversationType: 会话类型
    targetId: 发送对象的targetId
    context: 消息内容
    */
export default function createNotificationMessage(conversationType, targetId, content) {
    const msg = new RongIMLib.InformationNotificationMessage({ message: content });
    const params = {
        conversationType,
        targetId,
        objectName: 'RC:InfoNtf',
        content: msg,
        sentStatus: RongIMLib.SentStatus.SENT,
    };
    return params;
}
