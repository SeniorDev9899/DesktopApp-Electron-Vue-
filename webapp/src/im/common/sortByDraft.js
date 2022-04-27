export default function sortByDraft(list) {
    // 草稿列表
    const draftList = list.filter(item => item.draft && item.draft.editTime).sort((messageItem1, messageItem2) => {
        let sentTime1 = 0;
        let sentTime2 = 0;
        if (messageItem1.latestMessage) {
            sentTime1 = messageItem1.latestMessage.sentTime;
        }
        if (messageItem2.latestMessage) {
            sentTime2 = messageItem2.latestMessage.sentTime;
        }
        return sentTime2 - sentTime1;
    });

    // 普通列表
    const ordinaryList = list.filter(item => item.draft.content === '');
    return [...draftList, ...ordinaryList];
}
