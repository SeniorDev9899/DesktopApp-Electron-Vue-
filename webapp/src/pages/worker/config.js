const { server, locale } = window.config;

const language = window.location.href.replace(/^.+language=/, '').replace(/&.+/, '')
    || locale;

const product = {
    name: {
        zh: decodeURIComponent(
            window.location.href
                .replace(/^.+productName_zh=/, '')
                .replace(/&.+/, ''),
        ),
        en: window.location.href
            .replace(/^.+productName_en=/, '')
            .replace(/&.+/, ''),
    },
};

export default {
    // 解析路径中的语言配置
    locale: language,
    server: server || APP_SERVER,
    product,
};
