const path = require('path');
const { read } = require('./scripts/parser');
const runtime = require('./scripts/runtime');
const pages = require('./vue.entries');

process.stdout.write(`Webpack target runtime: ${
    runtime.IS_DESKTOP ? 'electron-webapp-renderer' : 'webapp-web'
}\n\n`);

module.exports = {
    outputDir: './dist',
    publicPath: './',
    pages,
    lintOnSave: true,
    productionSourceMap: true,
    chainWebpack: (config) => {
        config.plugins.delete('progress');
        // 定义运行时常量
        config.plugin('define').tap(args => [{
            ...args[0],
            ...runtime,
        }]);
        // 支持 template.shtml 模板直接以字符串的形式引用
        config.module.rule('shtml').test(/\.shtml$/)
            .use('raw-loader')
            .loader('raw-loader')
            .end();
        config.module.rule('html').test(/\.html$/)
            .use('raw-loader')
            .loader('raw-loader')
            .end()
            .use('ssi-loader')
            .loader(path.join(__dirname, 'scripts/ssi-loader'))
            .end();
    },
    devServer: runtime.IS_DESKTOP ? {
        proxy: `http://localhost:${read('proxy')}`,
    } : undefined,
};
