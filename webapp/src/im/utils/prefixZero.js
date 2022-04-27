export default function prefixZero(str, len) {
    const length = len || 2;
    return (Array(length).join(0) + str).slice(-length);
}
