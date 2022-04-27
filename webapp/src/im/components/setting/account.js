// let im = RongIM.instance;
// let dataModel = im.dataModel;
// let userApi = dataModel.User;
import UserType from '../../common/UserType';
import avatar from '../avatar.vue';
import getLocaleMixins from '../../utils/getLocaleMixins';

const name = 'setting-account';

/*
说明：设置 - 内容页(帐号)
功能：
    1. 显示个人信息
    2. 退出登录
    3. 外部联系人修改姓名
*/
export default {
    name,
    computed: {
        account() {
            return this.$im().loginUser;
        },
    },
    data() {
        const im = this.$im();
        return {
            username: im.loginUser.name,
            // 是否是外部联系人
            isStaff: im.loginUser.type === UserType.STAFF,
            usernameEditable: false,
        };
    },
    components: {
        avatar,
    },
    directives: {
        focus: {
            inserted(el) {
                el.focus();
            },
        },
    },
    deactivated() {
        this.usernameEditable = false;
    },
    mixins: [getLocaleMixins(name)],
    methods: {
        format(mobile) {
            return mobile.replace(/(\d{3})(\d{4})(\d{4})/, '$1 $2 $3');
        },
        logout() {
            const context = this;
            this.RongIM.common.messagebox({
                // type: 'confirm',
                title: context.locale.quitTitle,
                message: context.locale.quitMessage,
                callback() {
                    // Story #498 - 【丹东】【PC客户端】PC端产品能力演进 - RCE
                    // 如果用户注销，托盘图标也会关闭
                    window.RongDesktop.ipcRenderer.send('destory-tray-icon');
                    context.$emit('close');
                    context.$im().logout();
                },
            });
        },
        // 是否可编辑用户名
        setUsernameEditable() {
            const context = this;
            context.usernameEditable = true;
        },
        // 重置用户名
        // 添加延迟调用，防止点击关闭之前触发blur事件，提交更改；
        setUsername() {
            const context = this;
            setTimeout(() => {
                // 阻止esc退出之后触发设置
                if (!context.usernameEditable) return;

                let flag = false;
                const username = context.username;
                const userId = context.account.id;
                const regExp = /^([a-zA-z]|[0-9]|[\u4e00-\u9fa5])$/;

                flag = username.split('').some((item) => {
                    const islegal = regExp.test(item);
                    return !islegal;
                });
                if (!username.length || flag) {
                    this.RongIM.common.messageToast({
                        message: context.locale.components.settingAccount.transfiniteMessage,
                        type: 'error',
                    });
                    return;
                }
                // TODO  setUsername 根据后端接口所需参数修改
                this.RongIM.dataModel.User.setUsername(userId, username, (errorCode) => {
                    if (errorCode) {
                        context.toastError(errorCode);
                        return;
                    }
                    Vue.set(context.account, 'name', context.username);
                    context.usernameEditable = false;
                    // 修改后
                });
            }, 100);
        },
        // 取消重置用户名
        cancelUsername() {
            const context = this;
            context.usernameEditable = false;
            context.username = this.$im().loginUser.name;
        },
        // 提示16个字符以内
        inputUserName(e) {
            const context = this;
            const val = e.target.value;
            if (val.length >= 16) {
                this.RongIM.common.messageToast({
                    message: context.locale.components.settingAccount.errorMessage,
                    type: 'error',
                });
            }
        },
    },
};
