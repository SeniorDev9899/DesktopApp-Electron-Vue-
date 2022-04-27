export default function getFileName(url) {
    return url.split('?')[0].split('/').pop();
}
