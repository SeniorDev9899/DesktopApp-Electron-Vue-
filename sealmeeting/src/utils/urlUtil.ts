export const urlUtil = {
  replaceOrigin: (srcUrl: string, tarUrl: string) => {
    if (!srcUrl) {
      return ''
    }
    if (!tarUrl) {
      return srcUrl
    }
    if (srcUrl.startsWith('http')) {
      const srcU = new URL(srcUrl)
      const tarU = new URL(tarUrl)
      return srcUrl.replace(srcU.origin, tarU.origin)
      // return srcUrl.replace(srcU.host, tarU.host).replace(srcU.protocol, tarU.protocol)
    } else if (srcUrl.startsWith('/') && tarUrl.endsWith('/')) {
      return tarUrl + srcUrl.substr(1)
    } else if (srcUrl.startsWith('/') || tarUrl.endsWith('/')) {
      return tarUrl + srcUrl
    } else {
      return tarUrl + '/' + srcUrl
    }
  }
}
