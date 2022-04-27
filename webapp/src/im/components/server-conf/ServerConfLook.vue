<template>
  <div class="server_conf-add">
    <div class="server_conf-cont-add">
      <div
        v-if="!isEditMode"
        @click="() => (isEditMode = true)"
        class="server_look_text"
      >
        {{ currentServerItem.name }}
      </div>
      <input
        v-if="isEditMode"
        type="text"
        @focus="iptFocus"
        :placeholder="locale.iptPlacehoderText"
        v-model.trim="currentServerItem.name"
        :class="{ server_ipt_error: error_msg }"
      />
      <div class="ipt_error" v-if="error_msg">{{ error_msg }}</div>
    </div>
    <div class="server_conf-add-btns">
      <div class="top_btn">
        <span class="btn_normal btn_normal-center" @click="save_look"
          >{{ locale.saveText }}</span
        >
        <span class="btn_normal plain" @click="handle_delete"
          >{{ locale.deleteText }}</span
        >
      </div>
      <div class="bottom_btn">
        <span class="btn_text btn_text-lf" @click="back">{{ locale.backText }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import {
    cloneDeep,
    Accessor,
    isValidteServerName,
    addServerConfSuffix,
    httpRequest,
} from './utils';
import getLocaleMixins from '../../utils/getLocaleMixins';

export default {
    name: 'ServerConfLook',
    props: {
        currentItem: {
            type: Object,
            default: () => ({}),
        },
    },
    mounted() {
        this.currentServerItem = cloneDeep(this.currentItem);
    },
    mixins: [
        getLocaleMixins('serverConf'),
    ],
    data() {
        return {
            serverAccessor: Accessor,
            currentServerItem: {},
            isEditMode: false, // 默认非编辑模式
            error_msg: '',
        };
    },
    watch: {
        currentItem: {
            deep: true,
            handler(newVal) {
                this.currentServerItem = cloneDeep(newVal);
            },
        },
    },
    methods: {
        back() {
            this.$emit('current-view', 'server-conf-list');
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
        iptFocus() {
            this.error_msg = '';
        },
        // 修改保存
        save_look() {
            if (!this.validate(this.currentServerItem)) return;
            this.validateSeting(this.currentServerItem.name)
                .then((res) => {
                    if (res === true) {
                        this.serverAccessor.update(this.currentServerItem);
                        this.back();
                    } else {
                        this.showDialog(this.locale.serverConfFailedText);
                    }
                })
                .catch(() => {
                    this.showDialog(this.locale.serverConfFailedText);
                });
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
        // 删除
        handle_delete() {
            if (this.serverAccessor.getList().length <= 1) {
                this.showDialog(this.locale.lastURLNoDelete);
                return;
            }
            this.serverAccessor.delete(this.currentServerItem);
            this.back();
        },
    },
};
</script>

<style lang="scss">
$blue_color: #008af3;
.server_conf-add {
  height: 250px;
  padding-bottom: 75px;
  box-sizing: border-box;
  position: relative;
  .server_conf-cont-add {
    height: 100%;
    box-sizing: border-box;
    padding: 15px 15px 0px 15px;
    .server_look_text {
      width: 100%;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
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
  .server_conf-add-btns {
    height: 75px;
    position: absolute;
    width: 100%;
    bottom: 0;
    left: 0;
    padding: 5px 12px 5px 12px;
    .top_btn {
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
        padding: 0px 36px;
        box-sizing: border-box;
        &.plain{
            font-weight: 400;
            color: #777777;
            border: 1px solid #E3E3E3;
            background-color: #fff;
            margin-left: 15px;
        }
      }
    }
    .bottom_btn {
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
