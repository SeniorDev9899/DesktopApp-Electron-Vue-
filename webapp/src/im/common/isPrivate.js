export default function isPrivate(config) {
    const uploadType = config.upload.type;
    return uploadType === 'RongCloud';
}
