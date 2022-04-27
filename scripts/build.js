/* eslint-disable no-template-curly-in-string,dot-notation */
const { writeFileSync, existsSync } = require('fs');
const { notarize } = require('electron-notarize');
const { arch, platform } = require('os');
const builder = require('electron-builder');

const parseConfig = require('./tools/parseconf');

const appConfig = parseConfig('src/app.conf');
const signConfig = parseConfig('src/sign.conf');
const Config = require('../src/config');


const {
    version,
    // versioncode,
    appid: appId,
    appname,
    protocol,
    productname: productName,
    description,
    author,
    home,
    copyright,
    appissid: guid = undefined,
} = appConfig;

/**
 * 签名证书相关配置
 * 也可使用环境变量设置相关属性 https://www.electron.build/code-signing
 */
const {
    identity,
    notarize: notarizeStr,
    developerid,
    developerpassword,
    certificatepassword: certificatePassword,
} = signConfig;

let screenshotPath;
const useNotarize = notarizeStr === 'true';
// 检测苹果应用公证参数
if (useNotarize && (!developerid || !developerpassword)) {
    process.stderr.write(
        '缺少 developerid 和 developerpassword，无法进行应用公证！\n',
    );
    process.exit();
}

let { certificatefile: certificateFile } = signConfig;

const requireSign = existsSync(certificateFile);
certificateFile = requireSign ? certificateFile : null;

const packageJSON = require('../package.json');

// 留备份，以便打包完成后恢复 package.json
const packageCopy = { ...packageJSON };

/**
 * appname 使用的 package.json 中的 name
 * 应用版本号使用 package.json 中的 version
 */
packageJSON.name = appname;
packageJSON.version = version;
packageJSON.homepage = home;
packageJSON.description = description;
packageJSON.author = author;
writeFileSync('package.json', JSON.stringify(packageJSON, null, 2));


builder.build({
    config: {
        appId,
        productName,
        copyright,
        asar: false,
        files: [
            'res',
            'src',
            '!src/sign.conf',
            '!src/**/electron-v*',
            ...getNodeFilePaths(),
            'sealmeeting/dist',
            'webapp/dist',
            'src/modules/screenshot/*.js',
            'src/modules/screenshot/${platform}/**',
        ],
        win: {
            certificateFile,
            certificatePassword,
            icon: 'res/app.ico',
        },
        nsis: {
            oneClick: false,
            guid,
            allowToChangeInstallationDirectory: true,
            deleteAppDataOnUninstall: true, // 仅可用于一键安装
            installerLanguages: ['zh_CN', 'en_US'],
            license: 'assets/LICENSE',
        },
        mac: {
            identity: identity ? identity.replace('Developer ID Application: ', '') : null,
            hardenedRuntime: useNotarize,
            gatekeeperAssess: !useNotarize,
            entitlements: useNotarize ? 'scripts/entitlements.mac.plist' : '',
            entitlementsInherit: useNotarize ? 'scripts/entitlements.mac.plist' : '',
            icon: 'res/app.icns',
            category: 'public.app-category.instant-messaging',
        },
        dmg: {
            sign: !useNotarize,
        },
        linux: {
            category: 'InstantMessaging;Network',
            target: [
                // {
                //     target: 'AppImage',
                //     arch: ['x64', 'arm64'],
                // },
                // {
                //     target: 'deb',
                //     arch: ['x64'],
                // },
                // {
                //     target: 'rpm',
                //     arch: ['x64', 'arm64'],
                // },
                {
                    target: 'tar.gz',
                    arch: ['x64'],
                },
            ],
            extraFiles: [
                {
                    from: 'platforms/libqxcb.so',
                    to: 'platforms/libqxcb.so',
                },
                {
                    from: 'platforms/libQt5Core.so.5.12.9',
                    to: 'libQt5Core.so.5',
                },
                {
                    from: 'platforms/libQt5Gui.so.5.12.9',
                    to: 'libQt5Gui.so.5',
                },
                {
                    from: 'platforms/libQt5Widgets.so.5.12.9',
                    to: 'libQt5Widgets.so.5',
                },
                {
                    from: 'platforms/libcrypto.so.1.0.0',
                    to: 'libcrypto.so.1.0.0',
                },
            ],
        },
        protocols: {
            // macOS only; win use app.setAsDefaultProtocolClient
            name: protocol,
            schemes: [protocol],
        },
        afterSign,
        afterPack,
    },
});
async function afterPack() {
    writeFileSync(
        'package.json',
        `${JSON.stringify(packageCopy, null, 2)}\n`,
    );
}
async function afterSign() {
    if (!useNotarize) {
        return;
    }
    console.log(`Start notarizing ${appname}`);
    try {
        await notarize({
            appBundleId: appId,
            appPath: `dist/mac/${appname}.app`,
            appleId: developerid,
            appleIdPassword: developerpassword,
        });
    } catch (error) {
        console.error(error);
    }
    console.log(`Done notarizing ${appname}`);
}

function getNodeFilePaths() {
    const electronVersion = Config.getElectronVersion(packageJSON.devDependencies.electron);

    const sqliteDir = 'src/modules/database/sqlite3/lib/binding';
    const sqlitePath = `${sqliteDir}/electron-v${electronVersion}-${platform()}-${arch()}`;
    screenshotPath = `src/modules/screenshot/electron-v${electronVersion}-${platform()}-${arch()}`;
    return [sqlitePath, screenshotPath];
}
