// 会话列表最后一条群公告格式
export default function latestGroupNoticeFormat(content, locale) {
    const message = locale.message || {};
    return [message.noticeTitle, ':', content].join('');
}
