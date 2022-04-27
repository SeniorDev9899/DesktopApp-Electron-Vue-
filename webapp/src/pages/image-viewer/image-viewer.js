/* eslint-disable func-names */
/* eslint-disable no-param-reassign */
/* eslint-disable no-underscore-dangle */
/*
说明：图片/视频查看器
功能：
    1. 图片放大,缩小,旋转
    2. 视频播放
    3. 图片/视频的缩略图预览
    4. 图片点击分三种情况: a. 左右按钮(区域)点击[查看器只改变高度,不改变宽度] b. 预览点击[查看器不会根据尺寸改变大小]  c. 键盘切换 [查看器根据图片大小自适应]
*/

export default function (ImageViewer) {
    const utils = ImageViewer.utils;
    const KEYCODE = utils.keyCode;
    const RongIM = window.RongIM;
    const components = ImageViewer.components;

    const drag = ImageViewer.drag;
    // 最大放大倍数
    const maxScale = 30;
    /*
    窗口大小,实际通过屏幕大小动态调整
    最大为屏幕大小的 80%
    最小为500*400
    */
    const win = {
        max: {
            width: 800,
            height: 600,
        },
        min: {
            width: 500,
            height: 400,
        },
        default: {
            width: 500,
            height: 400,
        },
    };

    // 窗口高度 - 图片可见高度
    let _otherHeight;
    // 导航高度
    let _naviHeight;
    /*
    none: 不改变窗口大小,适用于点击缩略图
    both: 自适应大小,适用于键盘切换
    height: 只改变高度,用于左右箭头/区域切换
    width: 暂未用
    init: 用于关闭后重新打开窗口时,此时根据图片大小调整窗口
     */
    const AutoSize = {
        none: 0,
        both: 1,
        height: 2,
        width: 3,
        init: 4,
    };

    const AreaClick = {
        none: 0,
        prev: 1,
        next: 2,
    };

    const Zoom = {
        max: 0,
        min: 1,
        normal: 2,
    };

    // 用于控制“消息撤回”提示框打开其他图片时关闭提示框
    let recallMsgMessageBox = null;
    let hasNewMessage = false;

    components.getImageViewer = function getImageViewer(resolve, reject) {
        const options = {
            name: 'image-viewer',
            template: '#rong-template-image-viewer',
            props: {
                // 图片数据源
                imageList: {
                    type: Array,
                    required: true,
                },
                // 默认选中图片
                defaultIndex: 0,
                // 多语言
                lan: '',
                // 缩略图显示数
                galleryPageNum: {
                    type: Number,
                    required: false,
                    default: 5,
                },
                zoomRatio: {
                    type: Number,
                    required: false,
                    default: 0.2,
                },
                cache: null,
                isMaxWindow: false,
                fileToken: '',
            },
            data() {
                return {
                    config: window.config,
                    selectIndex: -1,
                    scale: 1,
                    angle: 0,
                    // 当前图片是否加载完
                    loadDone: false,
                    // 当前图片是否加载错误
                    loadError: false,
                    // 当前图片是否可拖动
                    picDragable: {
                        x: false,
                        y: false,
                    },
                    // 当前视频是否播放中. 播放时显示控制面板,否则隐藏
                    playing: false,
                    // 当前图片左右导航显示
                    showNav: {
                        prev: false,
                        next: false,
                    },
                    // 缩略图导航
                    gallery: {
                        show: false,
                        start: 0,
                        end: 0,
                    },
                    tip: '',
                    // 边界值,拖拽不能超过边界指
                    border: {
                        x: 0,
                        y: 0,
                    },
                    autoSize: AutoSize.both,
                    style: {
                        width: 54,
                        height: 54,
                    },
                    showScale: false,
                    // 区域是否可点击(上一张,下一张)
                    isAreaClick: AreaClick.none,
                    // 放大/缩小按钮状态,主要用于控制按钮显示是否置灰
                    zoomState: Zoom.normal,
                    cacheUrl: null,
                    currentMedia: null,
                    isDownloading: false,
                    currentVideo: {
                        currentTime: '00:00',
                        progress: 0,
                        paused: true,
                        duration: '00:00',
                    },
                    videoVoice: 0,
                    defaultVideoVoice: 0,
                    progressDragable: false,
                    changedProgress: 0,
                    // containerHeight: 0
                };
            },
            computed: {
                locale() {
                    return ImageViewer.locale[this.lan];
                },
                lastPicTips() {
                    if (this.currentState.isFirst) {
                        return this.locale.tips.firstOne;
                    }
                    return this.locale.btns.prev;
                },
                nextPicTips() {
                    if (this.currentState.isLast) {
                        return this.locale.tips.lastOne;
                    }
                    return this.locale.btns.next;
                },
                lastTips() {
                    if (this.isFirst) {
                        return this.locale.tips.firstPage;
                    }
                    return this.locale.tips.last;
                },
                nextTips() {
                    if (this.isLast) {
                        return this.locale.tips.lastPage;
                    }
                    return this.locale.tips.next;
                },
                // 区分 pc 与 Web
                isWeb() {
                    return ImageViewer.system.platform === 'web';
                },
                // 当前媒体状态 是否第一个,是否最后一个, 是否是视频
                currentState() {
                    const totalNum = this.imageList.length - 1;
                    let isCache = false;
                    if (!this.isWeb && this.currentMedia && this.currentMedia.showUrl && this.currentMedia.showUrl.startsWith('data:image')) {
                        isCache = true;
                    }
                    return {
                        isFirst: this.selectIndex <= 0,
                        isLast: this.selectIndex >= totalNum,
                        isVideo: this.isVideo(this.currentMedia),
                        isCache,
                        scale: Math.round(this.scale * 100),
                        // zoom: this.zoomState || Zoom.nomal
                    };
                },
                // 缩略图的上下翻页按钮是否可见
                showPageIndex() {
                    return this.imageList.length > this.galleryPageNum;
                },
                // 是否第一页, 第一页上翻按钮不可用
                isFirst() {
                    return this.gallery.start <= 0;
                },
                // 是否最后一页, 最后一页下翻按钮不可用
                isLast() {
                    const totalNum = this.imageList.length;
                    return this.gallery.end >= totalNum;
                },
                // 窗口是否可拖拽(非标题栏. 图片拖动时,如果图片超过容器大小则拖动图片,否则拖动窗口)
                winDragable() {
                    const platform = ImageViewer.system.platform;
                    if (platform === 'win32') {
                        return false;
                    }
                    if (!this.loadDone) {
                        return false;
                    }
                    const dragable = this.picDragable;
                    return !dragable.x && !dragable.y;
                },
            },
            mounted() {
                const context = this;
                this.autoSize = AutoSize.init;
                // this.selectIndex = this.defaultIndex;
                window.addEventListener('keydown', this.keydown);
                // 重置图片容器大小
                if (!this.isWeb) {
                    window.addEventListener('resize', this.resize);
                    this.selectIndex = -1;
                }
                _otherHeight = 144;
                _naviHeight = 90;
                ImageViewer.onRecall = function onRecall(messageUId) {
                    recallMsg(messageUId, context);
                };
                const im = RongIM ? RongIM.instance : null;
                if (im) {
                    im.$off('recallMsg');
                    im.$on('recallMsg', (messageUId) => {
                        recallMsg(messageUId, context);
                    });
                }
            },
            beforeDestroy() {
                window.removeEventListener('keydown', this.keydown);
                window.removeEventListener('resize', this.resize);

                const im = RongIM ? RongIM.instance : null;
                if (im) im.$off('recallMsg');
            },
            watch: {
                selectIndex(newValue, oldValue) {
                    if (newValue === -1 || newValue === oldValue) {
                        return;
                    }
                    this.reset();

                    // 如果在缩略图中不可见则调整到可见
                    let start = newValue;
                    let end;
                    const totalNum = this.imageList.length;
                    let needAdjust = true;

                    if (oldValue > -1) {
                        if (newValue < this.gallery.start) {
                            end = start + this.galleryPageNum;
                            end = adjustEnd(end, totalNum);
                        } else if (newValue >= this.gallery.end) {
                            end = newValue + 1;
                            start = end - this.galleryPageNum;
                            end = adjustEnd(end, totalNum);
                        } else {
                            needAdjust = false;
                        }
                    } else {
                        // 初始加载
                        // eslint-disable-next-line no-lonely-if
                        if (totalNum <= this.galleryPageNum) {
                            start = 0;
                            end = totalNum;
                        } else if (start + this.galleryPageNum >= totalNum) {
                            end = totalNum;
                            start = end - this.galleryPageNum;
                            start = adjustStart(start);
                        } else {
                            end = start + this.galleryPageNum;
                            end = adjustEnd(end, totalNum);
                        }
                    }

                    if (needAdjust) {
                        this.gallery.start = start;
                        this.gallery.end = end;
                    }
                    if (!this.currentState.isCache) {
                        this.loadDone = false;
                    }
                    this.zoomState = Zoom.normal;
                    if (this.autoSize !== AutoSize.init || this.isWeb) {
                        this.updateCurrentMedia(this.imageList, newValue);
                    }
                },
                scale(/* newValue, oldValue */) {
                    const context = this;
                    const $mediaMain = $(this.$refs.mediaMain);

                    this.currentState.Zoom = Zoom.normal;
                    context.showScale = true;
                    this.zoomState = Zoom.normal;
                    Vue.nextTick(() => {
                        context.reCalculate();
                        const dragable = context.picDragable;
                        const border = context.border;
                        if (!dragable.x) {
                            $mediaMain.css({
                                'margin-left': 0,
                            });
                        }
                        if (!dragable.y) {
                            $mediaMain.css({
                                'margin-top': 0,
                            });
                        }
                        if (dragable.x || dragable.y) {
                            adjustPosition(border, $mediaMain, dragable);
                        }
                        context.showScale = false;
                    });
                },
                angle() {
                    const context = this;
                    Vue.nextTick(() => {
                        context.resizeImg();
                        context.reCalculate();
                    });
                },
                defaultIndex() {
                    this.selectIndex = this.defaultIndex;
                },
                isAreaClick(newValue) {
                    this.updateDragale();
                    const dragable = this.picDragable;
                    if (dragable.x || dragable.y) {
                        return;
                    }
                    const $mediaContainer = $(this.$refs.mediaContainer);
                    $mediaContainer.css('cursor', newValue === AreaClick.none ? 'default' : 'pointer');
                },
            },
            methods: {
                resizeImg() {
                    const $mediaMain = $(this.$refs.mediaMain);
                    const $mediaContainer = $(this.$refs.mediaContainer);
                    if (!$mediaMain.get(0)) {
                        return;
                    }
                    let mediaWidth = $mediaMain.get(0).width;
                    let mediaHeight = $mediaMain.get(0).height;
                    const containerWidth = $mediaContainer.width();
                    const containerHeight = $mediaContainer.height();
                    // 参考微信旋转重置为原图大小，超出容器则缩放
                    let tmp = 0;
                    if (this.angle % 180 !== 0) {
                        tmp = mediaHeight;
                        mediaHeight = mediaWidth;
                        mediaWidth = tmp;
                    }
                    const scaleW = Math.min(1, containerWidth / mediaWidth);
                    const scaleH = Math.min(1, containerHeight / mediaHeight);
                    this.scale = Math.min(scaleW, scaleH);

                    // var scale = this.scale;
                    // // 放大的状态下未超出容器范围，无需改变缩放
                    // if (scale >= 1 && mediaHeight <= containerHeight && mediaWidth <= containerWidth) {
                    //     return;
                    // }
                    // // 大图被缩小或放大超出容器范围，计算最接近容器尺寸比例
                    // var scaleWidth = containerWidth * scale / mediaWidth;
                    // var scaleHeight = containerHeight * scale / mediaHeight;
                    // this.scale = Math.min(scaleWidth, scaleHeight);
                },
                onUpdate(attrs) {
                    this.autoSize = AutoSize.init;
                    this.loadDone = false;
                    this.selectIndex = attrs.defaultIndex;
                    this.updateCurrentMedia(attrs.dataSource, attrs.defaultIndex);
                },
                init() {
                    this.gallery.show = false;
                    this.reset();
                },
                onClose() {
                    if (!this.currentMedia) {
                        return;
                    }
                    this.currentMedia = null;
                    // anm - 【图片查看器】查看图片旋转为竖版图片后，关闭再次打开，图片显示大小为56%，未显示100%
                    // When clicking the image in message list, this.angle will be set 0 by init() but
                    // if this.angle !== 0 then after init() was called angle() will be called so 图片显示大小为56%
                    this.resetAngle();
                },
                updateCurrentMedia(imageList, index) {
                    const context = this;
                    if (imageList.length <= 0 || index === -1) {
                        return;
                    }
                    const media = imageList[index];
                    context.currentMedia = media;

                    // 确保弱网下文件代理服务未能缓存完成前显示缩略图信息
                    if (!media.showUrl) {
                        let defaultImg = media.thumbnail;
                        defaultImg = defaultImg ? this.getBase64(defaultImg) : '';
                        if (!media.url) {
                            Vue.set(media, 'showUrl', defaultImg);
                        }
                    }
                    media.showUrl = media.url;
                    Vue.nextTick(() => {
                        const isVideo = context.currentState.isVideo;
                        const mediaMain = context.$refs.mediaMain;
                        const onload = function () {
                            context.loadedMedia();
                        };
                        if (isVideo) {
                            mediaMain.onloadeddata = null;
                            mediaMain.onloadeddata = onload;
                            mediaMain.onerror = null;
                        } else {
                            mediaMain.onload = null;
                            mediaMain.onload = onload;
                        }
                        mediaMain.onerror = context.mediaErr;
                        mediaMain.src = media.showUrl;
                    });
                },
                isZoomMax(zoomVal) {
                    return zoomVal === Zoom.max;
                },
                isZoomMin(zoomVal) {
                    return zoomVal === Zoom.min;
                },
                wheelZoom: utils.throttle(function (event) {
                    if (!this.loadDone || this.loadError) {
                        return;
                    }
                    const down = event.deltaY > 0;
                    if (down) {
                        this.zoomOut();
                    } else {
                        this.zoomIn();
                    }
                }, 50),
                isVideo(item) {
                    return item && item.type === 'SightMessage';
                },
                resetScale() {
                    this.scale = 1;
                },
                resetAngle() {
                    this.angle = 0;
                },
                resetImage() {
                    const $mediaMain = $(this.$refs.mediaMain);
                    $mediaMain.css({
                        'min-width': 0,
                        'min-height': 0,
                    });
                },
                // 重置图片状态,切换图片时需重置
                // 关闭“图片撤回”弹窗
                reset() {
                    if (recallMsgMessageBox) {
                        hasNewMessage = true;
                        recallMsgMessageBox.close();
                    }
                    this.resetScale();
                    this.resetAngle();
                    this.playing = false;
                    this.loadError = false;
                    if (this.currentState.isVideo) {
                        this.pauseVideo();
                    }
                    this.resetImage();
                    this.resetVideo();
                },
                resetVideo() {
                    clearTimeout(this.progressFlag);
                    this.currentVideo.currentTime = '00:00';
                    this.currentVideo.progress = 0;
                    this.currentVideo.paused = true;
                    this.changedProgress = 0;
                },
                // 计算拖拽边界
                reCalculate() {
                    const context = this;
                    context.updateDragale();
                    if (!context.picDragable.x && !context.picDragable.y) {
                        return;
                    }
                    const $mediaMain = $(context.$refs.mediaMain);
                    const $mediaContainer = $(context.$refs.mediaContainer);
                    const border = getBorder($mediaMain, $mediaContainer);
                    context.border = border;
                },
                close() {
                    ImageViewer.browserWindow.setFullScreen(false);
                    this.$emit('close');
                },
                mediaErr(/* err */) {
                    const context = this;
                    Vue.nextTick(() => {
                        context.loadError = true;
                        context.loadDone = true;
                    });
                },
                dragPlayButton(event) {
                    this.progressDragable = true;
                    dragPlayButton(this, event);
                },
                // 滑动进度条结束
                dragOver() {
                    const context = this;
                    if (context.progressDragable) {
                        clearTimeout(context.progressFlag);
                        const mediaMain = context.$refs.mediaMain;
                        const percent = parseFloat(context.changedProgress) / 100;
                        const currentTime = percent * mediaMain.duration;
                        mediaMain.currentTime = currentTime;
                        context.currentVideo.currentTime = convertTime(mediaMain.currentTime);
                        context.currentVideo.progress = percent * 100;
                        context.progressDragable = false;
                        if (context.playing) {
                            context.progressFlag = setInterval(() => {
                                getProgress(context);
                            }, 60);
                        }
                    }
                },
                // 播放视频
                play() {
                    const context = this;
                    if (!context.loadDone) {
                        return;
                    }
                    const mediaMain = context.$refs.mediaMain;
                    context.playing = true;
                    context.currentVideo.paused = false;
                    context.currentVideo.duration = convertTime(mediaMain.duration.toFixed());
                    context.videoVoice = mediaMain.volume * 100;
                    context.progressFlag = setInterval(() => {
                        getProgress(context);
                    }, 60);
                },
                videoSeek(event) {
                    const context = this;
                    clearTimeout(context.progressFlag);
                    const mediaMain = context.$refs.mediaMain;
                    const progressWrap = context.$refs.progressWrap;
                    const length = event.pageX - 105;
                    const percent = length / progressWrap.offsetWidth;
                    mediaMain.currentTime = percent * mediaMain.duration;
                    context.currentVideo.currentTime = convertTime(mediaMain.currentTime);
                    context.currentVideo.progress = percent * 100;
                    if (!context.progressDragable) {
                        context.changedProgress = context.currentVideo.progress;
                    }
                    if (context.playing) {
                        context.progressFlag = setInterval(() => {
                            getProgress(context);
                        }, 60);
                    }
                },
                voiceSeek(event) {
                    const el = event.currentTarget.firstChild;
                    const trackHeight = el.offsetHeight;

                    const mediaMain = this.$refs.mediaMain;
                    const videoControl = $(this.$refs.videoControl);
                    const length = videoControl.offset().top - event.pageY - 4;
                    let percent = length / trackHeight;
                    if (percent > 1) {
                        percent = 1;
                    } else if (percent < 0) {
                        percent = 0;
                    }
                    mediaMain.volume = percent;
                    this.videoVoice = percent * 100;
                },
                dragVoiceButton(event) {
                    const mediaMain = this.$refs.mediaMain;
                    mediaMain.muted = false;
                    dragVoiceButton(this, event);
                },
                // 播放结束
                ended() {
                    this.playing = false;
                    this.currentVideo.paused = true;
                    clearTimeout(this.progressFlag);
                    this.currentVideo.currentTime = convertTime(0);
                    this.currentVideo.progress = 0;
                },
                // 图片/视频 加载完成
                loadedMedia() {
                    this.loadDone = true;
                    const mediaMain = this.$refs.mediaMain;
                    const mediaContainer = this.$refs.mediaContainer;
                    let rawSize = {
                        width: mediaMain.naturalWidth,
                        height: mediaMain.naturalHeight,
                    };
                    if (this.currentState.isVideo) {
                        rawSize = {
                            width: mediaMain.videoWidth,
                            height: mediaMain.videoHeight,
                        };
                        this.playVideo();
                    }

                    const otherHeight = this.gallery.show ? (_otherHeight + _naviHeight) : _otherHeight;

                    if (this.isMaxWindow) {
                        return;
                    }
                    this.picDragable = { x: false, y: false };
                    const cumputedSize = getSize(rawSize, otherHeight);
                    const floor = function (val) {
                        return Math.floor(val);
                    };
                    const viewerSize = this.getViewerSize();
                    let destWidth = viewerSize.width;
                    let destHeight = viewerSize.height;
                    switch (this.autoSize) {
                    case AutoSize.init:
                        destWidth = cumputedSize.winSize.width;
                        destHeight = cumputedSize.winSize.height;

                        destWidth = Math.min(destWidth, win.max.width);
                        destHeight = Math.min(destHeight, win.max.height);

                        destWidth = Math.max(destWidth, win.min.width);
                        destHeight = Math.max(destHeight, win.min.height);

                        this.resizeWin(destWidth, destHeight);
                        if (this.isWeb) {
                            $(mediaContainer).height(cumputedSize.containerSize.height);
                        }
                        break;
                    case AutoSize.none:
                        break;
                    // eslint-disable-next-line vars-on-top
                    // eslint-disable-next-line no-case-declarations
                    case AutoSize.both:
                        if (cumputedSize.winSize.width < destWidth && cumputedSize.winSize.height < destHeight) {
                            return;
                        }
                        let changed = false;
                        if (floor(cumputedSize.winSize.width) > floor(destWidth)) {
                            destWidth = Math.min(cumputedSize.winSize.width, win.max.width);
                            changed = true;
                        }
                        if (floor(cumputedSize.winSize.height) > floor(destHeight)) {
                            destHeight = Math.min(cumputedSize.winSize.height, win.max.height);
                            changed = true;
                        }
                        if (changed) this.resizeWin(destWidth, destHeight);
                        break;
                    case AutoSize.height:
                        if (cumputedSize.winSize.width < destWidth && cumputedSize.winSize.height < destHeight) {
                            return;
                        }
                        if (cumputedSize.winSize.height > destHeight) {
                            destHeight = Math.min(cumputedSize.winSize.height, win.max.height);
                            this.resizeWin(destWidth, destHeight);
                        }
                        break;
                    case AutoSize.width:
                        break;
                    default:
                    }

                    setTimeout(() => {
                        $(mediaMain).css({
                            'min-width': mediaMain.width,
                            'min-height': mediaMain.height,
                        });
                    }, 10);
                },
                updateDragale() {
                    // TODO: 图片大小超出容器则可拖拽
                    // 需要区分: 上下可拖拽,左右可拖拽
                    const $mediaMain = $(this.$refs.mediaMain);
                    const $mediaContainer = $(this.$refs.mediaContainer);

                    const dragable = getDragable($mediaMain, $mediaContainer);
                    this.picDragable = dragable;
                    if (dragable.x || dragable.y) {
                        $mediaContainer.css('cursor', 'move');
                        this.isAreaClick = AreaClick.none;
                    } else {
                        $mediaContainer.css('cursor', 'default');
                    }
                },
                // 设置提示
                setTip(tip) {
                    this.tip = tip;
                },
                areaClick() {
                    this.updateDragale();
                    const dragable = this.picDragable;
                    if (dragable.x || dragable.y || this.isAreaClick === AreaClick.none) {
                        return;
                    }
                    this.autoSize = AutoSize.both;
                    if (this.isAreaClick === AreaClick.prev) {
                        this.prev();
                    } else if (this.isAreaClick === AreaClick.next) {
                        this.next();
                    }
                },
                clickPrev() {
                    if (this.isAreaClick === AreaClick.prev) {
                        return;
                    }
                    this.autoSize = AutoSize.both;
                    this.prev();
                },
                clickNext() {
                    if (this.isAreaClick === AreaClick.next) {
                        return;
                    }
                    this.autoSize = AutoSize.both;
                    this.next();
                },
                // 上一个媒体
                prev() {
                    this.resetVideo();
                    if (this.selectIndex > 0) {
                        this.selectIndex -= 1;
                        if (this.selectIndex === 0) {
                            showMessage(this.setTip, this.locale.tips.firstOne);
                        }
                    } else {
                        showMessage(this.setTip, this.locale.tips.firstOne);
                    }
                },
                // 下一个媒体
                next() {
                    this.resetVideo();
                    if (this.selectIndex < this.imageList.length - 1) {
                        this.selectIndex += 1;
                        if (this.selectIndex === this.imageList.length - 1) {
                            showMessage(this.setTip, this.locale.tips.lastOne);
                        }
                    } else {
                        showMessage(this.setTip, this.locale.tips.lastOne);
                    }
                },
                // 放大
                zoomIn() {
                    if (!this.loadDone || this.loadError) {
                        return;
                    }
                    let destScale = this.scale * (1 + this.zoomRatio);
                    if (destScale > maxScale) {
                        destScale = maxScale;
                        this.zoomState = Zoom.max;
                    }
                    this.autoSize = AutoSize.none;
                    this.scale = destScale;
                },
                // 缩小
                zoomOut() {
                    if (!this.loadDone || this.loadError) {
                        return;
                    }
                    const minSize = this.$refs.thumbnail;
                    // 缩小时不超过图片显示最小值
                    const mediaMain = this.$refs.mediaMain;
                    const minScale = Math.max(minSize.width / mediaMain.width, minSize.height / mediaMain.height);
                    const nextScale = this.scale / (1 + this.zoomRatio);
                    if (nextScale <= minScale && this.scale < 1) {
                        this.zoomState = Zoom.min;
                        return;
                    }
                    this.scale = nextScale;
                },
                rotate() {
                    this.angle = (this.angle - 90) % 360;
                },
                // 下载
                download() {
                    if (!this.imageList.length || this.isDownloading) {
                        return;
                    }
                    const context = this;
                    this.isDownloading = true;
                    const url = this.currentMedia.url;
                    const file = {
                        url,
                    };
                    if (this.currentState.isVideo) {
                        file.name = this.currentMedia.name;
                    }
                    const downloader = ImageViewer.download(file);
                    downloader.onError = function (/* error */) {
                        context.isDownloading = false;
                    };
                    downloader.onComplete = function () {
                        context.isDownloading = false;
                    };
                    downloader.onCancel = function () {
                        context.isDownloading = false;
                    };
                    downloader.saveAs();
                },
                showImage(index) {
                    this.autoSize = AutoSize.none;
                    this.selectIndex = index;
                },
                muted() {
                    const mediaMain = this.$refs.mediaMain;
                    if (mediaMain.muted) {
                        this.videoVoice = this.defaultVideoVoice;
                    } else {
                        this.defaultVideoVoice = this.videoVoice;
                        this.videoVoice = 0;
                    }
                    mediaMain.muted = !mediaMain.muted;
                },
                playVideo() {
                    const context = this;
                    const mediaMain = context.$refs.mediaMain;
                    if (mediaMain.paused || mediaMain.ended) {
                        mediaMain.play();
                    } else {
                        mediaMain.pause();
                        context.currentVideo.paused = true;
                        clearTimeout(context.progressFlag);
                    }
                },
                pauseVideo() {
                    const video = this.$refs.mediaMain;
                    if (video && video.played) video.pause();
                },
                toggle() {
                    const mediaContainer = this.$refs.mediaContainer;
                    const isShow = !this.gallery.show;
                    autoResizeContainer(isShow, $(mediaContainer), _naviHeight);
                    this.reCalculate();
                    this.gallery.show = isShow;
                },
                getBase64(base64) {
                    return utils.Base64.concat(base64);
                },
                // 当前缩略图是否可见
                isVisible(index) {
                    return (index >= this.gallery.start) && (index < this.gallery.end);
                },
                // 缩略图导航翻页: 上一页
                prevPage() {
                    let start = this.gallery.start;
                    start -= this.galleryPageNum;
                    start = adjustStart(start);
                    let end = start + this.galleryPageNum;
                    const totalNum = this.imageList.length;
                    end = adjustEnd(end, totalNum);
                    this.gallery.start = start;
                    this.gallery.end = end;
                },
                // 缩略图导航翻页: 下一页
                nextPage() {
                    let start = this.gallery.end;
                    let end = this.gallery.end + this.galleryPageNum;
                    const totalNum = this.imageList.length;
                    end = adjustEnd(end, totalNum);
                    if (end === totalNum) {
                        start = end - this.galleryPageNum;
                        start = adjustStart(start);
                    }
                    this.gallery.start = start;
                    this.gallery.end = end;
                },
                // 鼠标移动,判断上线翻页是否可见
                mousemove(event) {
                    const containerWidth = event.currentTarget.clientWidth;
                    let cursorX = event.clientX;
                    const $target = $(event.target);
                    const isControl = $target.closest('.rong-video-control')[0];
                    if (this.isWeb) {
                        const inWrap = $target.closest('.rong-dialog-inner');
                        cursorX -= inWrap.position().left;
                    }
                    if (containerWidth) {
                        const unit = containerWidth / 4;
                        if (cursorX <= unit && !isControl) {
                            this.showNav.prev = true;
                            this.showNav.next = false;
                            this.isAreaClick = AreaClick.prev;
                        } else if (cursorX >= unit * 3 && !isControl) {
                            this.showNav.prev = false;
                            this.showNav.next = true;
                            this.isAreaClick = AreaClick.next;
                        } else {
                            this.showNav.prev = false;
                            this.showNav.next = false;
                            this.isAreaClick = AreaClick.none;
                        }
                    }
                },
                disableNav(/* event */) {
                    this.showNav.prev = false;
                    this.showNav.next = false;
                },
                // 键盘控制翻页
                keydown(event) {
                    switch (event.keyCode) {
                    case KEYCODE.left:
                        this.autoSize = AutoSize.both;
                        this.prev();
                        break;
                    case KEYCODE.right:
                        this.autoSize = AutoSize.both;
                        this.next();
                        break;
                    case KEYCODE.esc:
                        this.close();
                        break;
                    default:
                        break;
                    }
                },
                resize(/* event */) {
                    const otherHeight = this.gallery.show ? (_otherHeight + _naviHeight) : _otherHeight;
                    const $mediaContainer = $(this.$refs.mediaContainer);
                    // var viewerSize = this.getViewerSize();
                    // var winSize = {width: viewerSize.width, height: viewerSize.height};
                    const winSize = { width: $(window).width(), height: $(window).height() };
                    const size = _getContainerSize(winSize, otherHeight);
                    $mediaContainer.height(size.height);
                    $mediaContainer.width(size.width);
                },
                // 拖拽图片
                dragImg(event) {
                    this.updateDragale();
                    const dragable = this.picDragable;
                    if (!this.loadDone) {
                        return;
                    }
                    dragImg(this.border, event, dragable);
                },
                resizeWin(width, height) {
                    width = Math.ceil(width);
                    height = Math.ceil(height);
                    if (this.isWeb) {
                        const $mediaMain = $(this.$refs.mediaMain);
                        const $dialog = $mediaMain.closest('.rong-dialog-inner');
                        if ($dialog.width() < width) {
                            $dialog.width(width);
                        }
                        $dialog.height(height);
                    }
                },
                getViewerSize() {
                    if (this.isWeb) {
                        const $mediaMain = $(this.$refs.mediaMain);
                        const $dialog = $mediaMain.closest('.rong-dialog-inner');
                        return { width: $dialog.width(), height: $dialog.height() };
                    }
                    return { width: $(window).width(), height: $(window).height() };
                },
            },
        };
        utils.asyncComponent(options, resolve, reject);
    };

    function recallMsg(uid, instance) {
        const list = instance.imageList;
        const listLen = list.length;
        for (let i = listLen - 1; i > -1; i -= 1) {
            if (list[i].uid === uid) {
                list.splice(i, 1);
                if (listLen === 1) {
                    if (instance.isWeb) {
                        showMessage(instance.setTip, instance.locale.tips.recalled, () => {
                            instance.close();
                        });
                    } else {
                        const tips = instance.locale.tips;
                        instance.currentMedia = null;
                        recallMsgMessageBox = utils.messagebox({
                            message: tips.recalled,
                            // eslint-disable-next-line no-loop-func
                            closeCallback() {
                                // 取消/关闭
                                if (!hasNewMessage) {
                                    instance.close();
                                }
                                recallMsgMessageBox = null;
                                hasNewMessage = false;
                            },
                            // eslint-disable-next-line no-loop-func
                            callback() {
                                // 确认
                                if (!hasNewMessage) {
                                    instance.close();
                                }
                                recallMsgMessageBox = null;
                                hasNewMessage = false;
                            },
                        });
                    }
                } else if (instance.currentMedia.uid === uid) {
                    instance.autoSize = AutoSize.none;
                    const isLast = instance.selectIndex === listLen - 1;
                    if (isLast) {
                        instance.prev();
                    } else {
                        instance.updateCurrentMedia(list, instance.selectIndex);
                    }
                }
                break;
            }
        }
    }

    function adjustStart(start) {
        return start >= 0 ? start : 0;
    }

    function adjustEnd(end, total) {
        return end < total ? end : total;
    }

    function showMessage(setTip, tip, callback) {
        clearTimeout(showMessage.timer);
        callback = callback || $.noop;
        setTip(tip);
        showMessage.timer = setTimeout(() => {
            setTip('');
            callback();
        }, 1500);
    }

    function getObjSize($obj) {
        const objSize = {
            width: parseFloat($obj.css('width')),
            height: parseFloat($obj.css('height')),
        };
        return objSize;
    }

    // dragable: 计算 x y 方向是否可拖拽
    function getDragable($mediaMain, $mediaContainer) {
        const mediaSize = getObjSize($mediaMain);
        const containerSize = getObjSize($mediaContainer);
        return {
            x: mediaSize.width > containerSize.width,
            y: mediaSize.height > containerSize.height,
        };
    }

    // border: 计算可拖拽边界
    function getBorder($mediaMain, $mediaContainer) {
        const mediaSize = getObjSize($mediaMain);
        const containerSize = getObjSize($mediaContainer);
        return {
            y: (mediaSize.height - containerSize.height) / 2,
            x: (mediaSize.width - containerSize.width) / 2,
        };
    }

    // dragable{x: bool, y: bool}: x 方向可拖拽/y 方向可拖拽
    function dragImg(border, event, dragable) {
        dragable = dragable || {};
        if (!dragable.x && !dragable.y) {
            return;
        }
        const el = event.target;
        const $el = $(el);
        const oldPosition = {
            left: parseFloat($el.css('left')),
            top: parseFloat($el.css('top')),
        };

        drag(el, event, (position) => {
            let deltaX = position.left - oldPosition.left;
            let deltaY = position.top - oldPosition.top;
            const css = {};
            if (dragable.x) {
                if (deltaX > border.x) {
                    deltaX = border.x;
                } else if (deltaX < 0 - border.x) {
                    deltaX = 0 - border.x;
                }
                css['margin-left'] = deltaX;
            }
            if (dragable.y) {
                if (deltaY > border.y) {
                    deltaY = border.y;
                } else if (deltaY < 0 - border.y) {
                    deltaY = 0 - border.y;
                }
                css['margin-top'] = deltaY;
            }
            $el.css(css);
        }, el.parentElement);
    }

    /*
    新设计方法
     */

    /*
    窗口大小 媒体容器大小
    1. getWindowSize: 根据 rawSize 计算窗口大小
    2. checkMaxSize
    3. checkMinSize
    4. getContainerSize
    */
    function getSize(rawSize, otherHeight) {
        let winSize = _getWindowSize(rawSize, otherHeight);
        winSize = _checkMaxSize(winSize);
        winSize = _checkMinSize(winSize);
        return { containerSize: _getContainerSize(winSize, otherHeight), winSize };
    }

    /*
    根据原图大小计算窗体大小 getSize 调用
    otherHeight: 窗口高度-图片高度
     */
    function _getWindowSize(rawSize, otherHeight) {
        const winSize = {
            width: rawSize.width,
            height: rawSize.height + otherHeight,
        };
        return winSize;
    }

    /*
     检查窗体当前大小是否超过了设定的最大值  getSize 调用
     如果未超过,则返回当前 size
     如果有一边超过,如 width 超值,则按照 width = maxWidth 等比压缩获取 height 值
     如两边都超,则按照超限大的一边等比压缩显示
     */
    function _checkMaxSize(winSize) {
        const hRatio = winSize.height / win.max.height;
        const wRatio = winSize.width / win.max.width;
        const ratio = Math.max(wRatio, hRatio);
        let adjustSize = winSize;

        if (ratio > 1) {
            adjustSize = {
                width: Math.floor(winSize.width / ratio),
                height: Math.floor(winSize.height / ratio),
            };
        }
        return adjustSize;
    }

    /*
     检查窗体当前大小是否超过了设定的最小值  getSize 调用
     如果未超过,则返回当前 size
     如果有一边超过,如 width 超值,则按照 width = minWidth 等比放大获取 height 值
     如两边都超,则按照最小窗口 size 显示
     */
    function _checkMinSize(winSize) {
        const hRatio = win.min.height / winSize.height;
        const wRatio = win.min.width / winSize.width;
        const ratio = Math.max(wRatio, hRatio);
        let adjustSize = winSize;
        if (ratio > 1) {
            adjustSize = {
                width: Math.max(winSize.width, win.min.width),
                height: Math.max(winSize.height, win.min.height),
            };
        }
        return adjustSize;
    }

    /*
        计算媒体容器显示大小  getSize 调用
    */
    function _getContainerSize(winSize, otherHeight) {
        const mediaSize = {
            width: winSize.width,
            height: winSize.height - otherHeight,
        };
        return mediaSize;
    }


    // 导航显示,但container高度仍是显示之前的高度
    function autoResizeContainer(showNavi, $mediaContainer, naviHeight) {
        let newHeight = $mediaContainer.height();
        const diffHeight = showNavi ? 0 - naviHeight : naviHeight;
        newHeight += diffHeight;
        $mediaContainer.height(newHeight);
    }

    // 拖动图片后缩小或者旋转时时,调整图片位置,保证不超出边界
    // todo: 如果图片小于容器大小,则居中显示
    function adjustPosition(border, $mediaMain, dragable) {
        const css = {};
        let deltaX;
        let deltaY;
        const marginLeft = parseFloat($mediaMain.css('margin-left'));
        const marginTop = parseFloat($mediaMain.css('margin-top'));
        if (dragable.x) {
            if (marginLeft > border.x) {
                deltaX = border.x;
            } else if (marginLeft < 0 - border.x) {
                deltaX = 0 - border.x;
            }
            if (deltaX) {
                css['margin-left'] = deltaX;
            }
        }
        if (dragable.y) {
            if (marginTop > border.y) {
                deltaY = border.y;
            } else if (marginTop < 0 - border.y) {
                deltaY = 0 - border.y;
            }
            if (deltaY) {
                css['margin-top'] = deltaY;
            }
        }
        $mediaMain.css(css);
    }

    function dragPlayButton(context, event) {
        const el = event.target;
        const $el = $(el);

        const trackWidth = $el.parent().width();
        drag(el, event, (position) => {
            const left = Math.min(Math.max(0, position.left), trackWidth);
            const ratio = left / trackWidth;
            context.changedProgress = ratio * 100;
        }, null, () => {
            context.dragOver();
        });
    }

    function dragVoiceButton(context, event) {
        const el = event.target;
        const $el = $(el);

        const trackHeight = $el.parent().height();
        drag(el, event, (position) => {
            const top = Math.min(Math.max(0, position.top), trackHeight);
            const ratio = 1 - top / trackHeight;
            context.videoVoice = ratio * 100;
            context.$refs.mediaMain.volume = ratio;
        });
    }

    function getProgress(context) {
        const mediaMain = context.$refs.mediaMain;
        if (!mediaMain) {
            clearTimeout(context.progressFlag);
            return;
        }
        const percent = mediaMain.currentTime / mediaMain.duration;
        context.currentVideo.currentTime = convertTime(mediaMain.currentTime.toFixed());
        context.currentVideo.progress = percent * 100;
        // context.currentVideo.duration = convertTime(mediaMain.duration.toFixed());

        if (!context.progressDragable) {
            context.changedProgress = context.currentVideo.progress;
        }
    }

    function convertTime(num) {
        let minute = 0;
        let seconds = 0;
        if (num > 60) {
            minute = Math.floor(num / 60);
        }
        seconds = num % 60;
        minute = minute > 9 ? minute : `0${minute}`;
        seconds = seconds > 9 ? seconds : `0${seconds}`;
        return `${minute}:${seconds}`;
    }
}
