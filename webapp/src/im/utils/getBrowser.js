let version;
let type;
const condition = {
    IE: /rv:([\d.]+)\) like Gecko|MSIE ([\d.]+)/,
    Edge: /Edge\/([\d.]+)/,
    Firefox: /Firefox\/([\d.]+)/,
    Opera: /(?:OPERA|OPR).([\d.]+)/,
    QQBrowser: /QQBrowser\/([\d.]+)/,
    Chrome: /Chrome\/([\d.]+)/,
    Safari: /Version\/([\d.]+).*Safari/,
};
const keys = Object.keys(condition);
for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i];
    const browserContent = navigator.userAgent.match(condition[key]);
    if (browserContent) {
        type = key;
        version = browserContent[1] || browserContent[2];
        break;
    }
}
export default function getBrowser() {
    return {
        type: type || 'UnKonw',
        version: version || 'UnKonw',
    };
}
