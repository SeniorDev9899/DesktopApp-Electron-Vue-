// 将 dist/linux-arm64-unpacked 文件包打包为 uos 系统 deb 包

const path = require('path');
const fs = require('fs');
const os = require('os');
const { runShell, root } = require('./tools.js');
const parseConfig = require('./tools/parseconf');

const appConfig = parseConfig('src/app.conf');

const log = (...args) => {
    process.stdout.write(`${args.map(item => (item ? item.toString() : item)).join(' ')}\n`);
};

const arch = (() => ({ x64: 'amd64', arm64: 'arm64', mips64el: 'mips64el' }[os.arch()]))();

const {
    version,
    // versioncode,
    appid,
    appname,
    productname,
    description,
    author,
    home,
    // copyright,
} = appConfig;

(async () => {
    log('清理前次构建...');
    await runShell('rm -rf dist/uos', root);

    // const res = `${appname}-${version}${arch === 'amd64' ? '' : `-${arch}`}.AppImage`;
    const res = `linux${arch === 'amd64' ? '' : `-${arch}`}-unpacked`;

    const appbin = path.join(`dist/${res}`, `${appname}`.toLowerCase());
    await runShell(`chmod +x ${appbin}`);
    log('change mode ', appbin);

    await runShell(`touch dist/${res}/libappindicator3.so`);
    await runShell(`touch dist/${res}/libappindicator3.so.1`);

    const uosAppRoot = path.join(root, `dist/uos/${appid}-${version}/${appid}`);
    log('uosAppRoot =', uosAppRoot);

    log('拷贝 templates 模板资源...');
    await runShell(`mkdir -p ${uosAppRoot}`);
    await runShell(`cp -R assets/uos-app-template/** ${uosAppRoot}/`, root);
    await runShell(`rm -rf ${uosAppRoot}/README.md`, root);

    // 拷贝应用资源文件
    log(`拷贝应用资源 ${res} ...`);
    await runShell(`rm -rf ${uosAppRoot}/files`, root);
    await runShell(`cp -R dist/${res} ${uosAppRoot}/files`, root);

    // 修改info 文件
    log('修改 info 文件...');
    const infoPath = path.join(uosAppRoot, 'info');
    log('info: ', infoPath);
    const info = JSON.parse(fs.readFileSync(infoPath).toString());
    info.appid = appid;
    info.name = productname;
    info.version = version;
    fs.writeFileSync(infoPath, `${JSON.stringify(info, null, '  ')}\n`);

    // 生成 desktop 文件
    log('生成 .desktop 文件...');
    const desktopPath = path.join(uosAppRoot, 'entries/applications/app.desktop');
    const targetDesktop = path.join(uosAppRoot, `entries/applications/${appid}.desktop`);
    log('.desktop: ', targetDesktop);
    let desktopInfo = fs.readFileSync(desktopPath).toString();
    desktopInfo = desktopInfo
        .replace(/Name=[^\n]+/, `Name=${productname}`)
        .replace(/Comment=[^\n]+/, `Comment=${description}`)
        .replace(/Exec=[^\n]+/, `Exec=/opt/apps/${appid}/files/${appname.toLowerCase()}`)
        .replace(/Icon=[^\n]+/, `Icon=/opt/apps/${appid}/files/resources/app/res/app.png`);
    fs.writeFileSync(targetDesktop, desktopInfo);
    await runShell(`rm -rf ${desktopPath}`);

    // 重命名 icon 图标文件
    log('重命名 icons 图标文件...');
    await Promise.all([16, 24, 32, 48, 128, 256, 512].map(async (size) => {
        const targetDir = path.join(uosAppRoot, `entries/icons/hicolor/${size}x${size}/apps`);
        await runShell(`mv app.png ${appname}.png`, targetDir);
    }));

    // 生成 debian 包目录
    log('创建 debian 目录...');
    const debianContainer = path.join(uosAppRoot, '..');
    await runShell('dh_make --createorig -s -y', debianContainer);

    // 删除无效的模板文件
    log('清理 debian 目录下的无效模板...');
    await runShell('rm -rf debian/*.ex debian/*.EX', debianContainer);

    // 修改 control 文件
    log('修改 debian/control ...');
    const controlPath = path.join(debianContainer, 'debian/control');
    log('control path:', controlPath);
    let control = fs.readFileSync(controlPath).toString();
    control = control
        .replace(/Maintainer:[^\n]+/, `Maintainer: ${author}`)
        .replace(/Section:[^\n]+/, 'Section: Network')
        .replace(/Homepage:[^\n]+/, `Homepage: ${home}`)
        .replace(/Architecture:[^\n]+/, `Architecture: ${arch}`)
        .replace(/Priority:[^\n]+/, 'Priority: standard')
        .replace(/Description:.+$/, `Description: ${description}\n`);
    fs.writeFileSync(controlPath, control);

    // 生成 install 文件，定义 deb 包安装目录
    log('生成 debian/install ...');
    const installFilePath = path.join(debianContainer, 'debian/install');
    log('install path:', installFilePath);
    fs.writeFileSync(installFilePath, `${appid}/ /opt/apps`);

    // 覆盖 rules 文件
    log('覆盖 debian/rules ...');
    const rulesPath = path.join(debianContainer, 'debian/rules');
    log('rules path:', rulesPath);
    await runShell(`cp -R assets/debian/rules ${rulesPath}`, root);

    // 覆盖 changelog 文件
    // log('覆盖 debian/changelog ...');
    // const changelogPath = path.join(debianContainer, 'debian/changelog');
    // log('changelog path:', changelogPath);
    // await runShell(`cp -R assets/debian/changelog ${changelogPath}`, root);

    // 打包 deb
    log('创建 .deb 包文件...');
    // 需要提前 commit 相关修改
    log('dpkg-source --commit');
    await runShell(`EDITOR=/bin/true dpkg-source --commit . ${version}`, debianContainer);
    log('dpkg-source --include-binaries -b .');
    await runShell('dpkg-source --include-binaries -b .', debianContainer);
    log('dpkg-buildpackage -us -uc -nc -j4');
    await runShell('dpkg-buildpackage -us -uc -nc -j4', debianContainer);

    // 修改 doc、changelog、copyright 等文件的安装目录
    log('修改 deb 包内 /usr/share 内容...');
    const uosPath = path.join(debianContainer, '..');
    log('usoPath =', uosPath);
    let command = `fakeroot dpkg-deb -R ${appid}_${version}-1_${arch}.deb a`;
    log(command);
    await runShell(command, uosPath);
    command = `mv a/usr/share/doc a/opt/apps/${appid}/files`;
    log(command);
    await runShell(command, uosPath);
    command = 'rm -rf a/usr';
    log(command);
    await runShell(command, uosPath);
    command = 'touch a/DEBIAN/postinst';
    await runShell(command, uosPath);
    command = 'touch a/DEBIAN/postrm';
    await runShell(command, uosPath);
    command = 'cat ../../assets/postinst_template >> a/DEBIAN/postinst';
    await runShell(command, uosPath);
    command = 'cat ../../assets/postrm_template >> a/DEBIAN/postrm';
    await runShell(command, uosPath);
    command = `sed -i 's/appid/${appid}/g' a/DEBIAN/postinst`;
    await runShell(command, uosPath);
    command = `sed -i 's/appid/${appid}/g' a/DEBIAN/postrm`;
    await runShell(command, uosPath);
    command = 'chmod 0755 a/DEBIAN/postinst';
    await runShell(command, uosPath);
    command = 'chmod 0755 a/DEBIAN/postrm';
    await runShell(command, uosPath);
    command = `fakeroot dpkg-deb -b a ${appid}_${version}-1_${arch}.deb`;
    log(command);
    await runShell(command, uosPath);
    await runShell('sh scripts/build4kylin.sh');
})();
