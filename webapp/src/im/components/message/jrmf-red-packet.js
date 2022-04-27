export default {
    name: 'jrmf-red-packet-message',
    props: ['message'],
    computed: {
        content() {
            return this.RongIM.common.getJrmfRedPacket(this.message);
        },
    },
};
