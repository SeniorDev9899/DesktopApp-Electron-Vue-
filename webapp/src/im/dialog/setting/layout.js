import system from '../../system';

import config from '../../config';
import browserWindow from '../../browserWindow';
import accountSetting from '../../components/setting/account.vue';
import aboutSetting from '../../components/setting/about.vue';
import systemSetting from '../../components/setting/system.vue';
import passwordSetting from '../../components/setting/password.vue';
import screenSetting from '../../components/setting/screen.vue';

/*
说明：设置 - 主框架
功能：
    1. 切换设置页显示内容
*/
export default function () {
    const options = {
        name: 'setting',
        template: '#rong-template-setting-layout',
        data() {
            return {
                show: true,
                currentView: 'account',
                product: config.product,
            };
        },
        components: {
            account: accountSetting,
            password: passwordSetting,
            system: systemSetting,
            screen: screenSetting,
            about: aboutSetting,
        },
        computed: {
            showAbout() {
                return system.platform !== 'darwin';
            },
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
            },
            close() {
                this.show = false;
            },
        },
    };

    window.RongIM.common.mountDialog(options);
}
