# 使用说明

## 安装依赖

```
npm install
```

## 作为 Electron 工程的渲染进程资源

将该工程拷贝到 `desktop-builder` 工程根目录下，并经该工程文件夹重命名为 `webapp`

## 单独调试发布 web 端

1. 修改 `scripts/build.conf` 文件，填写 `appserver` 地址
2. 调试：`npm run dev`
3. 发布：`npm run build`

