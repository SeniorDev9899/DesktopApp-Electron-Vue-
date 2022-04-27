/* eslint-disable no-param-reassign */
export default function (ImageViewer) {
    const noop = $.noop;

    ImageViewer.browserWindow = {
        max: noop,
        min: noop,
        restore: noop,
        close: noop,
        setMinimumSize: noop,
        setFullScreen: noop,
        center: noop,
    };

    ImageViewer.system = {
        platform: 'web',
        getWorkAreaSize() {
            return { width: window.screen.availWidth, height: window.screen.availHeight };
        },
    };

    const downloadHandle = function downloadHandle(url) {
        const a = document.createElement('A');
        a.href = url;
        a.download = url.substr(url.lastIndexOf('/') + 1);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const download = function download(file) {
        return {
            start() {
                downloadHandle(file.url);
            },
            pause: noop,
            resume() {
                downloadHandle(file.url);
            },
            abort: noop,
            save() {
                downloadHandle(file.url);
            },
            saveAs() {
                downloadHandle(file.url);
            },
            onError: noop,
            onReady: noop,
            onProgress: noop,
            onComplete: noop,
            onCancel: noop,
        };
    };
    ImageViewer.download = download;

    function Download(data) {
        this.data = data;
    }
    const DownloadPublic = {
        onError: $.noop,
        onComplete: $.noop,
        onCancel: $.noop,
        saveAs() {
        // console.log('download', arguments);
            const aEl = document.createElement('a');
            aEl.target = '_blank';
            aEl.href = this.data.url;
            aEl.download = '';
            document.body.appendChild(aEl);
            aEl.click();
            $(aEl).remove();
            this.onComplete();
        },
    };
    $.extend(Download.prototype, DownloadPublic);

    ImageViewer.download = data => new Download(data);
}
