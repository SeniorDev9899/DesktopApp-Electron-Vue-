import { createRouter, createWebHashHistory, LocationQuery } from 'vue-router'
import HomeRouter from './home-router/index.vue'
import Login from './login/index.vue'
import Home from './home-router/home/index.vue'
import JoinMeeting from './home-router/join-meeting/index.vue'
import MeetingView from './meeting/index.vue'
import ProfileSetting from './profile-setting/index.vue'
import MeetingIngDetial from './home-router/meeting-detail/index.vue'
import ScheduleMeeting from './home-router/meeting-schedule/index.vue'
import Agreement from './agreement/index.vue'
import ShareView from './share/index.vue'
import { isLogin } from '@/session'
import { appConfig } from '@/appConfig'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'login',
      component: Login
    },
    {
      path: '/agreement',
      name: 'agreement',
      component: Agreement
    },
    {
      path: '/share',
      name: 'share',
      component: ShareView
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfileSetting
    },
    {
      name: 'home',
      path: '/home',
      component: HomeRouter,
      redirect: '/home/',
      children: [
        { name: 'meeting-home', path: '', component: Home },
        { name: 'meeting-join', path: 'join', component: JoinMeeting },
        {
          name: 'meeting-schedule',
          path: 'schedule',
          component: ScheduleMeeting
        },
        {
          name: 'meeting-detail',
          path: 'detail/:id',
          component: MeetingIngDetial
        }
      ]
    },
    {
      path: '/meeting',
      name: 'meeting',
      component: MeetingView
    }
  ]
})

router.beforeEach((to, from, next) => {
  document.title = appConfig.productName
  next()
})

// let meetingQ: LocationQuery | undefined = undefined
// router.beforeEach((to, from, next) => {
//   if (to.name !== 'login') {
//     if (!isLogin.value) {
//       if (to.name === 'meeting') {
//         meetingQ = to.query
//       }
//       next('/')
//       return
//     }
//   }
//   if (from.name === 'login' && to.name !== 'meeting') {
//     if (meetingQ) {
//       next({ path: '/meeting', query: meetingQ })
//       meetingQ = undefined
//       return
//     }
//   }
//   next()
// })

export default router
