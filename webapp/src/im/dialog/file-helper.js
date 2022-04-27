import avatar from '../components/avatar.vue';

export default function (helper) {
    const options = {
        name: 'get-file-helper',
        template: 'templates/file-helper/helper.html',
        data() {
            return {
                show: true,
                helper,
            };
        },
        components: {
            avatar,
        },
        methods: {
            close() {
                this.show = false;
            },
            start() {
                const im = this.$im();
                const params = {
                    conversationType: RongIMLib.ConversationType.PRIVATE,
                    targetId: helper.id,
                    user: helper,
                };
                im.$router.push({
                    name: 'conversation',
                    params,
                });
                im.dataModel.Conversation.add(params);
                const itemId = ['conversation', params.conversationType, params.targetId].join('-');
                const item = document.getElementById(itemId);
                if (item) {
                    const parentHeight = item.parentNode.offsetHeight;
                    const offsetTop = item.offsetTop;
                    const alginWithTop = offsetTop > parentHeight;
                    item.scrollIntoView(alginWithTop);
                }
                this.close();
            },
        },
    };
    window.RongIM.common.mountDialog(options);
}
