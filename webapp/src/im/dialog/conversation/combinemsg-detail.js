import getLocaleMixins from '../../utils/getLocaleMixins';
import getCombineMessageTitle from '../../utils/getCombineMessageTitle';

/*
说明：合并详情
*/
export default function (item) {
    const options = {
        name: 'combinemsg-detail',
        mixins: [getLocaleMixins('combinemsg-detail')],
        template: 'templates/conversation/combinemsg-detail.html',
        data() {
            return {
                show: true,
                combineMsg: '',
                dialogTitle: '',
            };
        },
        mounted() {
            const remoteUrl = item.content.remoteUrl;
            if (remoteUrl) {
                this.combineMsg = remoteUrl;
            }
            const nameList = item.content.nameList;
            const conversationType = item.content.conversationType;
            this.dialogTitle = getCombineMessageTitle(this, nameList, conversationType);
        },
        methods: {
            goback() {
                this.$refs.iframe.contentWindow.location.reload();
            },
            close() {
                this.show = false;
            },
        },
    };
    window.RongIM.common.mountDialog(options);
}
