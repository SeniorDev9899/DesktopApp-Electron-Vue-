<template>
  <div class="app_sort-dialog__wrapper" v-show="visible">
    <div class="app_sort-dialog" :style="{ width: width }">
      <div class="dialog-title">
        {{ locale.sortText }}
        <span class="close rong-titlebar-close" @click="() => (visible = false)"
          >×</span
        >
      </div>
      <div class="dialog_body">
        <div
          class="app-li-item"
          v-for="item in selectAppList"
          :key="item.id"
          draggable="true"
          @dragstart="handleDragStart($event, item)"
          @dragover.prevent="handleDragOver($event, item)"
          @dragenter="handleDragEnter($event, item)"
          @dragend="handleDragEnd($event, item)"
        >
          <div class="app_info">
            <img :src="item.logo_url" class="app-url" />
            <span class="app-title">{{ item.name }}</span>
          </div>
          <span class="app_info_icon"></span>
        </div>
        <div class="nodata-text" v-if="selectAppList.length === 0">{{locale.nodataText}}</div>
      </div>
      <div class="dialog-footer">
        <span class="app_sort-btn" @click="handleSave">{{locale.saveText}}</span>
      </div>
    </div>
  </div>
</template>

<script>
import config from '../config';
import locale from '../locale';

/**
 * 获取常用的应用
 * @param {*} context
 * @param {*} userId
 */
function getLikeAppList(context, userId) {
    const serverApi = window.RongWork.serverApi;
    serverApi.getFavApps(userId, (errorCode, result) => {
        if (errorCode) {
            return;
        }
        const allApps = result.apps || [];
        // 获取我常用的应用列表
        serverApi.getLikeApps((error, likeAppResult) => {
            if (error) {
                return;
            }
            const likeApps = [];
            likeAppResult.apps.forEach((item) => {
                const likeAppDetail = allApps.filter(detail => detail.id === item) || {};
                likeApps.push(likeAppDetail[0]);
            });
            const tmpContext = context;
            tmpContext.selectAppList = likeApps;
        });
    });
}

export default {
    name: 'sort-app-dialog',
    props: {
        width: {
            type: String,
            default: '35%',
        },
    },
    data() {
        return {
            visible: false,
            selectAppList: [], // app列表
            dragging: null,
        };
    },
    computed: {
        locale() {
            return locale[config.locale];
        },
    },
    mounted() {
        this.getSortDataList();
    },
    watch: {
        visible(newVal) {
            if (newVal === false) {
                this.$emit('closed');
            }
        },
    },
    methods: {
        init() {
            this.visible = true;
        },
        // 获取列表
        getSortDataList() {
            getLikeAppList(this, null);
        },
        deepcopy(sourceObj, target = {}) {
            const tmpTarget = target;
            function isObject(val) {
                return typeof val === 'object' && val !== null;
            }
            if (!isObject(sourceObj)) return sourceObj;
            Object.keys(sourceObj).forEach((key) => {
                // 判断是普通值还是复杂类型
                if (typeof sourceObj[key] !== 'object' || sourceObj[key] === null) {
                    // 基本数据类型
                    tmpTarget[key] = sourceObj[key];
                } else {
                    // 复杂数据类型
                    tmpTarget[key] = Array.isArray(sourceObj[key]) ? [] : {};
                    this.deepcopy(sourceObj[key], tmpTarget[key]);
                }
            });
            return tmpTarget;
        },
        // 拖拽开始
        handleDragStart(e, item) {
            this.dragging = item;
        },
        // 拖拽结束
        handleDragEnd(/** e, item */) {
            this.dragging = null;
        },
        // 首先把div变成可以放置的元素，即重写dragenter/dragover
        handleDragOver(e) {
            e.dataTransfer.dropEffect = 'move';
        },
        handleDragEnter(e, item) {
            e.dataTransfer.effectAllowed = 'move';
            if (item === this.dragging) {
                return;
            }
            const newItems = [...this.selectAppList];
            const src = newItems.indexOf(this.dragging);
            const dst = newItems.indexOf(item);
            newItems.splice(dst, 0, ...newItems.splice(src, 1));
            this.selectAppList = newItems;
        },
        // save
        handleSave() {
            this.$emit('sortChange', this.deepcopy(this.selectAppList, []));
            this.visible = false;
        },
    },
};
</script>

<style lang="scss">
.app_sort-btn {
  display: inline-block;
  white-space: nowrap;
  cursor: pointer;
  color: #606266;
  text-align: center;
  box-sizing: border-box;
  outline: none;
  margin: 0;
  transition: 0.1s;
  font-weight: 500;
  padding: 6px 40px;
  font-size: 14px;
  border-radius: 4px;
  color: #fff;
  background-color: #3a91f3;
  border-color: #3a91f3;
  &.plain {
    background: #fff;
    border: 1px solid #dcdfe6;
    color: #606266;
  }
}
.app_sort-dialog__wrapper {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  overflow: auto;
  z-index: 2003;
  // background-color: rgba(128, 128, 128, 0.7);
  background-color: transparent;
  .app_sort-dialog {
    position: relative;
    margin: 0 auto;
    background: #fff;
    border-radius: 4px;
    box-sizing: border-box;
    margin-top: 15vh;
    width: 50%;
    border: 2px solid #dcdfe6;
    .dialog-title {
      padding: 20px 20px 10px;
      font-size: 18px;
      .close {
        position: absolute;
        right: 18px;
        top: 17px;
        cursor: pointer;
        width: 20px;
        height: 20px;
      }
    }
    .dialog_body {
      padding: 30px 20px;
      color: #606266;
      font-size: 14px;
      word-break: break-all;
      height: 300px;
      overflow: scroll;
      overflow-x: hidden;
      .app-li-item {
        padding: 10px 0;
        border-bottom: 1px solid #dcdfe6;
        position: relative;
        .app_info {
          display: inline-block;
          height: 40px;
          .app-url {
            height: 35px;
            vertical-align: middle;
          }
          .app-title {
            display: inline-block;
            margin-left: 10px;
            line-height: 30px;
          }
        }
        .app_info_icon {
          position: absolute;
          right: 0;
          top: 8px;
          background: url(../../../../public/css/images/work-sort.svg) no-repeat center;
          background-size: 100%;
          width: 30px;
          height: 40px;
          line-height: 40px;
        }
      }
      .nodata-text {
        width: 100%;
        height: 100%;
        color: #606266;
        display: flex;
        justify-content: center;
        align-items: center;
      }
    }
    .dialog-footer {
      padding: 10px 20px 20px;
      display: flex;
      justify-content: center;
      align-items: center;
      box-sizing: border-box;
    }
  }
}
</style>
