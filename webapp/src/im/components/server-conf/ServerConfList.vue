<template>
  <div class="server_conf-container">
    <div class="server_conf-ls">
      <div
        class="server_conf-item"
        v-for="item in serverConfList"
        :key="item.id"
      >
        <label
          ><input
            type="radio"
            name="server_conf"
            :data-ischecked="item.checked || 'false'"
            :data-id="item.id"
            :value="item"
            ref="server_conf_ref"
            v-model="currentServer"
          />
          {{ item.name }}</label
        >
        <span class="server_conf-icon" @click="lookConf(item)">></span>
      </div>
    </div>
    <div class="server_conf-btns">
      <div class="save_btns">
        <span class="btn_normal btn_normal-center" @click="save">{{
          locale.saveText
        }}</span>
      </div>
      <div class="other_btns">
        <span class="btn_text btn_text-lf" @click="loginClick">{{
          locale.loginText
        }}</span>
        <span class="btn_text btn_text-rg" @click="addItem">{{
          locale.addText
        }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import { Accessor, httpRequest, addServerConfSuffix } from './utils';
import getLocaleMixins from '../../utils/getLocaleMixins';

export default {
    name: 'ServerConfList',
    props: ['oldItem'],
    data() {
        return {
            serverAccessor: Accessor,
            serverConfList: [],
            currentServer: null, // 当前选中的
        };
    },
    mounted() {
        this.initList();
        // 设置默认值
        this.setCheckedRadio();
    },
    mixins: [getLocaleMixins('serverConf')],
    methods: {
        showDialog(message) {
            if (IS_DESKTOP) {
                const dialog = window.RongDesktop.remote.dialog;
                dialog.showMessageBox({
                    title: this.locale.tipsText,
                    type: 'warning',
                    message,
                    buttons: [this.locale.confirmText],
                });
            } else {
                /* eslint-disable no-alert */
                alert(message);
            }
        },
        // 保存框
        showSaveDialog(message) {
            return new Promise((resolve, reject) => {
                if (IS_DESKTOP) {
                    const dialog = window.RongDesktop.remote.dialog;
                    dialog.showMessageBox({
                        title: this.locale.saveText,
                        type: 'warning',
                        message,
                        buttons: [this.locale.cancelText, this.locale.confirmText],
                    }).then((res) => {
                        resolve(res.response);
                    }).catch(reject);
                } else {
                    /* eslint-disable no-alert */
                    const r = window.confirm(message);
                    if (r) {
                        resolve(1);
                    } else {
                        resolve(0);
                    }
                }
            });
        },
        initList() {
            this.serverConfList = this.serverAccessor.getList();
        },
        // 接口校验地址
        validateSeting(serverName) {
            return new Promise((resolve) => {
                const newServerName = addServerConfSuffix(serverName);
                httpRequest(`${newServerName}/configuration/all`, (r) => {
                    if (r === false) {
                        resolve(false);
                    } else {
                        resolve(true);
                    }
                });
            });
        },
        // 点击登录
        loginClick() {
            /**
       * + 接口校验（当前选中的地址）
       * + 地址正确后 返回登录有两种情况：1. 直接返回登录  2. 需要初始化页面后返回登录
       * 初始化的情况
       *   1. 当前是一次错误的初始化（也就是当前地址原来是错误的，修改成了正确的）
       *   2. 修改了选中的地址，没有保存，返回登录时需要提示用户初始化加载新的地址
       *   3. 增加了新的地址，选中了新的地址，没有保存，点击登录时需要提示用户初始化临时选中的地址
       *
       *   - 临时选中和当前选中的地址不一样时，提示用户保存地址
       *     - 不一样是： 1. id不一样  2. id一样，但是name不一样（修改导致）
       */
            // 页面上选中的
            const tmpItem = this.currentServer;
            // 实际选中的
            const currentItem = this.serverAccessor.getCheckedItem();
            // 1. 如果页面上没有选中的，提示非空
            if (!tmpItem) {
                this.showDialog(this.locale.chooseOneToLoginText);
                return;
            }
            // 1. 如果实际的没有选中的，就提示用户保存并初始化
            if (!currentItem) {
                this.showSaveDialog(this.locale.hasInfoChangeText).then((res) => {
                    if (res === 1) { // 重新初始化
                        this.save();
                    }
                });
                return;
            }

            // 2. 两个选中的都有的情况
            //  -1. 如果实际选中的name和当前选中的name不同，也要提示用户保存 重新初始化
            if (currentItem.name !== tmpItem.name) {
                this.showSaveDialog(this.locale.hasInfoChangeText).then((res) => {
                    if (res === 1) { // 重新初始化
                        this.save();
                    }
                });
                return;
            }

            // 3. 两个选中都一致时，如果和老的选中的不一样，也要提示用户保存 重新初始化
            if (this.oldItem) {
                if (currentItem.id === this.oldItem.id && currentItem.name !== this.oldItem.name) {
                    this.showSaveDialog(this.locale.hasInfoChangeText).then((res) => {
                        if (res === 1) { // 重新初始化
                            this.save();
                        }
                    });
                    return;
                }
            }
            // 4. 地址合法返回登录
            this.validateSeting(currentItem.name)
                .then((res) => {
                    if (res === true) {
                        // return this.$router.go(0)
                        const flag = window.localStorage.getItem('initProcessIsError');
                        if (flag === '1') {
                            // 有错误，重新初始化
                            if (IS_DESKTOP) {
                                window.RongDesktop.system.reload();
                            } else {
                                this.$router.push('/login');
                                this.$nextTick(() => {
                                    window.location.reload();
                                });
                            }
                        } else {
                            this.$router.push('/login');
                        }
                    } else {
                        this.showDialog(this.locale.sureRightToLoginText);
                    }
                })
                .catch(() => {
                    this.showDialog(this.locale.sureRightToLoginText);
                });
        },
        addItem() {
            this.$emit('current-view', 'server-conf-add');
        },
        lookConf(item) {
            this.$emit('current-view', 'server-conf-look', item);
            this.$emit('updateOldItem', item);
        },
        // 设置默认选中地址
        setCheckedRadio() {
            // this.$nextTick(() => {
            //   let elm = this.$refs.server_conf_ref;
            //   elm = Array.isArray(elm) ? elm : [elm];
            //   elm.forEach((l) => {
            //     if (l) {
            //       if (l.dataset && l.dataset.ischecked == "true") {
            //         l.checked = true;
            //       } else {
            //         l.checked = false;
            //       }
            //     }
            //   });
            // });
            const r = this.serverConfList.find(item => item.checked === true);
            if (r) {
                this.currentServer = r;
            } else {
                this.currentServer = null;
            }
        },
        // 保存
        save() {
            if (!this.currentServer) {
                this.showDialog(this.locale.chooseOneToSaveText);
                return;
            }
            const current = this.serverAccessor.getItemById(this.currentServer.id);
            this.serverAccessor.setChecked(current, true);
            this.initList();
            // 设置默认值
            this.$nextTick(() => {
                this.setCheckedRadio();
            });
            // 跳转登陆
            // if()
            // setTimeout(() => {
            //     this.$router.push("/login");
            if (IS_DESKTOP) {
                this.$nextTick(() => {
                    window.RongDesktop.system.reload();
                });
            } else {
                window.location.reload();
                setTimeout(() => {
                    this.$router.push('/login');
                }, 500);
            }
            // }, 500);
        },
    },
};
</script>

<style lang="scss">
$blue_color: #008af3;
.server_conf-container {
  height: 250px;
  padding-bottom: 75px;
  box-sizing: border-box;
  position: relative;
  .server_conf-ls {
    height: 100%;
    overflow: scroll;
    .server_conf-item {
      font-size: 14px;
      border-bottom: 1px solid #ccc;
      padding: 13px 10px;
      padding-right: 23px;
      position: relative;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      input {
        margin-left: 10px;
        font-size: 14px;
        cursor: pointer;
      }
      .server_conf-icon {
        position: absolute;
        right: 10px;
        top: 10px;
        font-size: 17px;
        cursor: pointer;
      }
    }
  }
  .server_conf-btns {
    height: 75px;
    position: absolute;
    width: 100%;
    bottom: 0;
    left: 0;
    padding: 5px 12px 5px 12px;
    .save_btns {
      height: 35px;
      display: flex;
      justify-content: center;
      align-items: center;
      .btn_normal {
        display: inline-block;
        background-color: $blue_color;
        color: #fff;
        text-align: center;
        border-radius: 4px;
        height: 32px;
        line-height: 32px;
        cursor: pointer;
        padding: 0px 80px;
        box-sizing: border-box;
      }
    }
    .other_btns {
      height: 30px;
      position: relative;
      width: 100%;
      .btn_text {
        font-size: 13px;
        color: #0085e1;
        cursor: pointer;
      }

      .btn_text-lf {
        position: absolute;
        left: 15px;
        top: 9px;
      }
      .btn_text-rg {
        position: absolute;
        right: 15px;
        top: 9px;
      }
    }
  }
}
</style>
