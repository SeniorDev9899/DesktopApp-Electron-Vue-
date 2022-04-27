export default function getUsernameFormat(name, alias) {
    let str = name;
    if (alias) {
        str = `${alias}(${str})`;
    }
    return str;
}
