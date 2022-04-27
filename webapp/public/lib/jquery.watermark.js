 /**
     * 给页面添加文字水印
*/
(function(){

    var watermark = function(self){
        this.elem = self;
    };

    watermark.prototype = {
        defaults : {
            texts : '此处水印文字',
            //文字水平间距
            spaceX : 80,
            //文字垂直间距
            spaceY : 55,
            //文字旋转 度数
            textRotate : -20,
            //文字颜色
            textColor : '#eaeaea',
            // textColor : '#000',
            fontFamily : 'PingFangSC-Thin',
            fontSize : '14',
            opacity: 1,
            backgroundScroll: true
        },
        options : {
        },
        init: function(options) {
             $.extend(this.options, this.defaults, options);
            var $body = $('body'),
                settings = this.options,
                txtlen = settings.texts.length;

            this.__calcTextSize($body);

            var width = settings.spaceX + settings.txts.width;
            height = settings.spaceY + settings.txts.height;

            if(RongIM.system.platform.startsWith('web-')){
                settings.textColor = '#888888';
                settings.opacity = 0.2;
            }

            var svg = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" preserveAspectRatio="none">';
            svg += '<defs>';
            svg += '<pattern id="pattern1" x="0" y="0" width="' + width + '" height="' + height * 2 + '" patternUnits="userSpaceOnUse" patternTransform="rotate(' + settings.textRotate + ')">';
            svg += '<text x="0" y="' + settings.fontSize + '" style="font-family:' + settings.fontFamily + '; font-size:' + settings.fontSize + 'px; fill:' + settings.textColor + '; fill-opacity:' + settings.opacity + ';">' + settings.texts + '</text>';
            svg += '</pattern>';

            svg += '<pattern id="pattern2" x="' + width/2 + '" y="' + height + '" width="' + width + '" height="' + height * 2 + '" patternUnits="userSpaceOnUse" patternTransform="rotate(' + settings.textRotate + ')">';
            svg += '<text x="0" y="' + settings.fontSize + '" style="font-family:' + settings.fontFamily + '; font-size:' + settings.fontSize + 'px; fill:' + settings.textColor + '; fill-opacity:' + settings.opacity + '; ">' + settings.texts + '</text>';
            svg += '</pattern>';
            svg += '</defs>';
            svg += '<rect x="0" y="0" width="100%" height="100%" style=" fill: url(#pattern1); fill-opacity:1;"/>';
            svg += '<rect x="0" y="0" width="100%" height="100%" style=" fill: url(#pattern2); fill-opacity:1;"/>';
            svg += '</svg>';

            function utf8_to_b64(str) {
                return window.btoa(unescape(encodeURIComponent(str)));
            }

            // var encoded = window.btoa(svg);
            var encoded = utf8_to_b64(svg);
            $(this.elem).css('backgroundImage', 'url(data:image/svg+xml;base64,' + encoded + ')');
            if(settings.backgroundScroll){
                $(this.elem).css('backgroundAttachment', 'local');
            }
        },
        init2: function(options) {
             $.extend(this.options, this.defaults, options);
            var $body = $('body'),
                settings = this.options,
                txtlen = settings.texts.length;

            this.__calcTextSize($body);

            var width = settings.spaceX + settings.txts.width;
            height = settings.spaceY + settings.txts.height;

            var svg = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">';
            svg += '<style type="text/css">';
            svg += 'text { fill: ' + settings.textColor + '; font-family: ' + settings.fontFamily + '; }';
            svg += '</style>';
            svg += '<defs>';

            svg += '<pattern id="authname" patternUnits="userSpaceOnUse" width="' + width + '" height="' + height * 2 + '">';
            svg += '<text y="' + settings.txts.height + '" font-size="' + settings.fontSize + '" id="firstline">' + settings.texts + '</text>';
            svg += '</pattern>';

            svg += '<pattern xlink:href="#authname">';
            svg += '<text y="' + (settings.txts.height + height) + '" x="' + width/2 + '" font-size="' + settings.fontSize + '" id="secondline">' + settings.texts + '</text>';
            svg += '</pattern>';

            svg += '<pattern id="combo" xlink:href="#authname" patternTransform="rotate(' + settings.textRotate + ')">';
            svg += '<use xlink:href="#firstline" />';
            svg += '<use xlink:href="#secondline" />';
            svg += '</pattern>';

            svg += '</defs>';
            svg += '<rect width="100%" height="100%" fill="url(#combo)" />';
            svg += '</svg>';

            function utf8_to_b64(str) {
                return window.btoa(unescape(encodeURIComponent(str)));
            }

            // var encoded = window.btoa(svg);
            var encoded = utf8_to_b64(svg);
            $(this.elem).css('backgroundImage', 'url(data:image/svg+xml;base64,' + encoded + ')');
            if(settings.backgroundScroll){
                $(this.elem).css('backgroundAttachment', 'local');
            }
        },
        init1: function(options) {
             $.extend(this.options, this.defaults, options);
            var $body = $('body'),
                settings = this.options,
                txtlen = settings.texts.length;

            this.__calcTextSize($body);

            var width = settings.spaceX + settings.txts.width;
            // width = width * 1.5;
            height = settings.spaceY + settings.txts.height;
            // height = height * 2;

            var svg = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" preserveAspectRatio="none">';
            // svg += '<linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%" spreadMethod="pad" gradientTransform="rotate(-30)">';
            // svg += '<stop offset="0%" stop-color="#fff" stop-opacity="0.1"/>';
            // svg += '<stop offset="100%" stop-color="#fff" stop-opacity="1"/>';
            // svg += '</linearGradient>';
            svg += '<defs>';
            svg += '<pattern id="pattern" x="0" y="0" width="' + width + '" height="' + height * 2 + '" patternUnits="userSpaceOnUse" patternTransform="rotate(' + settings.textRotate + ')">';
            // svg += '<text x="0" y="' + settings.fontSize + '" style="font-family:' + settings.fontFamily + '; font-size:' + settings.fontSize + 'px; fill:' + settings.textColor + '; fill-opacity:' + settings.opacity + '; stroke: #eaeaea; stroke-width: 1px;">' + settings.texts + '</text>';
            svg += '<text style="font-family:' + settings.fontFamily + '; font-size:' + settings.fontSize + 'px; fill:' + settings.textColor + '; fill-opacity:' + settings.opacity + ';">';
            svg += '<tspan x="0" y="' + settings.txts.height + '">' + settings.texts + '</tspan>';
            svg += '<tspan x="' + width/2 + '" y="' + (settings.txts.height + height) + '">' + settings.texts + '</tspan>';
            svg += '</text>';
            svg += '</pattern>';
            svg += '</defs>';
            // svg += '<rect x="0" y="0" rx="10" ry="10" width="100%" height="100%" style=" fill: url( #gradient); fill-opacity:0.3;"/>';
            svg += '<rect x="0" y="0" width="100%" height="100%" style=" fill: url( #pattern); fill-opacity:1;"/>';
            svg += '</svg>';

            function utf8_to_b64(str) {
                return window.btoa(unescape(encodeURIComponent(str)));
            }

            // var encoded = window.btoa(svg);
            var encoded = utf8_to_b64(svg);
            $(this.elem).css('backgroundImage', 'url(data:image/svg+xml;base64,' + encoded + ')');
            if(settings.backgroundScroll){
                $(this.elem).css('backgroundAttachment', 'local');
            }
        },
        __calcTextSize : function($container){
            var settings = this.options,
            text = settings.texts;

            var span = $('<span style="font-family:' + settings.fontFamily + '; font-size:' + settings.fontSize + 'px;visibility: hidden;display: inline-block;"> '+text+ '</span>')
                .appendTo($container);
            var tWidth = span[0].offsetWidth,
                tHeight = span[0].offsetHeight;
            span.remove();
            settings.txts = {
                txt : text,
                width : tWidth,
                height : tHeight
            };
        }
    };

    $.fn.watermark = function(options){
        new watermark(this).init(options);
    };

})(jQuery);
