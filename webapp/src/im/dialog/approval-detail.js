/* eslint-disable no-param-reassign */
import avatar from '../components/avatar.vue';
import isEmpty from '../utils/isEmpty';

function getFullUrl(path) {
    return `//rce-df.rongcloud.net/erp/approval${path}`;
}

function ajax(options, auth) {
    options.url = getFullUrl(options.url);
    options.headers = $.extend({
        code: auth.code,
        userId: auth.id,
    }, options.headers);
    if (typeof options.data === 'object') {
        options.data = `param=${JSON.stringify(options.data)}`;
    }
    return $.ajax(options);
}

const serverApi = {
    getDetail(id, isLeader, auth) {
        return ajax({
            url: `/request/getinfo.json?id=${id}`,
            headers: {
                isLeader,
            },
        }, auth);
    },
    agree(parmas, auth) {
        return ajax({
            url: '/add.json',
            method: 'post',
            headers: {
                isLeader: parmas.isLeader,
            },
            data: {
                id: parmas.id,
                status: 2,
            },
        }, auth);
    },
    reject(parmas, auth) {
        return ajax({
            url: '/add.json',
            method: 'post',
            headers: {
                isLeader: parmas.isLeader,
            },
            data: {
                id: parmas.id,
                status: 3,
            },
        }, auth);
    },
};

function getDetail(context) {
    const isLeader = context.isLeader;
    const id = context.brief.id;
    serverApi.getDetail(id, isLeader, context.auth).done((rep) => {
        if (rep.code !== 200) {
            return;
        }
        context.approval = rep;
        context.approval.proposer = {
            avatar: rep.portrait_rl,
            name: rep.user_name,
            id: rep.user_id,
        };
        context.approval.approver = {
            avatar: rep.supervisor_portrait_url,
            name: rep.supervisor_name,
            id: rep.approver_id,
        };
    });
}

export default function (brief) {
    const options = {
        template: 'templates/approval-detail.html',
        data() {
            return {
                show: true,
                brief,
                approval: {
                    proposer: {},
                    approver: {},
                },
            };
        },
        components: {
            avatar,
        },
        computed: {
            auth() {
                return this.$im().auth;
            },
            selfId() {
                return this.auth.id;
            },
            isLeader() {
                // 是否自己发起的 1 是 0 否
                return this.brief.userId === this.selfId ? 1 : 0;
            },
            showControl() {
                const isApprover = this.approval.approverId === this.selfId;
                const isWaitapprove = this.approval.status === 1;
                return isApprover && isWaitapprove;
            },
        },
        mounted() {
            getDetail(this);
            $(document).on('click', this.close);
        },
        methods: {
            close() {
                this.show = false;
                $(document).off('click', this.close);
            },
            getTimeString: function getTimeString(time) {
                return moment(time).format('YYYY/M/D H:m');
            },
            getShowName(user) {
                if (isEmpty(user)) {
                    return '';
                }
                return user.id === this.selfId ? '我' : user.name;
            },
            agree() {
                const context = this;
                const id = this.approval.id;
                const params = {
                    id,
                    isLeader: this.isLeader,
                };
                serverApi.agree(params, this.auth).done((rep) => {
                    if (rep.code !== 200) {
                        return;
                    }
                    context.approval.status = 2;
                });
            },
            reject() {
                const context = this;
                const id = this.approval.id;
                const params = {
                    id,
                    isLeader: this.isLeader,
                };
                serverApi.reject(params, this.auth).done((rep) => {
                    if (rep.code !== 200) {
                        return;
                    }
                    context.approval.status = 3;
                });
            },
        },
    };
    window.RongIM.common.mountDialog(options);
}
