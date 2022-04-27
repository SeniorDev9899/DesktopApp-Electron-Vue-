export default function getCombineMessageTitle(context, nameList, conversationType) {
    if (!nameList) {
        return '';
    }
    const userCount = nameList.length;
    if (conversationType === 3) {
        return context.locale.tips.combineMsgGroupTitle;
    }
    if (userCount === 1) {
        return context.localeFormat(context.locale.tips.combineMsgOwnTitle, nameList[0]);
    }
    return context.localeFormat(context.locale.tips.combineMsgSingleTitle, nameList[0], nameList[1]);
}
