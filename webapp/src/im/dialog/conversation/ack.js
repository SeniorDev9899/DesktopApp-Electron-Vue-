/* eslint-disable no-param-reassign */
import config from '../../config';
import avatar from '../../components/avatar.vue';
import userProfile from '../contact/user';

const pageNum = config.ack.pageNum;

/*
说明：群组消息已读回执确认详情弹框
参数：
    @param {array<object>}    memberList    成员信息
    @param {array<string>}    readIdList    已读成员Id
    @param {string}           messageId     消息Id （用于监听消息已读成员变化）
    @param {string}           groupId       群组Id （用于获取成员的群昵称）
*/
export default function (memberList, readIdList, messageId, groupId) {
    const options = {
        name: 'ack',
        template: 'templates/conversation/ack.html',
        data() {
            return {
                show: true,
                memberList: [],
                readIdList: [],
                tab: 'unread',
                style: '',
                pageNum,
                currentPage: 1,
            };
        },
        components: {
            avatar,
        },
        computed: {
            allReadMember() {
                const context = this;
                return context.memberList.filter(item => context.readIdList.indexOf(item.id) !== -1);
            },
            readMember() {
                const context = this;
                const arr = context.memberList.filter(item => context.readIdList.indexOf(item.id) !== -1);
                const end = context.currentPage * context.pageNum;
                return arr.slice(0, end);
            },
            allUnreadMember() {
                const context = this;
                return context.memberList.filter(item => context.readIdList.indexOf(item.id) === -1);
            },
            unreadMember() {
                const context = this;
                const arr = context.memberList.filter(item => context.readIdList.indexOf(item.id) === -1);
                const end = context.currentPage * context.pageNum;
                return arr.slice(0, end);
            },
        },
        watch: {
            tab() {
                this.currentPage = 1;
                $(this.$refs.readList).scrollTop(0);
                $(this.$refs.unreadList).scrollTop(0);
            },
        },
        mounted() {
            const context = this;
            const im = this.$im();
            context.memberList = memberList;
            context.readIdList = readIdList;
            // 监听消息的已读人数变化及时更新
            context.watchUnRead = function watchUnRead(data) {
                context.memberList = data.memberList.filter(item => item.id !== im.auth.id);
                context.readIdList = data.readIdList.filter(item => item !== im.auth.id);
            };
            im.$on(`messageUnRead${messageId}`, context.watchUnRead);
            // 页面跳转时 1.关闭弹出框 2.清除监听
            const unwatch = im.$watch('$route', () => {
                context.close();
                unwatch();
            });
        },
        destroyed() {
            this.$im().$off(`messageUnRead${messageId}`, this.watchUnRead);
        },
        methods: {
            close() {
                this.show = false;
            },
            getUsername(item) {
                return this.RongIM.common.getGroupUsername(item || {}, groupId);
            },
            showUserInfo(user) {
                userProfile(user.id);
            },
            loadMoreRead() {
                loadMore(this, 'read');
            },
            loadMoreUnread() {
                loadMore(this, 'unread');
            },
        },
    };

    window.RongIM.common.mountDialog(options);
}

function loadMore(context, isRead) {
    const end = context.currentPage * context.pageNum;
    let list;
    if (isRead === 'read') {
        list = context.allReadMember;
    } else {
        list = context.allUnreadMember;
    }
    if (list && list.length > end) {
        context.currentPage += 1;
    }
}
