import UploadStatus from '../../utils/UploadStatus';
import Base64Util from '../../utils/Base64Media';
import { messageIfSupportView } from '../../utils/netEnvironment';

const name = 'image-message';

export default {
    name,
    props: ['message', 'isHistory'],
    data() {
        return {
            style: {
                height: '180px',
            },
            sentStatus: RongIMLib.SentStatus,
            uploadStatus: UploadStatus,
            size: {},
            imageUri: '',
        };
    },
    computed: {
        isGif() {
            // const regEx = /^(http|https).+\.gif$/;
            return this.message.messageType === RongIMLib.RongIMClient.MessageType.GIFMessage/* || regEx.test(this.remoteUrl) */;
        },
        base64() {
            const imageMsg = this.message.content;
            const content = imageMsg.content;
            return Base64Util.concat(content);
        },
        isUploading() {
            const uploadStatus = this.message.uploadStatus;
            const uploading = uploadStatus === UploadStatus.UPLOADING;
            const progress = this.message.progress > 0;
            return uploading && progress;
        },
        path() {
            let percent = (this.message.progress || 0) / 100;
            if (percent === 1) {
                percent = 0.99;
            }
            const r = 10;
            const degrees = percent * 360;
            const rad = degrees * (Math.PI / 180);
            const x = (Math.sin(rad) * r).toFixed(2);
            const y = -(Math.cos(rad) * r).toFixed(2);
            const lenghty = window.Number(degrees > 180);
            let path = ['M', 0, -r, 'A', r, r, 0, lenghty, 1, x, y];
            path = path.join(' ');
            return path;
        },
    },
    methods: {
        showImage() {
            if (this.message.noSupportView) {
                return;
            }
            this.$emit('showImage', this.message);
        },
        updateThumbnailHeight(event) {
            const $img = $(event.target);
            const width = $img.width();
            const height = $img.height();
            this.style = {
                width: `${width}px`,
                height: `${height}px`,
            };
            if (this.isHistory) {
                if (width < height) {
                    $img.css({
                        width: '100%',
                    });
                } else {
                    $img.css({
                        height: '100%',
                    });
                }
            }
            this.$emit('imageDownloadComplete', this.message);
        },
        largeImageLoaded(event) {
            const $img = $(event.target);
            const width = $img.width();
            const height = $img.height();
            this.size = { width, height };
            if (width < height) {
                $img.css({
                    width: this.style.width,
                    height: 'auto',
                });
            } else {
                $img.css({
                    width: 'auto',
                    height: this.style.height,
                });
            }
            $img.css('opacity', 1);
        },
    },
    created() {
        const context = this;
        const fileApi = this.RongIM.dataModel.File;
        const common = this.RongIM.common;

        let imageUri = context.message.content.imageUri || context.message.content.remoteUrl;

        const [url, noSupportView] = messageIfSupportView(imageUri);
        if (this.isGif) {
            this.message.content.remoteUrl = url;
        } else {
            this.message.content.imageUri = url;
        }
        this.message.noSupportView = noSupportView;

        if (context.message.noSupportView) {
            return;
        }

        fileApi.getImageDownloadToken((token) => {
            if (!imageUri) {
                return;
            }
            if (imageUri.indexOf('?') !== -1) {
                imageUri += `&token=${token}`;
            } else {
                imageUri += `?token=${token}`;
            }
            context.imageUri = common.trans2Localfile(imageUri, 'media');
        });
    },
};
