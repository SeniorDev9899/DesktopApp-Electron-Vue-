import getLocaleMixins from '../../utils/getLocaleMixins';
import cache from '../../utils/cache';

const name = 'setting-screen';

/*
说明：设置 - 内容页(系统)
功能：
    1. 查看版本信息
    2. 查看版本功能介绍
*/
export default {
    name,
    data() {
        return {
            autoLock: false,
            unlockPwd: '',
            error: false,
        };
    },
    activated() {
        const cacheLockPwd = cache.get(`screen-lock-pwd-${this.$im().auth.id}`);
        if (cacheLockPwd) {
            this.autoLock = cacheLockPwd.autoLock;
            this.unlockPwd = cacheLockPwd.unlockPwd;
        }
    },
    watch: {
        autoLock(newVal) {
            if (!newVal) {
                cache.set(`screen-lock-pwd-${this.$im().auth.id}`, '');
            }
        },
    },
    methods: {
        input() {
            this.unlockPwd = this.unlockPwd.replace(/[\W]/g, '');
            this.check();
        },
        check() {
            const reg = new RegExp(/^(?![0-9]+$)(?![a-zA-Z]+$)[0-9A-Za-z]{6,16}$/);
            if (!reg.test(this.unlockPwd)) {
                this.error = true;
            } else {
                this.error = false;
            }
        },
        submit() {
            this.$refs.unlockPwd.blur();
            if (this.error) {
                return;
            }
            const cacheLockPwd = {
                autoLock: true,
                unlockPwd: this.unlockPwd,
            };
            cache.set(`screen-lock-pwd-${this.$im().auth.id}`, cacheLockPwd);
            this.RongIM.common.messageToast({
                message: this.locale.toast,
            });
        },
    },
    mixins: [getLocaleMixins(name)],
};
