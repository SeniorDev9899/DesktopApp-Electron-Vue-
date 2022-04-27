# UOS 系统应用打包说明

> 出 UOS 系统标准 deb 包需要使用一台 arm64/amd64 架构 Ubuntu/Debian 系统设备（UOS 系统未测试）
> 在指定设备中使用 `apt-get install dh-make` 安装 dh-make 工具包

1. 按需替换 `assets/uos-app-template/entries/icons/hicolor` 目录下的图标资源文件
2. 正常构建 linux 包 `npm run pack`，确保在 `dist` 目录下生成 **.AppImage** 文件
3. 执行脚本：`node scripts/trans4uos.js`

安装包构建完成将存储于 `dist/uos/*.deb`
