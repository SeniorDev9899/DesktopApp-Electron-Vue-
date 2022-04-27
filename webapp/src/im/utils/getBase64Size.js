export default function getBase64Size(base64Str) {
    let str = base64Str;
    const equalIndex = str.indexOf('=');
    if (equalIndex > 0) {
        str = str.substring(0, equalIndex);
    }
    const strLength = str.length;
    const size = parseInt(strLength - (strLength / 8) * 2);
    return size;
}
