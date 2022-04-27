/* eslint-disable no-param-reassign */
import _ from 'lodash';
import getLocaleMixins from '../../utils/getLocaleMixins';
import meetingSetting from '../../dialog/seal-meeting/setting';
import throttle from '../../utils/throttle';

let context = this;
let meetingApi;
let meetings = [];
let meetingInfos = [];
export default {
    name: 'meetingHome',
    data() {
        return {
            meetingInfos: [],
            totalPage: 0,
            pageIndex: 0,
            pageSize: 10,
        };
    },
    components: {

    },
    mixins: [getLocaleMixins('meetingHome')],
    mounted() {
        context = this;
        meetingApi = context.$im().dataModel.Meeting;
        meetings = [];
        this.getHistoryPage();
    },
    methods: {
        nowMeeting() {
            this.$router.push({
                name: 'seal-meeting-now',
            });
        },
        scheduleMeeting() {
            this.$router.push({ name: 'seal-meeting-schedule' });
        },
        meetingDetail(id) {
            this.$router.push({
                name: 'seal-meeting-detail',
                params: {
                    id,
                },
            });
        },
        deleteMeeting(id, index1, index2) {
            this.RongIM.common.messagebox(({
                message: context.locale.deleteTip,
                type: 'confirm',
                callback,
            }));
            function callback() {
                meetingApi.delete(id).then(() => {
                    meetingInfos[index1].splice(index2, 1);
                    if (meetingInfos[index1].length === 0) {
                        meetingInfos.splice(index1, 1);
                    }
                    Vue.set(context, 'meetingInfos', meetingInfos);
                });
            }
        },
        getHistoryPage() {
            meetingApi.history(this.pageIndex * this.pageSize, this.pageSize).then((result) => {
                context.totalPage = Math.ceil(result.totalCount / this.pageSize);
                meetingInfos = getViewMeetings(result.data);
                Vue.set(this, 'meetingInfos', meetingInfos);
            });
        },
        scroll: throttle(() => {
            const $content = $(context.$refs.content);
            const isBottom = $content.scrollTop() + $content.height() >= $content[0].scrollHeight - 5;
            if (isBottom) {
                if (context.pageIndex === context.totalPage - 1) {
                    return;
                }
                context.pageIndex += 1;
                context.getHistoryPage();
            }
        }, 500),
        openMeetDetail(id) {
            this.$router.push(`/seal-meeting/detail/${id}`);
        },
        // 打开设置
        openSet() {
            meetingSetting();
        },
    },
};

function getViewMeetings(newItems) {
    meetings = meetings.concat(newItems);
    const obj = _.groupBy(meetings, (item) => {
        item.startDateInfo = getDateInfo(item.startDt, context.locale);
        item.startDateInfo.time = moment(item.startDt).format('HH:mm');
        item.endDateTime = moment(item.endDt).format('HH:mm');
        return moment(item.startDt).format('YYYY/MM/DD');
    });
    const arr = [];
    Object.keys(obj).forEach((key) => {
        arr.push(obj[key]);
    });
    return arr;
}


function getDateInfo(time, locale) {
    const startDate = new Date(time);
    const today = new Date().getDate();
    let dateAlias = '';
    if (today === startDate.getDate()) {
        dateAlias = locale.today;
    }
    // const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).getDate();
    return {
        year: startDate.getFullYear(),
        month: startDate.getMonth() + 1,
        date: startDate.getDate(),
        dateAlias,
    };
}
