import config from '../../config';
import browserWindow from '../../browserWindow';
import videoSetting from '../../components/seal-meeting/videoSetting.vue';
import audioSetting from '../../components/seal-meeting/audioSetting.vue';

export default function () {
    const options = {
        name: 'metting-setting',
        template: 'templates/seal-meeting/setting.html',
        data() {
            return {
                show: true,
                currentView: 'videoSetting',
                product: config.product,
                updtekey: false,
            };
        },
        components: {
            videoSetting,
            audioSetting,
        },
        methods: {
            openDevtool() {
                browserWindow.toggleDevTools();
            },
            isCurrentView(name) {
                return this.currentView === name;
            },
            setCurrentView(name) {
                this.currentView = name;
                this.updtekey = !this.updtekey;
            },
        },
    };

    window.RongIM.common.mountDialog(options);
}
