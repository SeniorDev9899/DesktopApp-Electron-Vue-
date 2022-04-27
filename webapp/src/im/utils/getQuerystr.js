export default function getQuerystr(obj) {
    let str = '';
    $.each(obj, (key, value) => {
        str += `${key}=${encodeURIComponent(value)}&`;
    });
    str = str.substring(0, str.length - 1);
    return str;
}
