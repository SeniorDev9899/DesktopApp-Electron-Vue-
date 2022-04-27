import localeStore from '@/store/localeStore'
import { EnumErrorCode } from '@/types/Enums'

const locale = localeStore('errors')

const parseErrorCode = (code: EnumErrorCode) => {
  const msg = locale[code]
  return msg ? msg : 'parseErrorCode 失败：' + code
}

export default parseErrorCode
