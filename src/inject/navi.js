const request = require('../common/httpRequest');
const utils = require('../utils');

const { stringFormat } = utils;

/*
    let config = {
        // 必传
        userId: '',
        // 必传
        appkey: '',
        // 必传
        token: '',
        // 通过 RongIMClient.init 获得
        version: '2.87.1',
        // 公有云可选，私有云必传
        url: ''
    };
*/
const get = (config, callback) => {
    const {
        appkey,
        version: v,
        url,
    } = config;

    if (!url) {
        callback('url is undefined!');
        return;
    }

    const token = encodeURIComponent(config.token);
    let reqBody = 'token={token}&v={v}';
    reqBody = stringFormat(reqBody, { token, v });
    request({
        url,
        method: 'POST',
        headers: {
            appId: appkey,
        },
        body: reqBody,
    }, (error, resp, res) => {
        if (error) {
            callback(`network-error: ${url}`);
            return;
        }
        let body;
        try {
            body = JSON.parse(res);
        } catch (err) {
            callback('parse navi failed!');
            return;
        }
        if (!body.server) {
            callback(`navi is invalid! server: ${body.server}`);
            return;
        }
        let tpl = '{server}';
        if (body.bs) {
            tpl += ',{bs}';
        }
        body.serverList = stringFormat(tpl, {
            server: body.server,
            bs: body.bs,
        });
        callback(null, body);
    });
};

module.exports = {
    get,
};
