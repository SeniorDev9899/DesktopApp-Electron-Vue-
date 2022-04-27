/**
 * 读取 jeninks 构建配置并写入本地配置文件，以供打包脚本和应用使用
 */
const fs = require('fs');
const { ConfigIniParser } = require('config-ini-parser');

const appConfFilePath = 'src/app.conf';
const signConfFilePath = 'src/sign.conf';
const appContent = fs.readFileSync('scripts/tools/app.tmp.conf', 'utf8');
const signContent = fs.readFileSync('scripts/tools/sign.tmp.conf', 'utf8');
const appConf = new ConfigIniParser().parse(appContent);
const signConf = new ConfigIniParser().parse(signContent);

function setIniOptions(parser, section, obj) {
    if (!parser.isHaveSection(section)) {
        parser.addSection(section);
    }
    Object.keys(obj).forEach((key) => {
        // patch value 中包含 : 导致获取失败 value 前加空格
        const newValue = ` ${obj[key]}`;
        parser.set(section, key, newValue);
    });
}
const { env } = process;
function getJenkinsConfig(confKeys) {
    const conf = {};
    Object.keys(confKeys).forEach((key) => {
        conf[key] = env[confKeys[key]] || '';
    });
    return conf;
}
const appConfKeys = {
    gitcommitid: 'RCE_GitCommitID',
    version: 'RCE_Version',
    versioncode: 'RCE_VersionCode',
    appid: 'RCE_AppId',
    appname: 'RCE_AppName',
    protocol: 'RCE_Protocal',
    productname: 'RCE_ProductName',
    productnameen: 'RCE_ProductNameEn',
    productnamezh: 'RCE_ProductNameZh',
    copyright: 'RCE_Copyright',
    description: 'RCE_Description',
    author: 'RCE_Author',
    home: 'RCE_Home',
    ignorecertificateerrors: 'RCE_IgnoreCertificateErrors',
    noproxy: 'RCE_NoProxy',
    appserver: 'RCE_AppServer',
    reporturl: 'RCE_ReportUrl',
    build: 'RCE_Build',
    appissid: 'RCE_Appissid',
    netEnvironment: 'RCE_NetEnv',
};
const signConfKeys = {
    identity: 'RCE_CodeSign',
    notarize: 'RCE_Notarize',
    developerid: 'AppleDeveloperId',
    developerpassword: 'AppleDeveloperIdPassword',
    // certificatefile: 'certificatefile',
    certificatepassword: 'PFX_PASSWORD',
};
const appConfObj = getJenkinsConfig(appConfKeys);
const signConfObj = getJenkinsConfig(signConfKeys);

if (!appConfObj.versioncode) {
    // 为兼容旧版 Jenkins 工程，需对 BUILD_ID 做值提升
    appConfObj.versioncode = 1610000 + parseInt(env.BUILD_ID, 10);
}

setIniOptions(appConf, 'base', appConfObj);
setIniOptions(signConf, 'base', signConfObj);

// jenkins 上传 win 证书文件地址
signConf.set('base', 'certificatefile', '../PFX_FILE.pfx');

fs.writeFileSync(appConfFilePath, appConf.stringify());
fs.writeFileSync(signConfFilePath, signConf.stringify());
