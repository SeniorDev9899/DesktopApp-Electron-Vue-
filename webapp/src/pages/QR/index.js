const ua = navigator.userAgent.toLowerCase();
const isIOS = navigator.userAgent.match(/(iPhone|iPod|iPad);?/i);
// const isSafari = navigator.userAgent.indexOf('Safari') > -1 && navigator.userAgent.indexOf('Chrome') < 1;
const isAndroid = /android|adr/.test(ua) && !(/windows phone/.test(ua));

if (isWechat()) {
    $('.rce-surface').show();
} else {
    openApp();
}

// 判断是否为 微信浏览器
function isWechat() {
    if (ua.match(/MicroMessenger/i) === 'micromessenger') {
        return true;
    }
    return false;
}

// 判断是否为 QQ浏览器
// function isQQBrowser() {
//     return (ua.match(/QQ/i) == 'qq');
// }

// 唤起 APP
function openApp() {
    const href = window.location.href;
    let appUrl;
    if (href.indexOf('?key=') !== -1) {
        appUrl = href.substring(href.indexOf('?key=') + 5);
        // if(isIOS){
        // window.location = decodeURIComponent(appUrl);
        // }else if(isAndroid){
        const aLink = document.createElement('a');
        aLink.href = decodeURIComponent(appUrl);
        document.body.appendChild(aLink);
        aLink.click();
        // }
    } else {
        console.warn('链接没有参数');
        // 留在当前下载页
    }
}

// 点击下载 RCE
function download() {
    let platform = '';
    if (isAndroid) {
        platform = 'android';
    } else if (isIOS) {
        platform = 'iOS';
    } else {
        window.location = 'http://info.rongcloud.net/rce.html';
        return;
    }
    const serverApi = window.config.server || APP_SERVER;
    const url = `${serverApi}/appversion?platform=${platform}&&version_code=0`;
    $.ajax({
        url,
        success(resp) {
            if (resp.code === 10000) {
                if (isIOS) {
                    window.location.href = `itms-services://?action=download-manifest&url=${resp.result.download_url}`;
                } else {
                    window.location.href = resp.result.download_url;
                }
            } else {
                window.location = 'http://info.rongcloud.net/rce.html';
            }
        },
    });
}

$('.rce-download-btn').click(download);
