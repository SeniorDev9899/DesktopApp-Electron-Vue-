import login from '../components/login.vue';
import signup from '../components/signup.vue';
import forgetPassword from '../components/forget-password/index.vue';
import getConversationList from '../components/conversation/conversation-list.vue';
import getConversation from '../components/conversation/conversation.vue';
import contactList from '../components/contact/list.vue';
import contactGroup from '../components/contact/group.vue';
import contactOrgs from '../components/contact/org.vue';
import contactApprove from '../components/contact/approve.vue';

import collect from './collect';
import friend from './friend';
import pin from './pin';
import sealMeeting from './seal-meeting';

import serverConf from '../components/server-conf/index.vue';


export default {
    linkActiveClass: 'rong-selected',
    maps: [
        ...collect,
        ...friend,
        ...pin,
        ...sealMeeting,
        {
            path: '/login/:selected?',
            name: 'login',
            component: login,
            meta: {
                pulicAccess: true,
            },
        },
        {
            path: '/signup',
            name: 'signup',
            component: signup,
            meta: {
                pulicAccess: true,
            },
        },
        {
            path: '/forget-password',
            name: 'forgetPassword',
            component: forgetPassword,
            meta: {
                pulicAccess: true,
            },
        },
        // 配置服务地址
        {
            path: '/server-conf',
            name: 'serverConf',
            component: serverConf,
            meta: {
                pulicAccess: true,
            },
        },
        {
            path: '/conversation/:conversationType([1-8]{1})?/:targetId?',
            name: 'conversation',
            components: {
                list: getConversationList,
                main: getConversation,
            },
        },
        {
            path: '/contact',
            name: 'contact',
            components: {
                list: contactList,
            },
        },
        {
            path: '/contact/group',
            name: 'group',
            components: {
                list: contactList,
                main: contactGroup,
            },
        },
        {
            path: '/contact/approve',
            name: 'approve',
            components: {
                list: contactList,
                main: contactApprove,
            },
        },
        {
            path: '/contact/org/:coId/:orgId?/:type?',
            name: 'organization',
            components: {
                list: contactList,
                main: contactOrgs,
            },
        },
        {
            path: '/contact/mydept/:coId/:orgId?/:type?',
            name: 'mydept',
            components: {
                list: contactList,
                main: contactOrgs,
            },
        },
        {
            path: '*',
            redirect: '/conversation',
        },
    ],
};
