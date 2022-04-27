export default function kebabToCamel(string) {
    const firstLetter = string[0] || '';
    return firstLetter + string.slice(1).replace(/-\w/g, match => match[1].toUpperCase());
}
