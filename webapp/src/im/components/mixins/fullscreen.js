function getSuppportFnName(list) {
    let undef;
    let result;
    list.forEach((name) => {
        const fn = document[name] !== undef ? document[name] : document.documentElement[name];
        if (fn !== undef) {
            result = name;
        }
    });
    return result;
}

function getFullscreen() {
    return {
        computed: {
            fullscreenElementName() {
                return getSuppportFnName([
                    'fullscreenElement',
                    'webkitFullscreenElement',
                    'mozFullScreenElement',
                ]);
            },
            requestFullscreenName() {
                return getSuppportFnName([
                    'requestFullscreen',
                    'webkitRequestFullscreen',
                    'mozRequestFullScreen',
                ]);
            },
            onfullscreenchangeName() {
                return getSuppportFnName([
                    'onfullscreenchange',
                    'onwebkitfullscreenchange',
                    'onmozfullscreenchange',
                ]);
            },
            exitFullscreenName() {
                return getSuppportFnName([
                    'exitFullscreen',
                    'webkitExitFullscreen',
                    'mozCancelFullScreen',
                ]);
            },
        },
        methods: {
            toggleFullScreen(el) {
                if (!document[this.fullscreenElementName]) {
                    el[this.requestFullscreenName]();
                } else if (document[this.exitFullscreenName]) {
                    document[this.exitFullscreenName]();
                }
            },
        },
    };
}

export default getFullscreen;
