// 群公告格式
export default function groupNoticeFormat(content, locale) {
    const { atPanel } = locale.components;
    const message = locale.message || {};
    return [message.noticeTitle, '\n@', atPanel.everyone, ' ', content].join('');
}
