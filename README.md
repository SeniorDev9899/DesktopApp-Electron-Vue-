# RCE 桌面端工程说明

### 开发环境搭建

1. 支持的平台

    * `Mac`: 支持 MacOS 10.9+
    * `Windows`: Windows 7 SP1 及以上版本（ARM 版本的 Windows 暂不支持）

2. 安装 Nodejs
    * 版本需求：**Nodejs 8.12.0** 及以上
    * Windows 必须安装 **32-bit** 版本，推荐使用 [nvm-windows](https://github.com/coreybutler/nvm-windows) 作为 Nodejs 的版本管理工具
    * Mac 平台下推荐使用 [nvm](https://github.com/nvm-sh/nvm) 作为 Nodejs 版本管理工具

3. 安装 **node-gyp**
    * `npm install -g node-gyp`

### 项目依赖与配置

1. 启动命令行工具，进入项目根目录

2. 安装项目依赖：`npm install`，依赖安装完成后会在 `src` 目录下生成 `app.conf` 和 `sign.conf` 文件
    * `app.conf`: 应用配置文件，用于配置应用的 `appid`、`appserver` 必要信息等
    * `sign.conf`: 打包时的签名配置，按需修改。打包 Windows 平台应用时可不填。

3. 修改 `app.conf` 文件，填写 `appid`、`appserver` 信息，其他信息按需修改

### webapp 模块引入

1. 若您获取到的源码存在 git 记录信息，则可通过 `git submodule` 命令同步 `webapp` 模块
2. 若源码中不存在 git 记录信息，请将您获取到的 `desktop-client` 工程拷贝到当前工程根目录下，并将 `desktop-client` 工程目录名修改为 `webapp`。

### 启动和调试

使用 `npm start [dev]` 脚本以启动应用，若启动时携带 dev 参数，将同时打开主窗口调试器。

首次启动时，会在 `webapp` 目录下安装其所需的依赖包，故可能耗时较长。

### 修改图标

图片文件存放于 `res` 目录

* `app.icns`:  Mac 打包图标
* `app.ico`: Windows 打包图标，安装包图标
* `Windows_icon.png`: Windows 托盘图标
* `app.png`: App 启动页面背景图标
* `Mac_Template.png`:   Mac 右上角图标
* `Mac_Template@2x.png`: 高分辨率图片
* `Mac_TemplateWhite.png`: Mac 右上角点击反白图标
* `Mac_TemplateWhite@2x.png`: 高分辨率图片

**注意**：Mac 图标图标用法请参考 [NativeImage](https://electronjs.org/docs/api/native-image)

### 应用打包

运行脚本 `npm run package` 对应用进行打包，脚本将自行识别当前打包设备并输出相应的文件到 `dist` 目录。

### 辅助文档

* [Electron](https://electronjs.org/docs)
* [ElectronBuilder](https://www.electron.build/)
* [Nodejs](http://nodejs.cn/)
