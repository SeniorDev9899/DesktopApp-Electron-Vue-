const jenkinsConfig = require('./src/jenkinsConfig')
const FileManagerPlugin = require('filemanager-webpack-plugin')

module.exports = {
  publicPath: './',
  assetsDir: 'static',
  configureWebpack: {
    plugins: [
      new FileManagerPlugin({
        events: {
          onStart: {
            copy: [
              {
                source: 'build/assets/logo.svg',
                destination: 'src/assets/images/'
              }
            ]
          },
          onEnd: {}
        }
      })
    ]
  },
  pluginOptions: {
    electronBuilder: {
      nodeIntegration: true,
      // List native deps here if they don't work
      // externals: ['my-native-dep'],
      // If you are using Yarn Workspaces, you may have multiple node_modules folders
      // List them all here so that VCP Electron Builder can find them
      nodeModulesPath: ['./node_modules'],
      builderOptions: {
        appId: jenkinsConfig.appId,
        productName: jenkinsConfig.productName, //项目名，也是生成的安装文件名，即aDemo.exe
        copyright: jenkinsConfig.copyright, //版权信息
        directories: {
          output: './dist_electron' //输出文件路径
        },
        win: getWinConf(),
        nsis: {
          oneClick: false,
          guid: '876543hgfd',
          allowToChangeInstallationDirectory: true,
          deleteAppDataOnUninstall: true, // 仅可用于一键安装
          include: 'build/assets/win/installer.nsh',
          installerLanguages: ['zh_CN', 'en_US'],
          license: 'build/assets/win/LICENSE'
        },
        mac: getMacConf(),
        dmg: {
          sign: false,
          contents: [
            {
              x: 410,
              y: 150,
              type: 'link',
              path: '/Applications'
            },
            {
              x: 130,
              y: 150,
              type: 'file'
            }
          ]
        },
        protocols: {
          // macOS only; win use app.setAsDefaultProtocolClient
          name: jenkinsConfig.protocol,
          schemes: [jenkinsConfig.protocol]
        },
        afterSign,
        afterPack
      }
    }
  }
}

async function afterSign() {
  if (process.platform !== 'darwin') return
  const { notarize } = require('electron-notarize')
  try {
    await notarize({
      appBundleId: jenkinsConfig.appId,
      appPath: `dist_electron/mac/${jenkinsConfig.appName}.app`,
      appleId: jenkinsConfig.appleDevId,
      appleIdPassword: jenkinsConfig.appleDevPwd
    })
  } catch (error) {
    console.error(error)
  }
  console.log(`Done notarizing ${jenkinsConfig.appName}`)
}

function afterPack() {
  // 恢复 package.json
  // writeFileSync('package.json', `${JSON.stringify(packageCopy, null, 2)}\n`);
  // const packageJSON = require('./package.json');
  // // 留备份，以便打包完成后恢复 package.json
  // const packageCopy = { ...packageJSON };
  // /**
  //  * appname 使用的 package.json 中的 name
  //  * 应用版本号使用 package.json 中的 version
  //  */
  // packageJSON.name = appname;
  // packageJSON.version = version;
  // packageJSON.homepage = home;
  // packageJSON.description = description;
  // packageJSON.author = author;
  // writeFileSync('package.json', JSON.stringify(packageJSON, null, 2));
}

function getWinConf() {
  const win = {
    icon: 'build/assets/win/app.ico'
  }
  // !!jenkinsConfig.winCerFile && (win.certificateFile = jenkinsConfig.winCerFile)
  // !!jenkinsConfig.winCerPwd && (win.certificatePassword = jenkinsConfig.winCerPwd)
  return win
}

function getMacConf() {
  const mac = {
    icon: 'build/assets/mac/app.icns',
    category: 'public.app-category.instant-messageing',
    hardenedRuntime: true,
    gatekeeperAssess: false,
    entitlements: 'build/assets/mac/entitlements.mac.plist',
    entitlementsInherit: 'build/assets/mac/entitlements.mac.plist'
  }
  !!jenkinsConfig.macIdentity && (mac.identity = jenkinsConfig.macIdentity)
  return mac
}
