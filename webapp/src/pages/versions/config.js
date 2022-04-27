const { server, product } = window.config;

const config = {
    // 解析路径中的语言配置
    // 39331 - 【设置】英文语言模式下，功能介绍及版本更新没有变成英文显示
    locale: window.location.href.replace(/^.+(language=)/, '') || 'zh',
    server: server || APP_SERVER,
    product,
};

export default config;
