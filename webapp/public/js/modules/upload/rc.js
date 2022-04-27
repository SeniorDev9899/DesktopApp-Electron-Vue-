(function(win) {
    function forEach(m, callback) {
        for (var key in m) {
            callback(key, m[key]);
        }
    }

    function buildUrl(url, items) {
        var query = '';
        forEach(items, function(name, value) {
            if (name != 'token') {
                query += (query ? '&' : '') + encodeURIComponent(name) + '=' + encodeURIComponent(value);
            }
        });

        if (query) {
            url += (url.indexOf('?') > 0 ? '&' : '?') + query;
        }

        return url;
    }

    var sliceStorage = localStorage;
    var Cache = (function () {
        /*
        说明：
        1: JSON.stringfy --> set --> get --> JSON.parse
        2: data format well return as set`s
        3: undefined in array will be null after stringfy+parse
        4: NS --> namespace 缩写
        */
        var keyNS = 'rong-upload-';

        function get(key) {
            /*
            legal data: "" [] {} null flase true

            illegal: undefined
                1: key not set
                2: key is cleared
                3: key removed
                4: wrong data format
            */
            key = keyNS + key;
            if(!isKeyExist(key)){
                return ;
            }

            //maybe keyNS could avoid conflict
            var val =  sliceStorage.getItem(key) || sessionStorage.getItem(key);
                val = JSON.parse(val);

            //val format check
            if (val !== null && val.hasOwnProperty('type') && val.hasOwnProperty('data')) {
                return val.data;
            }
            var illegal = null;
            return illegal;
        }

        //isPersistent
        function set(key, val, isTemp) {
            var store = sliceStorage;
            if (isTemp) {
                store = sessionStorage;
            }
            key = keyNS + key;
            var type = (typeof val);
            val = {
                data : val,
                type : type,
                updateTime: Date.now()
            };
            if(store === localStorage){
                return store[key] = JSON.stringify(val);
            }
            store.setItem(key, JSON.stringify(val));
        }

        function remove(key) {
            key = keyNS + key;
            sliceStorage.removeItem(key);
            sessionStorage.removeItem(key);
        }

        function isKeyExist(key) {
            //do not depend on value cause of ""和0
            return sliceStorage.hasOwnProperty(key) || sessionStorage.hasOwnProperty(key);
        }

        function setKeyNS(NS) {
            var isString = typeof NS === 'string';
            if (isString && NS !== '') {
                keyNS = NS;
            }
        }

        function onchange(callback) {
            callback = callback || $.noop;
            $(window).on('storage', function (e) {
                var event = e.originalEvent;
                if(isEmpty(event.key)) {
                    return;
                }
                var key = event.key.slice(keyNS.length);
                var value = get(key);
                callback(key, value);
            });
        }

        return {
            setKeyNS: setKeyNS,
            get : get,
            set : set,
            remove : remove,
            onchange: onchange
        };
    })();

    function getFormData(file, opts, name) {
        var form = new FormData();
        if (opts.unique_key) {
            form.append(opts.unique_key, name);
        }
        form.append(opts.file_data_name, file, file.name);
        for(var key in opts.multi_parmas){
            var value = opts.multi_parmas[key];
            form.append(key, value);
        }
        return form;
    }

    function ChunkUploader(){
        var offset = 0;
        this.upload = function(blob, opts, callback, isFirstChunk) {
            var that = this;
            var getUId = function(blob) {
                var key = (blob.path || blob.localPath) + '-' + blob.size + '-' + blob.lastModified + '-' + blob.uploadId;
                // return key;
                return RongIMLib.RongUtil.MD5(key).slice(8, 16);
            };
            if (isFirstChunk) {
                var uId = getUId(blob);
                var pos = Cache.get(uId);
                if (pos) {
                    blob.uniqueName = pos.sessionId;
                    offset = pos.offset;
                }
            }

            var curChunkSize = Math.min(opts.chunk_size, blob.size - offset),
                chunkBlob = blob.slice(offset, offset + curChunkSize),
                uniqueName = blob.uniqueName;

                opts.multi_parmas.name = uniqueName;
                opts.filesize = blob.size;

            var range = 'bytes=' + offset + '-' + (offset + curChunkSize);

            opts.headers = {
                'Range': range,
                'X-File-TransactionId': uniqueName,
                'X-File-Total-Size': blob.size
            };
            opts.isChunk = true;

            chunkBlob.name = blob.name;
            chunkBlob = getFormData(chunkBlob, opts, blob.uniqueName);

            uploadData(chunkBlob, opts, {
                onCompleted: function(chunkRes) {
                    offset += curChunkSize;
                    var uId = getUId(blob);
                    var sessionId = blob.uniqueName;

                    Cache.set(uId, {
                        offset: offset,
                        sessionId: sessionId
                    });
                    if (offset < blob.size) {
                        that.upload(blob, opts, callback);
                    } else {
                        offset = 0;
                        Cache.remove(uId);
                        callback.onCompleted(chunkRes);
                    }
                },
                onError: function(err) {
                    // throw new Error('qiniu uploadChunk error');
                    console.error(err);
                    callback.onError(err);
                },
                onProgress: function(chunkLoaded, total) {
                    var loaded = chunkLoaded + offset;
                    callback.onProgress(loaded, opts.filesize);
                },
                onOpen: function(xhr) {
                    callback.onOpen(xhr);
                }
            });
        };
    }

    function uploadData(data, options, callback) {
        var xhr = new XMLHttpRequest();
        //设置xhr请求的超时时间
        // xhr.timeout = options.timeout || 60000;
        if (xhr.upload && options.support_options) {
            xhr.upload.onprogress = function(event) {
                callback.onProgress(event.loaded, event.total);
            };
        }

        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
                if ((xhr.status == 204 || xhr.status == 200)) {
                    var result = xhr.responseText || '{}';
                    // console.log('onreadystatechange', xhr.getResponseHeader('Content-Range'));
                    result = JSON.parse(result);
                    console.log(options);
                    result.filename = options.multi_parmas.name;
                    callback.onCompleted(result);
                } else {
                    callback.onError('error');
                }
            }
        };
        xhr.onerror = function(error) {
            callback.onError(error);
        }
        /*
            //上传文件超时处理
            xhr.ontimeout = function(error) {
                callback.onError('timeout');
            };
        */

        xhr.onerror = function(error){
            console.log(error);
            callback.onError('error');
        };
        var url = options.domain;
        if (options.base64) {
            url += '?ext=' + (options.ext || 'png');
        }

        xhr.open(options.method, url, true);

        callback.onOpen(xhr);

        if (options.stream) {
            xhr.setRequestHeader('authorization', 'UpToken ' + options.multi_parmas.token);
        }

        forEach(options.headers, function(key, value) {
            xhr.setRequestHeader(key, value);
        });
        xhr.send(data);
    }

    function uploadQiniu(file, opts, callback) {
        if (file.size && opts.chunk_size < file.size) {
            var uniqueName = opts['genUId'](file);
            var suffix = file.name.substr(file.name.lastIndexOf('.'));
            uniqueName = uniqueName + suffix;
            file.uniqueName = uniqueName;
            opts.stream = true;
            new ChunkUploader().upload(file, opts, callback, true);
        } else {
            var data = opts['data'](file, opts);
            uploadData(data, opts, callback);
        }
    }

    function setCache(_cache) {
        sliceStorage = _cache;
    }

    win.uploadProcess = uploadQiniu;
    win.setUploadCache = setCache;
})(window);
