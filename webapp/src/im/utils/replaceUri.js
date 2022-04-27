const domainArray = [
    '.com', '.net', '.org', '.biz', '.coop', '.info', '.museum', '.name',
    '.pro', '.edu', '.gov', '.int', '.mil', '.ac', '.ad', '.ae', '.af',
    '.ag', '.ai', '.al', '.am', '.an', '.ao', '.aq', '.ar', '.as', '.at',
    '.au', '.aw', '.az', '.ba', '.bb', '.bd', '.be', '.bf', '.bg', '.bh',
    '.bi', '.bj', '.bm', '.bn', '.bo', '.br', '.bs', '.bt', '.bv', '.bw',
    '.by', '.bz', '.ca', '.cc', '.cd', '.cf', '.cg', '.ch', '.ci', '.ck',
    '.cl', '.cm', '.cn', '.co', '.cr', '.cu', '.cv', '.cx', '.cy', '.cz',
    '.de', '.dj', '.dk', '.dm', '.do', '.dz', '.ec', '.ee', '.eg', '.eh',
    '.er', '.es', '.et', '.fi', '.fj', '.fk', '.fm', '.fo', '.fr', '.ga',
    '.gd', '.ge', '.gf', '.gg', '.gh', '.gi', '.gl', '.gm', '.gn', '.gp',
    '.gq', '.gr', '.gs', '.gt', '.gu', '.gv', '.gy', '.hk', '.hm', '.hn',
    '.hr', '.ht', '.hu', '.id', '.ie', '.il', '.im', '.in', '.io', '.iq',
    '.ir', '.is', '.it', '.je', '.jm', '.jo', '.jp', '.ke', '.kg', '.kh',
    '.ki', '.km', '.kn', '.kp', '.kr', '.kw', '.ky', '.kz', '.la', '.lb',
    '.lc', '.li', '.lk', '.lr', '.ls', '.lt', '.lu', '.lv', '.ly', '.ma',
    '.mc', '.md', '.me', '.mh', '.mk', '.ml', '.mm', '.mn', '.mo', '.mp',
    '.mq', '.mr', '.ms', '.mt', '.mu', '.mv', '.mw', '.mx', '.my', '.mz',
    '.na', '.nc', '.ne', '.nf', '.ng', '.ni', '.nl', '.no', '.np', '.nr',
    '.nu', '.nz', '.om', '.pa', '.pe', '.pf', '.pg', '.ph', '.pk', '.pl',
    '.pm', '.pn', '.pr', '.ps', '.pt', '.pw', '.py', '.qa', '.re', '.ro',
    '.rw', '.ru', '.sa', '.sb', '.sc', '.sd', '.se', '.sg', '.sh', '.si',
    '.sj', '.sk', '.sl', '.sm', '.sn', '.so', '.sr', '.st', '.sv', '.sy',
    '.sz', '.tc', '.td', '.tf', '.tg', '.th', '.tj', '.tk', '.tm', '.tn',
    '.to', '.tp', '.tr', '.tt', '.tv', '.tw', '.tz', '.ua', '.ug', '.uk',
    '.um', '.us', '.uy', '.uz', '.va', '.vc', '.ve', '.vg', '.vi', '.vn',
    '.vu', '.ws', '.wf', '.ye', '.yt', '.yu', '.za', '.zm', '.zw', '.mg',
    '.site',
];

export default function replaceUri(str, callback) {
    let result = '';
    const protocolReg = '((?:http|https|ftp)\\:\\/\\/)?';
    const ipReg = '(?:(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]{1}[0-9]{1}|[0-9])\\.){3}'
        + '(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]{1}[0-9]{1}|[0-9])';
    const hostReg = '(?!@)(?:[a-z0-9-]{1,36}\\.)+[a-z]{2,6}';
    const portReg = '(?:\\:[0-9]{1,5})?';
    const pathReg = '(?:(?:/[a-zA-Z0-9.,;?\\\'+&%$#=~_\\-!()*\\/]*)?)';
    const uriReg = new RegExp(`${protocolReg}(?:(${ipReg})|(${hostReg}))${portReg}${pathReg}`, 'ig');
    result = str.replace(uriReg, function handle(uriStr, protocol, ip, host) {
        // eslint-disable-next-line prefer-rest-params
        const lastIndex = arguments[arguments.length - 2];
        const prevChar = str.substr(lastIndex - 1, 1);
        const isEmail = prevChar === '@';
        /*
            非 http https 开头只有域名判断域名合法性
            eg: www.baidu.com 合法
                主域 .aa 不在 domainArray 中不合法
            */
        let notDomain = false;
        if (!protocol && !ip) {
            const list = host.split('.');
            const mainDomain = `.${list[list.length - 1]}`;
            notDomain = domainArray.indexOf(mainDomain) === -1;
        }
        if (ip && !protocol) {
            return uriStr;
        }
        if (isEmail || notDomain) {
            return uriStr;
        }
        // eslint-disable-next-line prefer-rest-params
        return callback(...arguments);
    });
    return result;
}
