import highlight from './highlight';

// 根据range高亮对应名字
export default function getHighlight(duty, notfilterLabel) {
    const str = highlight(duty.name, duty.range, notfilterLabel);
    return str;
}
