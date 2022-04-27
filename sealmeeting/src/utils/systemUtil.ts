import { EnumPlatform } from '@/types/Enums'

export const detectPlatform = (): EnumPlatform => {
  switch (process.platform) {
    case 'darwin':
      return EnumPlatform.Mac
    case 'win32':
      return EnumPlatform.Windows
    default:
      return EnumPlatform.Web
  }
}

export const detectElectron = (): boolean => {
  // Renderer process
  if (
    typeof window !== 'undefined' &&
    typeof window.process === 'object' &&
    window.process.type === 'renderer'
  ) {
    return true
  }

  // Main process
  if (
    typeof process !== 'undefined' &&
    typeof process.versions === 'object' &&
    !!process.versions.electron
  ) {
    return true
  }

  // Detect the user agent when the `nodeIntegration` option is set to true
  if (
    typeof navigator === 'object' &&
    typeof navigator.userAgent === 'string' &&
    navigator.userAgent.indexOf('Electron') >= 0
  ) {
    return true
  }

  return false
}

export const stringFormat = (str: string, params: string[]) => {
  for (var s = str, i = 0; i < params.length; i++) {
    s = s.replace(new RegExp('\\{' + i + '\\}', 'g'), params[i])
  }
  return s
}
