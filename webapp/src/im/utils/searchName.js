import isEmpty from './isEmpty';
import convertToABC from './convertToABC';

// 目前用于群成员搜索
export default function searchName(arrName, keyword) {
    if (!arrName.length) {
        return false;
    }
    if (isEmpty(keyword)) {
        return true;
    }
    const joinWords = '%&^';
    let find = false;
    if (joinWords.indexOf(keyword) > -1) {
        find = arrName.some(item => item && item.indexOf(keyword) > -1);
        return find;
    }
    const name = arrName.join(joinWords);
    if (name) {
        const keywordLowerCase = keyword && keyword.toLowerCase();
        const pinyinObj = convertToABC(name);
        const pinyin = pinyinObj.pinyin.toLowerCase();
        const pinyinFirstLetter = pinyinObj.first.toLowerCase();
        const matchFirstLetter = pinyinFirstLetter.indexOf(keywordLowerCase) > -1;
        const matchPinyin = pinyin.indexOf(keywordLowerCase) > -1;
        const matchRawName = name.indexOf(keyword) > -1;
        find = matchFirstLetter || matchPinyin || matchRawName;
        return find;
    }
    return false;
}
