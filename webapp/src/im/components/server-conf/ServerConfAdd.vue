<template>
  <div class="server_conf-look">
    <div class="server_conf-cont-look">
      <input
        type="text"
        :placeholder="locale.iptPlacehoderText"
        @focus="iptFocus"
        v-model.trim="server_name"
        :class="{ server_ipt_error: error_msg }"
      />
      <div class="ipt_error" v-if="error_msg">{{ error_msg }}</div>
    </div>
    <div class="server_conf-look-btns">
      <div class="save_btns">
        <span class="btn_normal btn_normal-center" @click="save_add">{{ locale.saveText }}</span>
      </div>
      <div class="back_btn">
        <span class="btn_text btn_text-lf" @click="back">{{ locale.backText }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import {
    Accessor,
    isValidteServerName,
    addServerConfSuffix,
    httpRequest,
} from './utils';
import getLocaleMixins from '../../utils/getLocaleMixins';

export default {
    name: 'ServerConfLook',
    data() {
        return {
            serverAccessor: Accessor,
            server_name: '',
            error_msg: '',
        };
    },
    mixins: [
        getLocaleMixins('serverConf'),
    ],
    methods: {
        back() {
            this.$emit('current-view', 'server-conf-list');
        },
        // 创建item
        createItem() {
            const createId = randomLength => Number(
                Math.random().toString().substr(3, randomLength) + Date.now(),
            ).toString(36);
            const getCreateTime = () => Date.now();
            return {
                id: createId(15), // id
                name: this.server_name, // 服务地址
                createTime: getCreateTime(), // 创建时间
                isDefault: false, // 是否是项目配置文件的默认配置
                checked: false, // 是否是选中状态
            };
        },
        iptFocus() {
            this.error_msg = '';
        },
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
        // 校验
        validate(current) {
            if (!current.name) {
                this.error_msg = this.locale.noEmptyURL;
                return false;
            }
            // 合法的服务地址校验
            if (!isValidteServerName(current.name)) {
                this.error_msg = this.locale.IllegalURL;
                return false;
            }
            // 去重校验
            if (this.serverAccessor.isExist(current)) {
                this.error_msg = this.locale.esitsURL;
                return false;
            }
            return true;
        },
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
        // save
        save_add() {
            const current = this.createItem();
            // return this.serverAccessor.add(current);
            if (!this.validate(current)) return;
            this.validateSeting(current.name)
                .then((res) => {
                    if (res === true) {
                        this.serverAccessor.add(current);
                        this.back();
                    } else {
                        this.showDialog(this.locale.serverConfFailedText);
                    }
                })
                .catch(() => {
                    this.showDialog(this.locale.serverConfFailedText);
                });
        },
    },
};
</script>

<style lang="scss">
$blue_color: #008af3;
.server_conf-look {
  height: 250px;
  padding-bottom: 75px;
  box-sizing: border-box;
  position: relative;
  .server_conf-cont-look {
    height: 100%;
    box-sizing: border-box;
    padding: 15px 15px 0px 15px;
    input {
      width: 100%;
      background-color: #fff;
      background-image: none;
      border-radius: 4px;
      border: 1px solid #dcdfe6;
      box-sizing: border-box;
      color: #606266;
      display: inline-block;
      font-size: inherit;
      height: 40px;
      line-height: 40px;
      outline: none;
      padding: 0 15px;
      transition: border-color 0.2s cubic-bezier(0.645, 0.045, 0.355, 1);
      &:focus {
        border: 1px solid #008af3;
      }
      &.server_ipt_error {
        border: 1px solid red;
      }
      &::-webkit-input-placeholder {
        font-size: 14px;
        font-weight: 400;
        color: #b7b7b7;
      }
    }
    .ipt_error {
      color: red;
      font-size: 13px;
      margin-top: 2px;
    }
  }
  .server_conf-look-btns {
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
    .back_btn {
      height: 30px;
      position: relative;
      .btn_text {
        font-size: 13px;
        color: #0085e1;
        cursor: pointer;
      }
      .btn_text-lf {
        position: absolute;
        left: 13px;
        top: 9px;
      }
    }
  }
}
</style>
