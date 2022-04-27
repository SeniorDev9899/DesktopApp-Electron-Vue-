/* eslint-disable no-param-reassign */
import KeyCode from '../../utils/KeyCode';

/*
说明： 图片预览， 在发送截图 base64 字符串时先预览图片， 再进行确认发送。
*/
export default function (base64, hasStr, callback) {
    if (typeof hasStr === 'function') {
        callback = hasStr;
        hasStr = false;
    }
    const options = {
        name: 'preview-image',
        template: '#rong-template-preview-image',
        data() {
            return {
                show: true,
                src: base64,
                hasStr,
            };
        },
        created() {
            window.addEventListener('keyup', this.keyup);
        },
        beforeDestroy() {
            removeKeyupListener(this.keyup);
        },
        directives: {
            autoFocus(el) {
                Vue.nextTick(() => {
                    el.focus();
                });
            },
        },
        methods: {
            close() {
                this.show = false;
                removeKeyupListener(this.keyup);
            },
            submit() {
                const image = $('.previewImage')[0];
                const imageInfo = {
                    width: image.clientWidth,
                    height: image.clientHeight,
                };
                this.close();
                callback(imageInfo);
            },
            convertStr() {
                this.close();
                callback(true);
            },
            keyup(event) {
                switch (event.keyCode) {
                case KeyCode.enter:
                    this.submit();
                    break;
                case KeyCode.esc:
                    this.close();
                    break;
                default:
                }
            },
        },
    };
    window.RongIM.common.mountDialog(options);
}

function removeKeyupListener(event) {
    window.removeEventListener('keyup', event);
}
