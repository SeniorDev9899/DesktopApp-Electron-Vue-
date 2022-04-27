import nav from '../components/pin/nav.vue';
import sent from '../components/pin/sent.vue';
import received from '../components/pin/received.vue';

export default [
    {
        path: '/pin',
        name: 'pin-nav',
        redirect: '/pin/received',
    },
    {
        path: '/pin/received',
        name: 'pin-received',
        components: {
            list: nav,
            main: received,
        },
    },
    {
        path: '/pin/sent',
        name: 'pin-sent',
        components: {
            list: nav,
            main: sent,
        },
    },
];
