export default {
    REGX_HTML_ENCODE: /"|&|'|<|>|[\x20-\x20]|[\x7F-\xFF]|[\u0100-\u2700]/g,
    encode(s) {
        return (typeof s !== 'string') ? s : s.replace(this.REGX_HTML_ENCODE, ($0) => {
            let c = $0.charCodeAt(0);
            const r = ['&#'];
            c = (c === 0x20) ? 0xA0 : c;
            r.push(c);
            r.push(';');
            return r.join('');
        });
    },
    REGX_HTML_DECODE: /&\w+;|&#(\d+);/g,
    HTML_DECODE: {
        '<': '<',
        '>': '>',
        '&': '&',
        ' ': ' ',
        '©': '©',
    },
    decode(s) {
        const context = this;
        return (typeof s !== 'string') ? s : s.replace(this.REGX_HTML_DECODE, ($0, $1) => {
            // 尝试查表
            let c = context.HTML_DECODE[$0];
            if (typeof c === 'undefined') {
                // Maybe is Entity Number
                // eslint-disable-next-line no-restricted-globals
                if (!isNaN($1)) {
                    c = String.fromCharCode(($1 === 160) ? 32 : $1);
                } else {
                    // Not Entity Number
                    c = $0;
                }
            }
            return c;
        });
    },
    // 用于解决bug 12009 【MAC-消息- UI】手机端复制通讯录号码粘贴发送到会话里，发送方显示样式错乱
    check(content) {
        if (content) {
            let htmlStr = this.encode(content);
            const specialCode = ['&#8236;', '&#8237;'];
            let hasSpecialCode = false;
            specialCode.forEach((code) => {
                if (htmlStr.indexOf(code) > -1) {
                    htmlStr = htmlStr.replace(new RegExp(code, 'gm'), '');
                    hasSpecialCode = true;
                }
            });
            if (hasSpecialCode) {
                return this.decode(htmlStr);
            }
            return content;
        }
        // TODO: 函数意图不明，缺少返回值，暂补 undefined 以保留原代码意图
        return undefined;
    },
};
