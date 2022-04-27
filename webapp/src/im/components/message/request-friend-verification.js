import getLocaleMixins from '../../utils/getLocaleMixins';
import verifyFriend from '../../dialog/friend/verify-friend';

const name = 'request-friend-verification-message';

/*
说明：好友验证请求消息
功能：
    发送消息时验证有一方为外部联系人并且不是互为好友则插入一条消息提示需要加为好友
*/
export default {
    name,
    props: ['message'],
    mixins: [getLocaleMixins(name)],
    methods: {
        sendRequest() {
            const userId = this.message.targetId;
            this.RongIM.dataModel.User.get(userId, (errorCode, user) => {
                if (errorCode) {
                    return;
                }
                verifyFriend(user);
            });
        },
    },
};
