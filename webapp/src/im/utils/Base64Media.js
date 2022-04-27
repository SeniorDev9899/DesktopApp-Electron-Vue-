export default {
    replace(str) {
        const reg = new RegExp('^data:image/[^;]+;base64,');
        if (str) {
            return str.replace(reg, '');
        }
        return '';
    },
    concat(base64, type) {
        return (type || 'data:image/jpg;base64,') + this.replace(base64);
    },
};
