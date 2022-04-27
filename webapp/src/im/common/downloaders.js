const downloadersObj = {};
export default {
    get(key) {
        return downloadersObj[key];
    },
    add(key, value) {
        downloadersObj[key] = value;
    },
    delete(key) {
        delete downloadersObj[key];
    },
    clear() {
        Object.keys(downloadersObj).forEach((key) => {
            if (downloadersObj.contains(key)) {
                delete downloadersObj[key];
            }
        });
    },
    getAll() {
        return downloadersObj;
    },
};
