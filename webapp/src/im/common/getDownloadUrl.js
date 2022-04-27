// 获取私有云下载链接
export default function getDownloadUrl(config, data) {
    let url = '';
    const uploadType = config.upload.type;
    if (uploadType === 'RongCloud') {
        url = data.rc_url.path;
        const urlType = data.rc_url.type.toString();
        if (urlType === '0') {
            url = config.upload.file.domain + data.rc_url.path;
        }
    }
    return url;
}
