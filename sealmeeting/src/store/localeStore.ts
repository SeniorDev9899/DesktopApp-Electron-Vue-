import zh from '@/locale/zh-CN'
import en from '@/locale/en-US'
import { createI18n } from 'vue-i18n'
import { reactive } from 'vue'

const i18nConfig = {
  locale: 'zh',
  legacy: false,
  messages: { zh, en },
}

export const i18n = createI18n(i18nConfig)

export const changeLang = (lang: string) => {
  i18nConfig.locale = lang
}

export default (key: string): any => {
  return reactive(i18n.global.tm(key))
}