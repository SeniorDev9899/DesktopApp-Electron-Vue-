/* eslint-disable no-param-reassign */
import avatar from './avatar.vue';
import drag from '../drag';
import Base64Util from '../utils/Base64Media';
import isEmpty from '../utils/isEmpty';
import console from '../utils/console';
import getLocaleMixins from '../utils/getLocaleMixins';

const name = 'edit-avatar';
const MAX_SCALE = 5;

function exchangeNewAvatar(context, event) {
    const file = event.target.files[0];
    if (isEmpty(file)) {
        return;
    }
    const fr = new FileReader();
    fr.onload = function onload(e) {
        const src = e.target.result;
        /*
        exif Orientation 说明参考文档
        http://www.exif.org/Exif2-2.PDF
        */
        EXIF.getData({ src }, function onData() {
            const Orientation = EXIF.getTag(this, 'Orientation');
            let rotate = 0;
            switch (Orientation) {
            case 1:
                rotate = 0;
                break;
            case 6:
                rotate = 90;
                break;
            case 3:
                rotate = 180;
                break;
            case 8:
                rotate = 270;
                break;
            default:
                rotate = 0;
            }
            context.rotate = rotate;
            context.src = src;
        });
    };
    fr.readAsDataURL(file);
}

function loadedImg(context, img) {
    $(img).css({
        'margin-left': 0,
        'margin-top': 0,
    });
    context.imgWidth = img.width;
    context.imgHeight = img.height;
    const canvasSize = context.canvasSize;
    const imgMinSize = Math.min(img.width, img.height);
    context.minScale = canvasSize / imgMinSize;
    context.scale = context.minScale;
    context.loadDone = true;
}

function dragImg(context, event) {
    if (!context.loadDone) {
        return;
    }
    const el = event.target;
    const $el = $(el);
    const oldPosition = {
        left: parseFloat($el.css('left')),
        top: parseFloat($el.css('top')),
    };
    drag(el, event, (position) => {
        const deltaX = position.left - oldPosition.left;
        const deltaY = position.top - oldPosition.top;
        context.offsetX = deltaX;
        context.offsetY = deltaY;
        $el.css({
            'margin-left': deltaX,
            'margin-top': deltaY,
        });
    }, el.parentElement);
}

function dragTrackButton(context, event) {
    if (!context.loadDone) {
        return;
    }

    const el = event.target;
    const $el = $(el);

    const trackWidth = $el.parent().width();
    drag(el, event, (position) => {
        const left = Math.min(Math.max(0, position.left), trackWidth);
        const ratio = left / trackWidth;
        context.percent = ratio * 100;
    });
}

function clipImage(img, sx, sy, sWidth, sHeight, dWidth, dHeight, rotate, isSmall) {
    const canvas = document.createElement('canvas');
    canvas.width = dWidth;
    canvas.height = dHeight;
    const ctx = canvas.getContext('2d');
    ctx.translate(dWidth / 2, dHeight / 2);
    ctx.rotate(rotate * Math.PI / 180);
    ctx.drawImage(img, sx, sy, sWidth, sHeight, -dWidth / 2, -dHeight / 2, dWidth, dHeight);
    let url = '';
    if (isSmall) {
        url = canvas.toDataURL('image/jpeg', 1.0);
    } else {
        url = canvas.toDataURL();
    }
    url = Base64Util.replace(url);
    return url;
}

function getImgData(context, callback) {
    const MAX = 960;
    const MIN = 200;
    const img = context.$refs.img;
    const scale = context.scale;
    const leftCorner = context.imgWidth / 2 - context.canvasSize / 2 / scale;
    const topCorner = context.imgHeight / 2 - context.canvasSize / 2 / scale;
    const sx = leftCorner - context.offsetX / scale;
    const sy = topCorner - context.offsetY / scale;
    const sWidth = context.canvasSize / scale;
    const sHeight = context.canvasSize / scale;
    let dWidth = 160;
    let dHeight = 160;

    const smallBase64 = clipImage(img, sx, sy, sWidth, sHeight, dWidth, dHeight, context.rotate, true);

    dWidth = Math.min(MAX, Math.max(MIN, sWidth));
    dHeight = Math.min(MAX, Math.max(MIN, sHeight));
    const bigBase64 = clipImage(img, sx, sy, sWidth, sHeight, dWidth, dHeight, context.rotate);

    callback(null, {
        big: bigBase64,
        small: smallBase64,
    });
}

/**
 * @param type - 'file' or 'image' or 'base64'
 * @param fileData
 * @param callback
 */
function upload(context, type, fileData, imgType, callback) {
    const config = context.RongIM.config.upload[type] || context.RongIM.config.upload.file;
    config.ext = imgType || 'png';
    let domain = '';
    if (type === 'base64') {
        config.data = UploadClient.dataType.data;
    }
    config.getToken = function getToken(done) {
        const dataModel = context.RongIM.dataModel;
        dataModel.User.getAvatarToken((errorCode, result) => {
            if (errorCode) {
                console.warn('获取上传 token 失败');
                return;
            }
            domain = result.domain;
            done(result.token);
        });
    };

    const actionMap = {
        file: 'initFile',
        image: 'initImage',
        base64: 'initImgBase64',
    };
    const action = actionMap[type];
    const uploadCallback = {
        onBeforeUpload() {
        },
        onProgress() {
        },
        onCompleted(data) {
            let url = context.RongIM.common.getDownloadUrl(context.RongIM.config, data);
            url = url || `${window.location.protocol}//${domain}/${data.key}`;
            callback(null, url);
        },
        onError: callback,
    };
    UploadClient[action](config, (uploadFile) => {
        uploadFile.upload(fileData, uploadCallback);
    });
}

function uploadNewAvatar(context, callback) {
    let bigSrc = '';
    let smallSrc = '';
    context.getImgData((errorCode, base64) => {
        if (errorCode) {
            callback(errorCode);
            return;
        }
        upload(context, 'base64', base64.big, 'png', (error, src) => {
            if (error) {
                callback(error);
                return;
            }
            bigSrc = src;
            upload(context, 'base64', base64.small, 'jpeg', (err, small) => {
                if (err) {
                    callback(err);
                    return;
                }
                smallSrc = small;
                callback(null, { bigSrc, smallSrc });
            });
        });
    });
}

function saveNewAvatar(context, userApi, im) {
    const currentUserId = im.loginUser.id;
    if (isEmpty(context.src)) {
        context.close();
        return;
    }
    if (context.isBusy) {
        context.RongIM.common.messageToast({
            message: im.locale.tips.uploadAvatar,
            type: 'error',
        });
        return;
    }
    context.isBusy = true;
    context.upload((errorCode, data) => {
        // 用户已变更
        if (!im.loginUser || currentUserId !== im.loginUser.id) {
            return;
        }
        context.isBusy = false;
        if (errorCode) {
            context.toastError(errorCode);
            return;
        }
        userApi.setAvatar(data.smallSrc, data.bigSrc, (error) => {
            if (error) {
                context.toastError(error);
                return;
            }
            im.loginUser.avatar = data.smallSrc;
            im.loginUser.portrait_big_url = data.bigSrc;
            context.$emit('srcchange', data.smallSrc, data.bigSrc);
            context.close();
        });
    });
}

// 修改头像组件
export default {
    name,
    data() {
        const im = this.$im();
        return {
            showField: true,
            user: im.loginUser,
            src: im.loginUser.portrait_big_url || im.loginUser.avatar,
            canvasSize: 198,
            imgWidth: 0,
            imgHeight: 0,
            offsetX: 0,
            offsetY: 0,
            loadDone: false,
            minScale: 0.1,
            percent: 0,
            rotate: 0,
            isBusy: false,
        };
    },
    mixins: [getLocaleMixins(name)],
    components: {
        avatar,
    },
    computed: {
        scale: {
            get() {
                return this.percent / 100 * MAX_SCALE + this.minScale;
            },
            set(value) {
                this.percent = (value - this.minScale) / MAX_SCALE * 100;
            },
        },
    },
    methods: {
        toastError(errorCode) {
            let el = null;
            if (this.$el) {
                el = this.$el.firstChild;
            }
            this.RongIM.common.toastError(errorCode, el);
        },
        close() {
            this.$emit('close');
        },
        exchangeNewAvatar(event) {
            exchangeNewAvatar(this, event);
        },
        loadedImg(event) {
            loadedImg(this, event.target);
        },
        loadError() {
            this.src = '';
        },
        dragImg(event) {
            dragImg(this, event);
        },
        dragTrackButton(event) {
            dragTrackButton(this, event);
        },
        zoomOut() {
            const STEP = 1;
            this.percent = Math.max(0, this.percent - STEP);
        },
        zoomIn() {
            const STEP = 1;
            this.percent = Math.min(100, this.percent + STEP);
        },
        getImgData(callback) {
            getImgData(this, callback);
        },
        upload(callback) {
            uploadNewAvatar(this, callback);
        },
        saveNewAvatar() {
            saveNewAvatar(this, this.RongIM.dataModel.User, this.$im());
        },
    },
};
