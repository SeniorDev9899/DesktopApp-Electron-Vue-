const runtime = require('./scripts/runtime');

const pages = {
    index: {
        entry: 'src/im/index.js',
        template: 'src/im/template.html',
    },
    worker: {
        entry: 'src/pages/worker/index.js',
        template: 'src/pages/worker/template.html',
    },
    versions: {
        entry: 'src/pages/versions/index.js',
        template: 'src/pages/versions/template.html',
    },
};

if (runtime.IS_DESKTOP) {
    // 桌面端需打包图片查看器作为单独的页面入口
    pages['image-viewer'] = {
        entry: 'src/pages/image-viewer/index.js',
        template: 'src/pages/image-viewer/desktop.html',
    };
    // 公众号图文消息查看器
    pages['public-service-article'] = {
        entry: 'src/pages/public-service-article/index.js',
        template: 'src/pages/public-service-article/index.html',
    };
    pages.voip = {
        entry: 'src/pages/voip/index.js',
        template: 'src/pages/voip/template.html',
    };
} else {
    pages.QR = {
        entry: 'src/pages/QR/index.js',
        template: 'src/pages/QR/template.html',
    };
}

module.exports = pages;
