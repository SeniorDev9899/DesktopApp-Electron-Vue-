import CallType from './CallType';

export default function groupSummaryFormat(content, locale) {
    const isVideo = content.mediaType === CallType.MEDIA_VEDIO;
    let str = '';
    if (isVideo) {
        str = locale.voip.video;
    } else {
        str = locale.voip.audio;
    }
    const selfUnread = [5, 11].indexOf(content.status) !== -1;
    if (content.status === 8) {
        str = locale.voip.summaryCodeMap[8];
    } else if (selfUnread) {
        str += ` ${locale.voip.unAccept}`;
    } else {
        str += ` ${locale.voip.end}`;
    }
    return str;
}
