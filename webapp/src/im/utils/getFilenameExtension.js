export default function getFilenameExtension(fileName) {
    const reg = /\.([^.]+)$/.exec(fileName);
    if (reg) {
        return reg[1];
    }
    return '';
}
