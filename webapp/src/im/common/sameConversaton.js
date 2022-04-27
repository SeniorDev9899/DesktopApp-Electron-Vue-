export default function sameConversaton(one, another) {
    const oneConversationType = +one.conversationType;
    const anotherConversationType = +another.conversationType;
    const sameConversationType = oneConversationType === anotherConversationType;
    const sameTargetId = one.targetId === another.targetId;
    return sameConversationType && sameTargetId;
}
