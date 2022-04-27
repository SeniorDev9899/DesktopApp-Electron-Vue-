export default function getUrlMatchProtocol(urls) {
    let url;
    urls.some((item) => {
        if (item.startsWith(window.location.protocol)) {
            url = item;
            return true;
        }
        return false;
    });
    return url || urls[0];
}
