#!/bin/bash
#获取 APPID
echo 'get appid'
appid=`cat src/app.conf | grep "appid=" | awk '{print $2}'`

if [ ! -n "$appid" ]; then
    appid=`cat src/app.conf | grep "appid =" | awk '{print $2}'`
fi

#删除上次构建
echo 'remove last build'
rm -rf dist/kylinV10
#建立构建目录
echo 'create building dir'
mkdir dist/kylinV10
cd dist/kylinV10
#复制编译后的文件
echo 'copy files...'
cp -a ../uos/a $appid
#建立快捷方式目录
echo 'create link dir'
mkdir -p $appid/usr/share/applications
#复制快捷方式文件到对应目录
echo 'copy link files...'
cp $appid/opt/apps/$appid/entries/applications/$appid.desktop $appid/usr/share/applications
#开始打包
echo 'start packaging....'
dpkg-deb -b $appid $appid"_kylin.deb"
