const request = require('request');
const Config = require('../config');

let httpRequest = request;
if (Config.IGNORE_CERTIFICATE_ERRORS) {
    httpRequest = request.defaults({
        rejectUnauthorized: false,
    });
}

module.exports = httpRequest;
