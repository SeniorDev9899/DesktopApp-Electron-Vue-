import collectList from '../components/collect/collect-list.vue';
import collect from '../components/collect/collect.vue';

export default [
    {
        path: '/collect',
        name: 'collect',
        components: {
            list: collect,
        },
    },
    {
        path: '/collect/:id',
        name: 'collect-all',
        components: {
            list: collect,
            main: collectList,
        },
    },
];
