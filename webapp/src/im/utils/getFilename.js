/* eslint-disable no-param-reassign */
export default function getFilename(url) {
    // returns an object with {filename, ext} from url (from: http://coursesweb.net/ )
    // get the part after last /, then replace any query and hash part
    let tempUrl = url.split('/').pop().replace(/#(.*?)$/, '').replace(/\?(.*?)$/, '');
    tempUrl = tempUrl.split('.');
    return {
        filename: (tempUrl[0] || ''),
        ext: (tempUrl[1] || ''),
    };
}
