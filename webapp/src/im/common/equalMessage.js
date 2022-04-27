// 判断是否是同一条消息
export default function equalMessage(messageA, messageB) {
    let result;
    // eslint-disable-next-line no-param-reassign
    messageA = messageA || {};
    if (messageA.messageId) {
        result = messageA.messageId === messageB.messageId;
    } else {
        result = messageA.messageUId === messageB.messageUId;
    }
    return result;
}
