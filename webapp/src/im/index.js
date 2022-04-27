/* eslint-disable global-require */
import config from './config';
import system from './system';
import utils from './utils';
import browserWindow from './browserWindow';
import dialog from './dialog';

// TODO: common dataModel 引入顺序不可更改，因其中有依赖关系，后续剥离此依赖关系
import common from './common';
import dataModel from './model';
import voipInviteMember from './modules/voip/voip-invitemember';
import rceCall from './modules/voip/rce-call';
import initIM from './im';
import serverConfConfirm from './dialog/server-conf-confirm';

const RongIM = {
    config,
    dialog,
    system,
    utils,
};
// 后续需移除对 RongIM 的二次赋值
common(RongIM);
dataModel(RongIM);
voipInviteMember(RongIM);
rceCall(RongIM);
initIM(RongIM);

if (IS_DESKTOP) {
    RongDesktop.window.on('maximize', () => {
        if (RongIM.instance) {
            RongIM.instance.isMaxWindow = true;
        }
    });
    RongDesktop.window.on('unmaximize', () => {
        if (RongIM.instance) {
            RongIM.instance.isMaxWindow = false;
        }
    });
    // 测试 onDockClick
    RongDesktop.ipcRenderer.on('hide', () => {
        if (browserWindow.onHide) {
            browserWindow.onHide();
        }
    });
    RongDesktop.system.onResume = function onResume() {
        if (RongIM.system.onResume) {
            RongIM.system.onResume();
        }
    };
    RongDesktop.system.onSuspend = function onSuspend() {
        if (RongIM.system.onSuspend) {
            RongIM.system.onSuspend();
        }
    };
}

// TODO: 组件挂载 RongIM 引用，以迁移 components 内容时新迁移组件方便拿取 RongIM
Vue.prototype.RongIM = RongIM;
Vue.prototype.$im = () => RongIM.instance;
// TODO: 为兼容原组件声明方式及业务，全局挂载 RongIM
window.RongIM = RongIM;

// 图片查看器，只有在 web 版才需引用
if (!IS_DESKTOP) {
    require('../pages/image-viewer/index');
}

(() => {
    if (typeof String.prototype.startsWith !== 'function') {
        // eslint-disable-next-line no-extend-native
        String.prototype.startsWith = function startsWith(prefix) {
            return this.slice(0, prefix.length) === prefix;
        };
    }
    function initError() {
        $('#preload-message').remove();
        if (window.navigator.onLine === false) { // 网络错误
            if (IS_DESKTOP) {
                const dialogNet = window.RongDesktop.remote.dialog;
                dialogNet.showMessageBox({
                    title: '提示',
                    type: 'warning',
                    message: '网络连接失败',
                    buttons: ['取消', '确定'],
                }).then((res) => {
                    const r = res.response;
                    if (r === 1) {
                        window.RongDesktop.system.reload();
                    } else {
                        RongIM.system.exit();
                    }
                });
            } else {
                /* eslint-disable no-alert */
                const r = window.confirm('网络连接失败');
                if (r) {
                    window.location.reload();
                } else {
                    // 关闭应用
                    RongIM.system.exit();
                }
            }
        } else {
            const useServerConfFlag = RongIM.config.useServerConfFlag;
            serverConfConfirm().done(() => { // 点击取消
                if (useServerConfFlag) { // 开启配置地址功能
                    // 点击取消去配置地址
                    RongIM.instance.$nextTick(() => {
                        RongIM.instance.$router.push('/server-conf');
                    });
                } else {
                    // 关闭应用
                    RongIM.system.exit();
                }
            }).catch(() => { // 点击重新加载
                if (IS_DESKTOP) {
                    window.RongDesktop.system.reload();
                } else {
                    window.location.reload();
                }
            });
        }
    }
    function loadComplete() {
        const voice = RongIM.config.voice || {};
        RongIMLib.RongIMVoice.init(voice);
        const emoji = RongIM.config.emoji || {};
        RongIMLib.RongIMEmoji.setConfig(emoji);
        setTimeout(() => {
            RongIM.init('#im', (error) => {
                if (error) {
                    initError();
                    return;
                }
                $('#preload-message').remove();
            });
        }, 1000);
    }
    $(document).ready(loadComplete);
})();
