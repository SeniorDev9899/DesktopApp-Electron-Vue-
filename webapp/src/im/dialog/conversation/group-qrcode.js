import avatar from '../../components/avatar.vue';
import getGroupName from '../../common/getGroupName';
import MessageType from '../../utils/MessageType';
import Base64 from '../../utils/Base64Media';
import showForward from './forward';

export default function (group) {
    const options = {
        name: 'group-qrcode',
        template: '#rong-template-group-qrcode',
        data() {
            return {
                show: true,
                base64: '',
            };
        },
        components: {
            avatar,
        },
        created() {
            this.group = group;
            const im = this.$im();
            const groupApi = im.dataModel.Group;
            const context = this;
            Vue.nextTick(() => {
                const qrcodeDom = context.$refs.qrcode;
                const qrcodeImgDom = context.$refs.qrcodeImg;
                groupApi.createQRCode(qrcodeDom, im.auth.id, group.id, { width: 207, height: 209 });
                groupApi.createQRCode(qrcodeImgDom, im.auth.id, group.id, { width: 400, height: 400 });
                setTimeout(() => {
                    const imgDom = context.$refs.saveImg;
                    domtoimage.toPng(imgDom)
                        .then((dataUrl) => {
                            context.base64 = dataUrl;
                        })
                        .catch((error) => {
                            console.error('oops, something went wrong!', error);
                        });
                }, 0);
            });
        },
        methods: {
            getHtmlGroupName(...args) {
                return this.RongIM.common.getHtmlGroupName(...args);
            },
            memberCount(item) {
                let format = this.locale.contact.person;
                if (item.member_count === 1) {
                    format = this.locale.contact.personSingle;
                }
                return this.localeFormat(format, item.member_count);
            },
            getGroupName() {
                return getGroupName(group);
            },
            save() {
                if (navigator.msSaveBlob && Uint8Array) {
                    const base64 = this.base64.replace(/^data:\S+?;base64,/, '');
                    const asiiStr = atob(base64);
                    const typeArray = new Uint8Array(asiiStr.length);
                    for (let i = 0; i < asiiStr.length; i += 1) {
                        typeArray.set([asiiStr.charCodeAt(i)], i);
                    }
                    const blob = new Blob([typeArray], { type: 'image/png' });
                    navigator.msSaveBlob(blob, `${new Date().getTime()}.png`);
                    return;
                }
                const downloadTag = document.createElement('a');
                downloadTag.target = '_blank';
                downloadTag.href = this.base64;
                downloadTag.download = `${new Date().getTime()}.png`;
                document.body.appendChild(downloadTag);
                downloadTag.click();
                document.body.removeChild(downloadTag);
            },
            forward() {
                const context = this;
                const message = { };
                const base64 = Base64.replace(context.base64);
                message.content = {
                    content: base64,
                    messageName: MessageType.ImageMessage,
                    thumbnailPath: '',
                    isForwaed: true,
                };
                showForward(message);
                context.close();
            },
            close() {
                this.show = false;
            },
        },
    };

    window.RongIM.common.mountDialog(options, (dialog) => {
        dialog.$im().$watch('$route', () => {
            // eslint-disable-next-line no-param-reassign
            dialog.show = false;
        });
    });
}
