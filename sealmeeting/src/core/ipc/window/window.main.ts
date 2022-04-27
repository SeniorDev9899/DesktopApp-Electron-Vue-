import { BrowserWindow, ipcMain, globalShortcut } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import { EnumWindowAction } from '@/modules/eventEmitt'

class WindowMain {
  private mainWindow: BrowserWindow | undefined = undefined
  constructor() {
    this.startListen()
  }

  /**
   * 创建窗体
   */
  public async MainWindow() {
    if (this.mainWindow) {
      return
    }
    // Create the browser window.
    this.mainWindow = new BrowserWindow({
      width: 1024,
      height: 720,
      webPreferences: {
        webSecurity: false,
        nodeIntegration: true,
        enableRemoteModule: true
      }
    })
    globalShortcut.register('CommandOrControl+Shift+i', () => {
      this.mainWindow!.webContents.openDevTools()
    })
    if (process.env.WEBPACK_DEV_SERVER_URL) {
      // Load the url of the dev server if in development mode
      await this.mainWindow.loadURL(
        process.env.WEBPACK_DEV_SERVER_URL as string
      )
      if (!process.env.IS_TEST) this.mainWindow.webContents.openDevTools()
    } else {
      createProtocol('app')
      // Load the index.html when not in development
      this.mainWindow.loadURL('app://./index.html/#/')
    }
  }

  /**
   * 监听渲染进程请求
   */
  private startListen() {
    ipcMain.on('window-action', (event, action) => {
      console.log('window-action', action)
      switch (action) {
        case EnumWindowAction.Hide:
          this.mainWindow!.hide()
          break
        case EnumWindowAction.Close: // 关闭
          this.mainWindow!.hide()
          this.mainWindow!.close()
          break
        case EnumWindowAction.SetMin: // 最小化
          this.mainWindow!.minimize()
          break
        case EnumWindowAction.SetMax: // 最大化
          this.mainWindow!.maximize()
          break
        case EnumWindowAction.CancelMax: // 还原
          this.mainWindow!.unmaximize()
          break
        default:
          break
      }
    })
  }
}

const windowMain = new WindowMain()
export { windowMain }
