
const {
    dialog,
} = require('electron');

exports.showError = function showError(error) {
    const { locale } = global;
    dialog.showErrorBox(locale.__('main.UncaughtException.Title'), [
        error.toString(),
        '\n',
        locale.__('main.UncaughtException.Content'),
        `${locale.__('main.UncaughtException.Website')}: http://www.rongcloud.cn`,
        `${locale.__('main.UncaughtException.Email')}: support@rongcloud.cn`,
    ].join('\n'));
};

exports.handleError = function handleError(error, extra) {
    console.log('err', error, extra);
};

exports.showMessageBox = function showMessageBox(params, callback) {
    dialog.showMessageBox({
        type: params.type,
        buttons: ['OK'],
        icon: params.iconPath,
        message: params.message,
        title: params.title,
        detail: params.detail,
    }, callback);
};
