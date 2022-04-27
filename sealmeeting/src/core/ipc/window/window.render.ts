import { EnumWindowAction } from '@/modules/EventEmitt'
import { detectElectron } from '@/utils/systemUtil'

class WindowRender {
  private ipcRender: any | undefined
  constructor() {
    if (detectElectron()) {
      try {
        this.ipcRender = require('electron').ipcRender
      } catch (error) {
        console.log('获取ipcRender 错误，可能运行在 rce里面')
      }
    }
  }
  public Hide() {
    this.ipcRender?.send('window-action', EnumWindowAction.Hide)
  }
  public Close() {
    this.ipcRender?.send('window-action', EnumWindowAction.Close)
  }
  public SetMin() {
    this.ipcRender?.send('window-action', EnumWindowAction.SetMin)
  }
  public SetMax() {
    this.ipcRender?.send('window-action', EnumWindowAction.SetMax)
  }
  public CancelMax() {
    this.ipcRender?.send('window-action', EnumWindowAction.CancelMax)
  }
}
let windowRender = new WindowRender()
export { windowRender }
