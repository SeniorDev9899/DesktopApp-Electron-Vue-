export default function (list, property = 'id') {
    const result = [];
    let cache = {};
    list.forEach((item) => {
        const key = item[property];
        if (!cache[key]) {
            result.push(item);
            cache[key] = true;
        }
    });
    cache = null;
    return result;
}
