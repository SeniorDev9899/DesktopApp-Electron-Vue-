(function (Voip) {
'use strict';

function regListener(listenerKey, callback) {
    RongDesktop.ipcRenderer.on(listenerKey, callback);
}

function unRegListener(listenerKey, callback) {
    if (typeof callback === 'function') {
        RongDesktop.ipcRenderer.removeListener(listenerKey, callback);
    } else {
        var events = RongDesktop.ipcRenderer._events[listenerKey];
        if(events instanceof Function) {
            RongDesktop.ipcRenderer.removeListener(listenerKey, events);
        } else if(events instanceof Array) {
            events.forEach(function(event){
                RongDesktop.ipcRenderer.removeListener(listenerKey, event);
            });
        }
    }
}
/*
RongDesktop 提供的接口文档
http://gitlab.rongcloud.net/zhengyi/desktop-builder-new/wikis/home
*/
var win = {
    max: function () {
        RongDesktop.voip.window.max();
    },
    unmax: function () {
        RongDesktop.voip.window.unmax();
    },
    min: function () {
        RongDesktop.voip.window.min();
    },
    restore: function () {
        RongDesktop.voip.window.restore();
    },
    close: function () {
        window.close();
    },
    regonClose: function (callback) {
        regListener('onClose', callback);
    },
    unregonClose: function () {
        unRegListener('onClose');
    },
    setRingPos: function () {
        RongDesktop.voip.setRingPos();
        win.showInactive();
    },
    setBounds: function (params) {
        RongDesktop.voip.setBounds(params);
        win.showInactive();
    },
    focus: function () {
        RongDesktop.voip.window.focus();
    },
    showInactive: function() {
        RongDesktop.voip.window.showInactive();
    },
    show: function () {
        RongDesktop.voip.window.show();
    },
    voipLogger: function (levels, log) {
        RongDesktop.voip.voipLogger(levels, log);
    }
};
RongDesktop.voip.window.on('maximize', function () {
    if (Voip.instance) {
        Voip.instance.isMaxWin = true;
    }
});
RongDesktop.voip.window.on('unmaximize', function () {
    if (Voip.instance) {
        Voip.instance.isMaxWin = false;
    }
});

function ready() {
    RongDesktop.voip.voipReady();
}

function request(params, callback) {
    callback = callback || function(){};
    RongDesktop.voip.voipRequest(params);
    // 模拟发送命令回调
    var requestCallback = function (event, req) {
        var isCommandCallback = req.type === 'commandCallback';
        if (isCommandCallback) {
            var data = req.data;
            if (data.command === params.command) {
                callback(data.error, data.result);
                unRegListener('onIMRequest', requestCallback);
            }
        }
    };
    regListener('onIMRequest', requestCallback);
}

// window.addEventListener('keydown', function (event) {
//     if (event.ctrlKey && event.altKey && event.shiftKey && event.keyCode === 73) {
//         RongDesktop.toggleDevTools();
//     }
// });

Voip.ready = ready;

Voip.request = request;

Voip.win = win;

})(Voip);
