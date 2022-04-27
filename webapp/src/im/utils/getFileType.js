export default function getFileType(filename) {
    const imageType = {
        jpg: 1,
        png: 2,
    };
    const index = filename.lastIndexOf('.') + 1;
    const type = filename.substring(index);
    return type in imageType ? 'image' : 'file';
}
