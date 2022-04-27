function formatStr(str, values) {
    let temp = str;
    Object.keys(values).forEach((key) => {
        temp = temp.replace(`{${key}}`, values[key]);
    });
    return temp;
}

function ep(str) {
    return str.replace(/'/g, "''");
}

function parseStr(str) {
    return `'${ep(str)}'`;
}

function parseColumnName(str) {
    return `[${str}]`;
}

function isEmpty(value) {
    return [null, undefined].indexOf(value) !== -1;
}

function getFormatDataStr(schema, data, key) {
    const type = (schema[key].match(/^\w+/) || [''])[0].toUpperCase();
    let value = data[key];
    if (isEmpty(value)) {
        return 'NULL';
    }
    if (type === 'TEXT') {
        value = parseStr(value);
    }
    return value;
}

const Sqlstring = {
    escape: ep,
    parseStr,
    getFormatDataStr,
    createTable(tablename, schema) {
        const schemaStr = Object.keys(schema).map(key => `${parseColumnName(key)} ${schema[key]}`).join(',');
        let sql = 'create table if not exists {tablename} ({schema});';
        sql = formatStr(sql, {
            tablename,
            schema: schemaStr,
        });
        return sql;
    },
    insertOrReplace(tablename, schema, values) {
        const keys = Object.keys(schema).map(item => parseColumnName(item)).join(',');
        const valuesStr = Object.keys(schema).map(key => getFormatDataStr(schema, values, key)).join(',');
        let sql = 'insert or replace into {tablename} ({keys}) values ({values});';
        sql = formatStr(sql, {
            tablename,
            keys,
            values: valuesStr,
        });
        return sql;
    },
    placeholderInserOrReplace(tablename, schema) {
        const keys = Object.keys(schema).map(item => parseColumnName(item)).join(',');
        const values = Object.keys(schema).map(item => `$${item}`).join(',');
        let sql = 'insert or replace into {tablename} ({keys}) values ({values});';
        sql = formatStr(sql, {
            tablename,
            keys,
            values,
        });
        return sql;
    },
    insertInto(tablename, schema, values) {
        const keys = Object.keys(schema).map(item => parseColumnName(item)).join(',');
        const valuesStr = Object.keys(schema).map(key => getFormatDataStr(schema, values, key)).join(',');
        let sql = 'insert into {tablename} ({keys}) values ({values});';
        sql = formatStr(sql, {
            tablename,
            keys,
            values: valuesStr,
        });
        return sql;
    },
    update(tablename, schema, data, uniqueKey) {
        let values = [];
        const { hasOwnProperty } = Object.prototype;
        Object.keys(schema).forEach((key) => {
            if (hasOwnProperty.call(data, key) && key !== uniqueKey) {
                values.push(`${key}=${getFormatDataStr(schema, data, key)}`);
            }
        });
        values = values.join(',');
        const uniqueValue = getFormatDataStr(schema, data, uniqueKey);
        let sql = 'update {tablename} set {values} where {uniqueKey} = {uniqueValue}';
        sql = formatStr(sql, {
            tablename,
            values,
            uniqueKey,
            uniqueValue,
        });
        return sql;
    },
    searchByName(tablename, keyword) {
        keyword = ep(keyword);
        const sql = `select * from ${tablename} 
        where name like '%${keyword}%'
        or name_keyword_initial like '%${keyword}%'
        or name_keyword_full like '%$${keyword}%'`;
        return sql;
    },
};

function unique(array) {
    const temp = []; // 一个新的临时数组
    for (let i = 0; i < array.length; i += 1) {
        if (temp.indexOf(array[i]) === -1) {
            temp.push(array[i]);
        }
    }
    return temp;
}

const nodePinyin = require('../node-pinyin/pinyin');

function PinyinUtility(str, options) {
    const result = nodePinyin(str, options);
    // 多音字只取前三个字符的多音节
    for (let i = 0, { length } = result; i < length; i++) {
        const item = result[i];
        if (item.length > 1) {
            result[i] = unique(item);
            if (i > 3) {
                result[i] = [item[0]];
            }
        }
    }
    return result;
}

const hanyuToPinyin = function (hanyu, style) {
    style = style || 'normal';
    const pinyin = PinyinUtility(hanyu, {
        style,
        heteronym: true,
    });
    return polyphoneArrStitching(pinyin);
};

function polyphoneArrStitching(polyphone) {
    let fullList = [];
    polyphone.forEach((arr) => {
        if (fullList.length === 0) {
            fullList = fullList.concat(arr);
            return;
        }
        const { length } = arr;
        if (length === 1) {
            fullList = fullList.map(str => str + arr[0]);
        } else {
            const temp = fullList.concat();
            const newList = [];
            for (let i = 0; i < length; i++) {
                const char = arr[i];
                temp.forEach((item) => {
                    newList.push(item + char);
                });
            }
            fullList = newList;
        }
    });
    return fullList;
}

function getFullRange(str, keyword) {
    const polyphoneArr = PinyinUtility(str, {
        style: 'normal',
        heteronym: true,
    });
    let range = [];
    for (let i = 0; i < str.length; i++) {
        const subName = str.substring(i);
        // let pinyins = hanyuToPinyin(subName);
        const pinyins = polyphoneArrStitching(polyphoneArr.slice(i));
        for (let a = 0; a < pinyins.length; a++) {
            const pinyin = pinyins[a];
            if (pinyin.indexOf(keyword) === 0) {
                range = [i, 0];
                let done = false;
                let j = 0;
                for (; j < subName.length; j++) {
                    // let ch = subName.substr(j, 1);
                    // let chs = hanyuToPinyin(ch);
                    const chs = polyphoneArrStitching(polyphoneArr.slice(i + j, i + j + 1));
                    for (let b = 0; b < chs.length; b++) {
                        const cs = chs[b];
                        if (keyword.indexOf(cs) === 0) {
                            keyword = keyword.substr(cs.length);
                            if (keyword.length === 0) {
                                done = true;
                            }
                            break;
                        }
                        if (cs.indexOf(keyword) === 0) {
                            done = true;
                            break;
                        }
                        if (keyword.length === 0) {
                            done = true;
                            break;
                        }
                    }
                    if (done) {
                        break;
                    }
                }
                range[1] = j + 1;
                return range;
            }
        }
    }
    return range;
}

function getRange(str, initial, keyword) {
    let range = [];
    const nameIndex = str.indexOf(keyword);
    if (nameIndex > -1) {
        range = [nameIndex, keyword.length];
        return range;
    }
    let initialIndex = initial.indexOf(keyword);
    if (initialIndex > -1) {
        initialIndex %= str.length;
        range = [initialIndex, keyword.length];
        return range;
    }
    range = getFullRange(str, keyword);
    return range;
}

module.exports = {
    noop() {},
    getRange,
    getFullRange,
    formatStr,
    Sqlstring,
    hanyuToPinyin,
};
