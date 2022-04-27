// 文件消息是否取消上传
export default function isCanceled(message) {
    const isFileMessage = message.messageType === 'LocalFileMessage' || message.messageType === 'FileMessage';
    const isFlieCancelStatus = isFileMessage ? message.content.status === 0 : false;
    return isFileMessage && isFlieCancelStatus;
}
