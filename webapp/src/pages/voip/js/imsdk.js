(function (window){

    function init(options) {
        var appkey = options.appkey;
        var navi = options.navi;
        RongIMLib.RongIMClient.init(appkey, null, {
            navi: navi,
            checkCA: false
        });
        RongIMLib.RongIMClient.setConnectionStatusListener({
            onChanged: function (state) {
                // state
                if (options.onstatuschanged) {
                    options.onstatuschanged(state);
                }
            }
        });
        RongIMLib.RongIMClient.setOnReceiveMessageListener({
            onReceived: function (message) {
                // message
                if (options.onmessagereceived) {
                    options.onmessagereceived(message);
                }
            }
        });
    }

    function connect(token, callback){
        RongIMLib.RongIMClient.connect(token, {
            onSuccess: function () {
                callback();
            },
            onTokenIncorrect: function () {
                callback('token incorrect');
            },
            onError: function () {
                callback('error');
            }
        });
    }

    window.IMSDK = {
        init: init,
        connect: connect,
    };
})(window, RongIMLib);