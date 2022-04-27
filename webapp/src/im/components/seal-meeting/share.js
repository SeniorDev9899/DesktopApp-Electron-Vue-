

export default function sendPin(im, receivers, pinContentObj, locale, callback) {
    const params = getSendParams(im, receivers, pinContentObj, locale);
    const pinApi = im.dataModel.Pin;
    pinApi.create(params, (errorCode) => {
        if (errorCode) {
            im.RongIM.common.toastError(errorCode);
            return;
        }
        im.RongIM.common.messageToast({
            message: locale.sendPinSuccess,
            type: 'success',
        });
        callback();
    });
}


function getSendParams(im, receivers, pinContentObj, locale) {
    const reveiverIds = receivers
        .filter(item => !executiveLimit(im, item))
        .map(reveiver => reveiver.id);
    const params = {
        content: getSendContent(pinContentObj, locale),
        receiver_ids: reveiverIds,
        delayed: false,
        delayed_send_time: '',
    };
    return params;
}

function getSendContent(pinContentObj, locale) {
    const duration = pinContentObj.duration ? `${locale.duration}：${pinContentObj.duration}${locale.hour}\n` : '';
    const password = pinContentObj.password ? `${locale.password}：${pinContentObj.password}\n` : '';
    const content = `${locale.pinTitle}\n${locale.subject}：${pinContentObj.subject}\n${locale.startTime}：${pinContentObj.startTime}\n${duration}${password}${locale.number}：${pinContentObj.number}\n${locale.linkTitle}：meeting://${pinContentObj.id}${locale.clickLink}`;
    return content;
}


function executiveLimit(im, item) {
    if (
        item.isFriend
   || im.auth.isExecutive
    // this.disableExecutive
    ) {
        return false;
    }
    const isExecutive = !!item.isExecutive;
    return isExecutive;
}
