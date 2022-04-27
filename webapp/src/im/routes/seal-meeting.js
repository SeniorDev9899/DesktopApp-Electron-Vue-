import home from '../components/seal-meeting/home.vue';
import now from '../components/seal-meeting/now.vue';
import schedule from '../components/seal-meeting/schedule.vue';
import detail from '../components/seal-meeting/detail.vue';

export default [
    {
        path: '/seal-meeting/home',
        name: 'seal-meeting',
        components: {
            onlyMain: home,
        },
    },
    {
        path: '/seal-meeting/now/:number?/:id?',
        name: 'seal-meeting-now',
        components: {
            onlyMain: now,
        },
    },
    {
        path: '/seal-meeting/schedule',
        name: 'seal-meeting-schedule',
        components: {
            onlyMain: schedule,
        },
    },
    {
        path: '/seal-meeting/detail/:id',
        name: 'seal-meeting-detail',
        components: {
            onlyMain: detail,
        },
    },
];
