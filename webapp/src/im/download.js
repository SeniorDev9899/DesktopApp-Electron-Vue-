export const download = IS_DESKTOP ? RongDesktop.download : (() => {
    const noop = $.noop;

    function downloadHandle(url) {
        const a = document.createElement('A');
        a.href = url;
        a.download = url.substr(url.lastIndexOf('/') + 1);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    function handle(file) {
        const instance = {
            pause: noop,
            abort: noop,
            onError: noop,
            onReady: noop,
            onProgress: noop,
            // 注意：onComplete 在应用环节被重写了
            onComplete: noop,
            onCancel: noop,
        };
        // eslint-disable-next-line no-multi-assign
        instance.start = instance.resume = instance.saveAs = instance.save = (function save(url) {
            downloadHandle(url);
            if (this.onComplete) this.onComplete({});
        }).bind(instance, file.url);
        return instance;
    }

    handle.getProgress = function getProgress() {
        return {};
    };
    handle.load = function load(fileInfo) {
        return handle(fileInfo);
    };
    return handle;
})();

export const downloader = IS_DESKTOP ? RongDesktop.downloader : download;
