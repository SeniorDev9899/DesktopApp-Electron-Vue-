/* eslint-disable func-names */
/* eslint-disable no-param-reassign */
export default function (ImageViewer) {
    const components = ImageViewer.components;

    ImageViewer.dialog.viewerWeb = function (config) {
        const options = {
            name: 'viewer_web',
            template: '#rong-template-viewer_web',
            data() {
                return {
                    show: true,
                    isMaxWindow: false,
                    imageList: [],
                    selectIndex: 0,
                    tip: '',
                    lan: 'zh',
                    fileToken: '',
                };
            },
            components: {
                imageViewer: components.getImageViewer,
            },
            mounted() {
                const context = this;
                context.imageList = config.dataSource;
                if (context.$refs.viewer) {
                    context.$refs.viewer.onUpdate(config);
                } else {
                    setTimeout(() => {
                        context.$refs.viewer.onUpdate(config);
                    }, 300);
                }
            },
            methods: {
                close() {
                    this.show = false;
                },
            },
        };
        window.RongIM.common.mountDialog(options);
    };
}
