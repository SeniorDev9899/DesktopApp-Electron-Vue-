export default function isEmpty(value) {
    let undef;
    const list = [null, undef, ''];
    return list.indexOf(value) >= 0;
}
