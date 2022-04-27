import contactList from '../components/contact/list.vue';
import requestFriend from '../components/contact/request-friend.vue';
import friends from '../components/contact/friends.vue';
import star from '../components/contact/star.vue';

export default[
    {
        path: '/contact/friends',
        name: 'friend',
        components: {
            list: contactList,
            main: friends,
        },
    },
    {
        path: '/contact/request-friend',
        name: 'request',
        components: {
            list: contactList,
            main: requestFriend,
        },
    },
    {
        path: '/contact/star',
        name: 'star',
        components: {
            list: contactList,
            main: star,
        },
    },
];
