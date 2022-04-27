function formateNum(n) {
    if (n < 10) {
        return `0${n}`;
    }
    return n.toString();
}

export default function getDateId() {
    const date = new Date();
    const components = [
        date.getFullYear(),
        formateNum(date.getMonth() + 1),
        formateNum(date.getDate()),
        date.getHours(),
        date.getMinutes(), '_',
        date.getSeconds(),
        date.getMilliseconds(),
    ];
    return components.join('');
}
