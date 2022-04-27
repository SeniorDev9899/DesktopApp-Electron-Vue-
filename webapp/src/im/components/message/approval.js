import ApproveState from '../../common/ApproveState';
import userProfile from '../../dialog/contact/user';
import approvalDetail from '../../dialog/approval-detail';
import getLocaleMixins from '../../utils/getLocaleMixins';

const approveState = {
    // 请及时审批 0 非系统状态,用于控制显示
    REMIND: 0,
    // 审批中 1
    PENDING: 1,
    // 审批通过 2
    PASSED: 2,
    // 审批拒绝 3
    REFUSED: 3,
};

function getQuery(str) {
    const query = {};
    // TODO: 这里使用 ? server 传输有问题
    str.split('?').forEach((item) => {
        const arr = item.split('=');
        query[arr[0]] = arr[1];
    });
    return query;
}

const name = 'approval-message';

export default {
    name,
    props: ['message'],
    mixins: [getLocaleMixins(name)],
    computed: {
        user() {
            return this.message.user;
        },
        content() {
            const content = this.message.content;
            content.id = content.userId;
            content.avatar = content.imageUri;
            return content;
        },
        statusText() {
            return this.locale[this.getStatus(this.content.status)];
        },
    },
    created() {
        const content = this.message.content;
        // 是否审批者
        const isApprover = content.userId !== this.$im().auth.id;
        if (content.status === approveState.PENDING && isApprover) {
            this.message.content.status = approveState.REMIND;
        }
    },
    methods: {
        getUsername(...args) {
            return this.RongIM.common.getUsername(...args);
        },
        userProfile,
        dateFormat(timestamp, format) {
            return moment(timestamp).format(format);
        },
        getStatus(status) {
            return ApproveState[status].toLowerCase();
        },
        openUrl() {
            const url = this.message.content.extra;
            const queryStr = url.substr(url.indexOf('?'));
            const query = getQuery(queryStr);
            // 发起人Id
            const userId = this.message.content.userId;
            const approveId = query.approveId;
            if (approveId) {
                approvalDetail({
                    id: approveId,
                    userId,
                });
            }
        },
    },
};
