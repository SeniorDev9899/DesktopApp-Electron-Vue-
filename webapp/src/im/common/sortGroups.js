import getLetters from './getLetters';

// 群组排序，先按拼音顺序排，如果拼音一样，则按id排
export default function sortGroups(groups) {
    return groups.sort((one, another) => {
        const onePinyin = getLetters(one.name);
        const anotherPinyin = getLetters(another.name);
        if (onePinyin === anotherPinyin) {
            return one.id.localeCompare(another.id);
        }
        return onePinyin.localeCompare(anotherPinyin);
    });
}
