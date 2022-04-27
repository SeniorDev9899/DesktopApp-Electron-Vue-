export default function replaceEmail(str, callback) {
    let result = '';
    const emailReg = /[\w+.-]{2,64}?@[\w-]+(?:\.[\w-]+)+/g;
    result = str.replace(emailReg, callback);
    return result;
}
