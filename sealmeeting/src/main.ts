import { createApp } from 'vue'
import App from './App.vue'
import ElementPlus from 'element-plus';
import locale from 'element-plus/lib/locale/lang/zh-cn'
import 'element-plus/lib/theme-chalk/index.css';
import '@/assets/layout/layout.scss';
import router from '@/views/router'
import { i18n } from '@/store/localeStore'

createApp(App).use(router).use(i18n).use(ElementPlus, { locale }).mount('#app')