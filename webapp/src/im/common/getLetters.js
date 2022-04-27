import convertToABC from '../utils/convertToABC';

// 获取汉字的拼音
export default function getLetters(name) {
    const letters = convertToABC(name).pinyin.toLocaleLowerCase();
    return letters;
}
