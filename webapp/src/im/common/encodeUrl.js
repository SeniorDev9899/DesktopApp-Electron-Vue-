import encodeHtmlStr from '../utils/encodeHtmlStr';

export default function encodeUrl(url) {
    const reg = /^(https|http|ftp|file|data)/;
    if (!reg.test(url)) {
        return '';
    }
    let tmpUrl = url.split('?');
    if (tmpUrl.length < 2) {
        tmpUrl = url;
    } else {
        tmpUrl = tmpUrl.map((item, index) => {
            if (index !== 0) {
                return encodeHtmlStr(item);
            }
            return item;
        }).join('?');
    }
    return tmpUrl;
}
