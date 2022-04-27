import isString from './isString';
import isEmpty from './isEmpty';

/*
    说明：
    1: JSON.stringfy --> set --> get --> JSON.parse
    2: data format well return as set`s
    3: undefined in array will be null after stringfy+parse
    4: NS --> namespace 缩写
    */
let keyNS = 'rong-default-';

function hasOwnProperty(target, key) {
    return Object.prototype.hasOwnProperty.call(target, key);
}

function isKeyExist(key) {
    // do not depend on value cause of ""和0
    return hasOwnProperty(localStorage, key) || hasOwnProperty(sessionStorage, key);
}

function get(key) {
    /*
       legal data: "" [] {} null flase true

       illegal: undefined
           1: key not set
           2: key is cleared
           3: key removed
           4: wrong data format
       */
    const tempKey = keyNS + key;
    if (!isKeyExist(tempKey)) {
        return undefined;
    }
    // maybe keyNS could avoid conflict
    let val = localStorage.getItem(tempKey) || sessionStorage.getItem(tempKey);
    val = JSON.parse(val);
    // val format check
    if (val !== null && hasOwnProperty(val, 'type') && hasOwnProperty(val, 'data')) {
        return val.data;
    }
    /*
       how to return illegal data for im？
       */
    return undefined;
}
// isPersistent
function set(key, val, isTemp) {
    let store = localStorage;
    if (isTemp) {
        store = sessionStorage;
    }
    const type = (typeof val);
    store.setItem(keyNS + key, JSON.stringify({
        data: val,
        type,
    }));
}

function remove(key) {
    const key1 = keyNS + key;
    localStorage.removeItem(key1);
    sessionStorage.removeItem(key1);
}

function setKeyNS(NS) {
    if (isString(NS) && NS !== '') {
        keyNS = NS;
    }
}

function onchange(callback) {
    $(window).on('storage', (e) => {
        const event = e.originalEvent;
        if (isEmpty(event.key)) {
            return;
        }
        const key = event.key.slice(keyNS.length);
        const value = get(key);
        if (callback) {
            callback(key, value);
        }
    });
}
export default {
    setKeyNS,
    get,
    set,
    remove,
    onchange,
};
