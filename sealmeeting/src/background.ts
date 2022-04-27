'use strict'
import path from 'path'
import { app, protocol, BrowserWindow, Menu, globalShortcut } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import { logger } from '@/core/ipc/logger/logger.main'
import { windowMain } from '@/core/ipc/window/window.main'
// import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'
const isDevelopment = process.env.NODE_ENV !== 'production'
app.commandLine.appendSwitch('ignore-certificate-errors')

const args = []
if (!app.isPackaged) {
  args.push(path.resolve(process.argv[1]))
}
args.push('--')
const PROTOCOL = 'sealmeeting'

// if (!app.isDefaultProtocolClient('ultrameeting')) {
//   // Define custom protocol handler. Deep linking works on packaged versions of the application!
//   app.setAsDefaultProtocolClient('ultrameeting')
// }
app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, args)
Menu.setApplicationMenu(null)

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) windowMain.MainWindow()
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  // 打开devtools
  logger.info('app ready')
  // app.commandLine.appendSwitch('ignore-certificate-errors');
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    // try {
    //   await installExtension(VUEJS_DEVTOOLS)
    // } catch (e) {
    //   console.error('Vue Devtools failed to install:', e.toString())
    // }
  }
  // createWindow()
  windowMain.MainWindow()
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}
