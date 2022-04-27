export default function templateFormat(...args) {
    let [source, params] = args;
    let undef;
    if (args.length === 1) {
        return function template() {
            args.unshift(source);
            return $.validator.format.apply(this, args);
        };
    }
    if (params === undef) {
        return source;
    }
    if (args.length > 2 && params.constructor !== Array) {
        params = args.slice(1);
    }
    if (params.constructor !== Array) {
        params = [params];
    }
    $.each(params, (i, n) => {
        source = source.replace(new RegExp(`\\{{${i}\\}}`, 'g'), () => n);
    });
    return source;
}
