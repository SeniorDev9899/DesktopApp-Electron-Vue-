/* eslint-disable func-names */
/* eslint-disable no-param-reassign */
/*
说明：图片/视频查看器
功能：
    1. 图片放大,缩小,旋转
    2. 视频播放
    3. 图片/视频的缩略图预览
备注：待做: 1.初始窗体大小 2. 拖拽 3. 视频播放控制器样式 4. 以当前可见屏幕中心放大
    5. 放大后拖拽不超过图片边界  6. web 兼容(组件化)

窗口变化规则:
图片原始大小rawSize  窗口大小win{max, min} 可显示图片大小showSize

if(rawSize > win.max){
    窗口调整为最大;根据窗口大小按比例缩小图片
} else if(rawSize < win.min){
    窗口调整为最小;显示原始图片大小
} else {
    按照原始大小显示
}
*/
import locale from '../locale';

export default function (ImageViewer) {
    function init(config, el) {
        const browserWindow = ImageViewer.browserWindow;
        const viewer = new Vue({
            el,
            components: {
                imageViewer: ImageViewer.components.getImageViewer,
            },
            data: {
                config,
                isMaxWindow: false,
                imageList: [],
                selectIndex: 0,
                tip: '',
                lan: '',
                fileToken: '',
            },
            computed: {
                locale() {
                    return locale[config.locale];
                },
                os() {
                    return ImageViewer.system.platform;
                },
            },
            mounted() {
                const context = this;
                ImageViewer.onUpdate = function (_options) {
                    context.restore();
                    context.$refs.imageViewer.init();
                    config.locale = _options.locale;
                    context.lan = _options.locale;
                    ImageViewer.options = _options;
                    context.imageList = _options.dataSource;
                    context.selectIndex = _options.defaultIndex || 0;
                    ImageViewer.browserWindow.show(context.imageList.length > 0);
                    context.$refs.imageViewer.onUpdate(_options);
                };

                ImageViewer.onClose = function () {
                    context.beforeClose();
                };

                ImageViewer.onLogout = function () {
                    ImageViewer.resCache = null;
                    context.beforeClose();
                };
            },
            methods: {
                min() {
                    browserWindow.min();
                },
                max() {
                    browserWindow.max();
                    // browserWindow.setFullScreen(true);
                    this.isMaxWindow = true;
                },
                restore() {
                    browserWindow.unmax();
                    // browserWindow.setFullScreen(false);
                    this.isMaxWindow = false;
                },
                beforeClose() {
                    this.$refs.imageViewer.onClose();
                    // 延迟删除，避免 windows 上出现打开时残留上一张图片
                    setTimeout(() => {
                        browserWindow.hide();
                    }, 30);
                },
                close() {
                    this.beforeClose();
                },
            },
        });
        ImageViewer.instance = viewer;
    }

    ImageViewer.init = init;
}
