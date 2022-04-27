/*
* RongCallLib.js v3.1.9
* Code Version: 9853c456b3b9028396c27bd2c51536a271eb4a07
* Release Date: Tue Apr 20 2021 18:46:06 GMT+0800 (China Standard Time)
* Copyright (c) 2021- RongCloud, Inc.
*/
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.RongCallLib = factory());
}(this, (function () { 'use strict';

  var deviceEnable = {
    camera: true
  };

  var noop = function noop() {};
  var isObject = function isObject(obj) {
    return Object.prototype.toString.call(obj) === '[object Object]';
  };
  var isArray = function isArray(arr) {
    return Object.prototype.toString.call(arr) === '[object Array]';
  };
  var isUndefined = function isUndefined(str) {
    return Object.prototype.toString.call(str) === '[object Undefined]';
  };
  var ObserverList = function ObserverList() {
    var checkIndexOutBound = function checkIndexOutBound(index, bound) {
      return index > -1 && index < bound;
    };

    this.observerList = [];

    this.add = function (observer, force) {
      force && (this.observerList.length = 0);
      this.observerList.push(observer);
    };

    this.get = function (index) {
      if (checkIndexOutBound(index, this.observerList.length)) {
        return this.observerList[index];
      }
    };

    this.count = function () {
      return this.observerList.length;
    };

    this.removeAt = function (index) {
      checkIndexOutBound(index, this.observerList.length) && this.observerList.splice(index, 1);
    };

    this.remove = function (observer) {
      if (!observer) {
        this.observerList.length = 0;
        return;
      }
      observer = Object.prototype.toString.call(observer) == '[object Function]' ? [observer] : observer;
      for (var i = 0, len = this.observerList.length; i < len; i++) {
        if (this.observerList[i] === observer[i]) {
          this.removeAt(i);
          break;
        }
      }
    };

    this.notify = function (val) {
      for (var i = 0, len = this.observerList.length; i < len; i++) {
        this.observerList[i](val);
      }
    };

    this.indexOf = function (observer, startIndex) {
      var i = startIndex || 0,
          len = this.observerList.length;
      while (i < len) {
        if (this.observerList[i] === observer) {
          return i;
        }
        i++;
      }
      return -1;
    };
  };

  var cache = function cache() {
    var session = {};

    var set = function set(key, value) {
      session[key] = value;
    };

    var get = function get(key) {
      return session[key];
    };

    var remove = function remove(key) {
      delete session[key];
    };

    var update = function update(key, value) {
      set(key, value);
    };

    var clear = function clear() {
      session = {};
    };
    return {
      set: set,
      get: get,
      update: update,
      remove: remove,
      clear: clear
    };
  };

  var forEach = function forEach(arrs, callback) {
    callback = callback || noop;
    var forObj = function forObj() {
      for (var key in arrs) {
        callback(arrs[key], key, arrs);
      }
    };
    var forArrs = function forArrs() {
      for (var i = 0; i < arrs.length; i++) {
        callback(arrs[i], i, arrs);
      }
    };
    var isArr = isArray(arrs);
    var exec = isArr ? forArrs : forObj;
    exec();
  };

  var extend = function extend(target, source) {
    for (var key in source) {
      target[key] = source[key];
    }
    return target;
  };

  var isNumber = function isNumber(num) {
    return Object.prototype.toString.call(num) == '[object Number]';
  };

  var array2Obj = function array2Obj(arrs) {
    var obj = {};
    forEach(arrs, function (item) {
      obj[item] = item;
    });
    return obj;
  };

  var filter = function filter(item, event) {
    if (isArray(item)) {
      var newArr = [];
      forEach(item, function (val) {
        if (event(val)) {
          newArr.push(val);
        }
      });
      return newArr;
    }
    if (isObject(item)) {
      var newItems = {};
      forEach(item, function (val, key) {
        if (event(val)) {
          newItems[key] = val;
        }
      });
      return newItems;
    }
  };

  var getBrowser = function getBrowser() {
    var userAgent = navigator.userAgent;
    var version;
    var type;

    /* 记录各浏览器名字和匹配条件 */
    var condition = {
      IE: /rv:([\d.]+)\) like Gecko|MSIE ([\d.]+)/,
      Edge: /Edge\/([\d.]+)/,
      Firefox: /Firefox\/([\d.]+)/,
      Opera: /(?:OPERA|OPR).([\d.]+)/,
      WeChat: /MicroMessenger/i,
      QQBrowser: /QQBrowser\/([\d.]+)/,
      Chrome: /Chrome\/([\d.]+)/,
      Safari: /Version\/([\d.]+).*Safari/,
      iOSChrome: /Mobile\/([\d.]+).*Safari/
    };

    for (var key in condition) {
      if (!condition.hasOwnProperty(key)) continue;
      var browserContent;
      if (browserContent = userAgent.match(condition[key])) {
        type = key;
        version = browserContent[1] || browserContent[2];
        break;
      }
    }
    return {
      type: type ? type : 'UnKonw',
      version: version ? version : 'UnKonw'
    };
  };

  var isSupportedBrowser = function isSupportedBrowser() {
    var browser = getBrowser();
    var browserType = browser.type;
    var supportList = ['Chrome', 'Safari', 'IE'];
    return supportList.indexOf(browserType) !== -1;
  };

  var isSupportedPlatform = function isSupportedPlatform() {
    var userAgentInfo = navigator.userAgent;
    var Agents = ['Android', 'iPhone', 'SymbianOS', 'Windows Phone', 'iPad', 'iPod'];
    var flag = true;
    for (var v = 0; v < Agents.length; v++) {
      if (userAgentInfo.indexOf(Agents[v]) > 0) {
        flag = false;
        break;
      }
    }
    return flag;
  };

  var isSupportedProtocol = function isSupportedProtocol() {
    var hostname = location.hostname,
        protocol = location.protocol;
    var browser = getBrowser();
    if (browser.type === 'IE') {
      return true;
    }
    return hostname === 'localhost' || hostname === '127.0.0.1' || protocol.indexOf('https') !== -1;
  };

  var getVideoAudioStream = function getVideoAudioStream(_ref) {
    var width = _ref.width,
        height = _ref.height,
        audioDeviceId = _ref.audioDeviceId,
        videoDeviceId = _ref.videoDeviceId;

    var audio = audioDeviceId ? { deviceId: audioDeviceId } : true,
        isNeedVideoDevice = !!videoDeviceId,
        isNeedResolution = width && height;
    var video = true;
    if (isNeedResolution || isNeedVideoDevice) {
      video = filter({
        width: width,
        height: height,
        deviceId: videoDeviceId
      }, function (val) {
        return !isUndefined(val);
      });
    }
    return navigator.mediaDevices.getUserMedia({ video: video, audio: audio }).then(function (mediaStream) {
      return mediaStream;
    }, function () {
      return navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    }).then(function (mediaStream) {
      return mediaStream;
    }, function () {
      return navigator.mediaDevices.getUserMedia({ video: false, audio: true });
    });
  };

  var getAudioStream = function getAudioStream(_ref2) {
    var audioDeviceId = _ref2.audioDeviceId;

    var audio = audioDeviceId ? { deviceId: audioDeviceId } : true;
    return navigator.mediaDevices.getUserMedia({ video: false, audio: audio }).then(function (mediaStream) {
      var videoTracks = mediaStream.getVideoTracks();
      for (var i = 0, max = videoTracks.length; i < max; i++) {
        videoTracks[i].enabled = false;
      }
      return Promise.resolve(mediaStream);
    }, function () {
      deviceEnable.camera = false;
      return navigator.mediaDevices.getUserMedia({ video: false, audio: true });
    });
  };

  var string10to64 = function string10to64(number) {
    var chars = '0123456789abcdefghigklmnopqrstuvwxyzABCDEFGHIGKLMNOPQRSTUVWXYZa0'.split(''),
        radix = chars.length + 1,
        qutient = +number,
        arr = [];
    do {
      var mod = qutient % radix;
      qutient = (qutient - mod) / radix;
      arr.unshift(chars[mod]);
    } while (qutient);
    return arr.join('');
  };

  var getUUID = function getUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0,
          v = c == 'x' ? r : r & 0x3 | 0x8;
      return v.toString(16);
    });
  };

  var getUUID22 = function getUUID22() {
    var uuid = getUUID();
    uuid = uuid.replace(/-/g, '') + 'a';
    uuid = parseInt(uuid, 16);
    uuid = string10to64(uuid);
    if (uuid.length > 22) {
      uuid = uuid.slice(0, 22);
    }
    if (uuid.length < 22) {
      var len = 22 - uuid.length;
      for (var i = 0; i < len; i++) {
        uuid = uuid + '0';
      }
    }
    return uuid;
  };

  var util = {
    noop: noop,
    ObserverList: ObserverList,
    cache: cache,
    forEach: forEach,
    extend: extend,
    array2Obj: array2Obj,
    isNumber: isNumber,
    isArray: isArray,
    isObject: isObject,
    isSupportedBrowser: isSupportedBrowser,
    isSupportedPlatform: isSupportedPlatform,
    isSupportedProtocol: isSupportedProtocol,
    console: console,
    getVideoAudioStream: getVideoAudioStream,
    getAudioStream: getAudioStream,
    deviceEnable: deviceEnable,
    getUUID22: getUUID22
  };

  var RongIMLib = void 0;
  var RongRTC = void 0;

  var getRongIMLib = function getRongIMLib() {
    return RongIMLib;
  };

  var setRongIMLib = function setRongIMLib(lib) {
    RongIMLib = lib;
  };

  var getRongRTC = function getRongRTC() {
    return RongRTC;
  };

  var setRongRTC = function setRongRTC(lib) {
    RongRTC = lib;
  };

  var modules = {
    getRongIMLib: getRongIMLib,
    setRongIMLib: setRongIMLib,
    getRongRTC: getRongRTC,
    setRongRTC: setRongRTC
  };

  var Reason = {
    CANCEL1: {
      code: 1,
      info: 'Self side cancelled outgoing calling request'
    },
    REJECT2: {
      code: 2,
      info: 'Self side refused incomming calling request'
    },
    HANGUP3: {
      code: 3,
      info: 'Self side hung up'
    },
    BUSYLINE4: {
      code: 4,
      info: 'Self side is busy'
    },
    NO_RESPONSE5: {
      code: 5,
      info: 'Self side did not answered the call'
    },
    ENGINE_UN_SUPPORTED6: {
      code: 6,
      info: 'Current engine is not supported by self side'
    },
    NETWORK_ERROR7: {
      code: 7,
      info: 'Network exception on self side'
    },
    OTHER_CLIENT_HANDLED8: {
      code: 8,
      info: 'Request was handled on other device'
    },
    REMOTE_CANCEL11: {
      code: 11,
      info: 'Peer side cancelled calling request'
    },
    REMOTE_REJECT12: {
      code: 12,
      info: 'Peer side refused calling request'
    },
    REMOTE_HANGUP13: {
      code: 13,
      info: 'Peer side hung up during call'
    },
    REMOTE_BUSYLINE14: {
      code: 14,
      info: 'Peer side is busy'
    },
    REMOTE_NO_RESPONSE15: {
      code: 15,
      info: 'Peer side did not answered the call'
    },
    REMOTE_ENGINE_UN_SUPPORTED16: {
      code: 16,
      info: 'Current engine is not supported by peer side'
    },
    REMOTE_NETWORK_ERROR17: {
      code: 17,
      info: 'Network exception on peer side'
    },
    VOIP_NOT_AVALIABLE18: {
      code: 18,
      info: 'VoIP is not avaliable'
    },
    DEVICE_ERROR: {
      code: 19,
      info: 'Failed to access microphone or camera'
    }
  };

  var CallStatus = {
    //初始状态
    CallIdle: 0,

    //正在呼出
    Dialing: 1,

    //正在呼入
    Incoming: 2,

    //收到一个通话呼入后，正在振铃
    Ringing: 3,

    //正在通话
    Active: 4,

    //已经挂断
    Hangup: 5
  };

  var VoIPMediaType = {
    MEDIA_AUDIO: 1,
    MEDIA_VEDIO: 2,
    '1': 'MEDIA_AUDIO',
    '2': 'MEDIA_VEDIO'
  };

  var StorageType = {
    ROOM: 1,
    USER: 2,
    INNERUSER: 3
  };

  var Enum = {
    Reason: Reason,
    CallStatus: CallStatus,
    VoIPMediaType: VoIPMediaType,
    StorageType: StorageType
  };

  var VoIPMediaType$1 = Enum.VoIPMediaType;

  var Reason$1 = Enum.Reason;

  var TalkType = {
    OnlyAudio: 0,
    All: 1,
    OnlyVideo: 2,
    None: 3
  };

  var Tag = 'RongCloudRTC';

  var selfUserId = void 0;
  var rongRTC = void 0,
      rongRTCRoom = void 0,
      rongRTCStream = void 0,
      rongRTCStorage = void 0;
  var joinRoomCallback = util.noop;
  var isRTCRoomJoined = false;

  var VIDEO_PROFILE = {
    VIDEO_PROFILE_240P: {
      width: 320,
      height: 240
    },
    VIDEO_PROFILE_480P: {
      width: 640,
      height: 480
    },
    VIDEO_PROFILE_720P: {
      width: 1280,
      height: 720
    }
  };

  var config = {};

  var getRTCPeer = function getRTCPeer() {
    if (!rongRTC) {
      throw new Error('Not call yet, please call first.');
    }
    return rongRTC;
  };

  var getTalkType = function getTalkType(videoEnable, audioEnable) {
    var type = void 0;
    if (videoEnable && audioEnable) {
      type = TalkType.All;
    } else if (videoEnable) {
      type = TalkType.OnlyVideo;
    } else if (audioEnable) {
      type = TalkType.OnlyAudio;
    } else {
      type = TalkType.None;
    }
    return type;
  };

  var setVideoProfile = function setVideoProfile(profile) {
    var videoProfile = VIDEO_PROFILE[profile] || VIDEO_PROFILE.VIDEO_PROFILE_480P;
    util.extend(config, videoProfile);
  };

  /*  deviceOption: { audioDeviceId, videoDeviceId } */
  var setMediaDevice = function setMediaDevice(deviceOption) {
    util.extend(config, deviceOption);
  };

  var createVideo = function createVideo(src, id) {
    var video = document.createElement('video');
    video.id = id;
    video.autoplay = true;
    video.controls = false;
    video.srcObject = src;
    return video;
  };

  var getId = function getId(id) {
    /*  id = id || 'local';
    let prefix = 'native-';*/
    return (/*prefix + */id
    );
  };

  /**
   * @param  {object} data
   * @param  {object} data.id 用户 id
   * @param  {object} data.stream
   * @param  {object} data.stream.type 媒体流状态
   * @param  {object} data.stream.mediaStream 媒体流
   */
  var addStream = function addStream(data) {
    var userId = data.id;
    var stream = data.stream;

    var isLocal = userId === selfUserId;
    var video = void 0,
        talkType = void 0,
        tag = void 0;
    if (stream) {
      var enable = stream.enable;
      var mediaStream = stream.mediaStream;

      var videoId = getId(userId);
      video = createVideo(mediaStream, videoId);
      talkType = getTalkType(enable.video, enable.audio);
      video.muted = userId === selfUserId;
      video.setAttribute('userid', userId);
      tag = stream.tag;
    }
    var result = {
      type: 'added',
      data: video,
      talkType: talkType,
      isLocal: isLocal,
      tag: tag
    };
    joinRoomCallback(null, result);
  };

  var addIEStream = function addIEStream(data) {
    var userId = data.id,
        stream = data.stream,
        _stream$enable = stream.enable,
        video = _stream$enable.video,
        audio = _stream$enable.audio,
        tag = stream.tag,
        isLocal = userId === selfUserId;

    var talkType = getTalkType(video, audio);
    var result = {
      type: 'added',
      talkType: talkType,
      isLocal: isLocal,
      tag: tag
    };
    joinRoomCallback(null, result);
  };

  var streamPublished = function streamPublished(user) {
    if (!isRTCRoomJoined) {
      return;
    }
    var StreamSize = rongRTC.StreamSize;
    user.stream.size = StreamSize.MAX;
    rongRTCStream.subscribe(user).then(function (user) {
      config.isIE ? addIEStream(user) : addStream(user);
    }, function (error) {
      console.error(error);
      joinRoomCallback('stream subscribe error');
    });
  };

  var removeUser = function removeUser(user) {
    user = user || {};
    var result = {
      type: 'removed',
      data: user.id,
      userId: user.id,
      isLocal: false
    };
    joinRoomCallback(null, result);
  };

  var getSelfStream = function getSelfStream(mediaType, callback) {
    var StreamType = rongRTC.StreamType;

    var type = mediaType === VoIPMediaType$1.MEDIA_AUDIO ? StreamType.AUDIO : StreamType.AUDIO_AND_VIDEO;
    var user = {
      id: selfUserId
    };
    var videoEnable = mediaType === VoIPMediaType$1.MEDIA_VEDIO;

    // let videoConfig = true;
    // if (config.width && config.height) {
    //   videoConfig = {
    //     width: config.width,
    //     height: config.height
    //   };
    // }
    var getStreamFunc = videoEnable ? util.getVideoAudioStream : util.getAudioStream;
    return getStreamFunc(config).then(function (mediaStream) {
      user.stream = {
        mediaStream: mediaStream,
        type: type,
        tag: Tag
      };
      callback(null, user);
    }).catch(function () {
      callback(null, user);
    });
  };

  var publishIERTC = function publishIERTC(params) {
    var mediaType = params.mediaType;
    var StreamType = rongRTC.StreamType;

    var type = mediaType === VoIPMediaType$1.MEDIA_AUDIO ? StreamType.AUDIO : StreamType.AUDIO_AND_VIDEO;
    var user = {
      id: selfUserId,
      stream: {
        tag: Tag,
        type: type,
        enable: {
          video: mediaType !== VoIPMediaType$1.MEDIA_AUDIO,
          audio: true
        }
      }
    };
    rongRTCStream.publish(user).then(function () {}).catch(function (error) {
      console.error('publish self stream error', error);
    });
    addIEStream(user);
  };

  var publishRTC = function publishRTC(params) {
    // const StreamType = rongRTC.StreamType;
    var video = rongRTCStream.video;
    getSelfStream(params.mediaType, function (err, result) {
      if (err) {
        return joinRoomCallback(Reason$1.DEVICE_ERROR.code, Reason$1.DEVICE_ERROR.info);
      }
      result.isLocal = true;
      if (result.stream) {
        rongRTCStream.publish(result).then(function () {
          if (params.mediaType === VoIPMediaType$1.MEDIA_AUDIO) {
            video.disable({
              id: selfUserId,
              stream: {
                tag: Tag
              }
            });
          }
        }, function (error) {
          console.error('publish self stream error', error);
        });
        result.stream.enable = {
          video: params.mediaType !== VoIPMediaType$1.MEDIA_AUDIO,
          audio: true
        };
      } else {
        console.error('Microphone and camera not captured, Can\'t get your own stream');
      }
      addStream(result);
    });
  };

  var observeRoom = function observeRoom(roomId) {
    rongRTCRoom = new rongRTC.Room({
      id: roomId,
      // joined: , // 其他人加入不处理, 已通过消息处理
      left: removeUser
    });
  };

  var observeStream = function observeStream() {
    rongRTCStream = new rongRTC.Stream({
      published: streamPublished
      // unpublished: '', 对方取消推流, 不处理, calllib 只有退出, 没有取消
      // disabled: '',  资源改变, 不处理, 已通过消息处理
      // enabled: '',
      // muted: '',
      // unmuted: ''
    });
    return rongRTCStream;
  };

  // const observeScreenShare = () => {
  //   let { ScreenShare } = rongRTC;
  //   let observer = new Observer((mutation) => {
  //     let { type } = mutation;
  //     if (type === 'finished') {
  //       // TODO onShareComplete
  //     }
  //   });
  //   observer.observe(ScreenShare, {
  //     finished: true
  //   });
  // };

  var initRTC = function initRTC(params) {
    observeRoom(params.channelId);
  };

  var setConfig = function setConfig(cfg) {
    util.extend(config, cfg);
    if (cfg.engineId) {
      config.isIE = true;
    }
    var RongRTC = modules.getRongRTC();
    var RongIMLib = modules.getRongIMLib();
    rongRTC = new RongRTC({
      id: config.engineId,
      RongIMLib: RongIMLib,
      mode: RongRTC.RTC,
      error: function error(_error) {
        joinRoomCallback(null, {
          type: 'error',
          error: _error
        });
      }
    });
    rongRTCStorage = new rongRTC.Storage({ type: Enum.StorageType.INNERUSER });
    observeStream();
    return rongRTCStream;
  };

  var joinRoom = function joinRoom(params, callback) {
    joinRoomCallback = callback || util.noop;
    selfUserId = params.userId;
    initRTC(params);
    var room = {
      id: selfUserId,
      token: selfUserId
    };
    rongRTCRoom.join(room).then(function () {
      isRTCRoomJoined = true;
      rongRTCStorage.__innerSet('role', params.role);
      config.isIE ? publishIERTC(params) : publishRTC(params);
    }, function (err) {
      console.log('join room error', err);
      joinRoomCallback('join error.');
    });
  };

  var quitRoom = function quitRoom(config, callback) {
    callback = callback || util.noop;
    if (!rongRTC || !rongRTCRoom) {
      return callback();
    }
    rongRTCRoom.leave().then(function () {
      isRTCRoomJoined = false;
      joinRoomCallback(null, {
        type: 'leave'
      });
      callback();
    }, function () {
      callback();
      joinRoomCallback('leave error.');
    });
  };

  var enableAudio = function enableAudio(params) {
    var isMute = !params.isEnabled;
    var Audio = rongRTCStream.audio;
    var audioFuc = isMute ? Audio.mute : Audio.unmute;
    audioFuc({
      id: selfUserId,
      stream: {
        tag: Tag
      }
    });
  };

  var enableVideo = function enableVideo(params) {
    var isClosed = !params.isEnabled;
    var Video = rongRTCStream.video;
    var videoFuc = isClosed ? Video.disable : Video.enable;
    videoFuc({
      id: selfUserId,
      stream: {
        tag: Tag
      }
    });
  };

  var startScreenShare = function startScreenShare() {
    var ScreenShare = rongRTC.ScreenShare;
    ScreenShare.start().then(function () {}, function () {
      joinRoomCallback('screenshare error.');
    });
  };

  var stopScreenShare = function stopScreenShare() {
    var ScreenShare = rongRTC.ScreenShare;
    ScreenShare.stop();
  };

  var getMediaID = function getMediaID(params) {
    var sentTime = params.sentTime;
    return String(sentTime & 0x7fffffff); //ios o只支持string 类型
  };

  var requestWhiteBoardURL = function requestWhiteBoardURL() {
    var WhiteBoard = rongRTC.WhiteBoard;
    WhiteBoard.create().then(function (whiteboard) {
      if (whiteboard.url) {
        var result = {
          index: 'meet',
          type: 'whiteBoardURL',
          url: whiteboard.url
        };
        joinRoomCallback(result);
      } else {
        joinRoomCallback('request whiteboard error.');
      }
    });
  };

  var getSessionId = function getSessionId() {
    return rongRTCRoom ? rongRTCRoom.getSessionId() : null;
  };

  var RongVoIP = {
    setConfig: setConfig,
    joinRoom: joinRoom,
    quitRoom: quitRoom,
    enableAudio: enableAudio,
    enableVideo: enableVideo,
    getMediaID: getMediaID,
    startScreenShare: startScreenShare,
    stopScreenShare: stopScreenShare,
    requestWhiteBoardURL: requestWhiteBoardURL,
    setVideoProfile: setVideoProfile,
    setMediaDevice: setMediaDevice,
    getRTCPeer: getRTCPeer,
    getSessionId: getSessionId
  };

  var imAdapt = (function (RongIMLib) {
    var isIMV3 = RongIMLib.SDK_VERSION;

    if (isIMV3) {
      var CallLibMsgTypes = ['RC:VCAccept', 'RC:VCRinging', 'RC:VCSummary', 'RC:VCHangup', 'RC:VCInvite', 'RC:VCModifyMedia', 'RC:VCModifyMem'];
      var MessageTypeMap = {
        AcceptMessage: 'RC:VCAccept',
        RingingMessage: 'RC:VCRinging',
        SummaryMessage: 'RC:VCSummary',
        HungupMessage: 'RC:VCHangup',
        InviteMessage: 'RC:VCInvite',
        MediaModifyMessage: 'RC:VCModifyMedia',
        MemberModifyMessage: 'RC:VCModifyMem'
      };
      var adaptMessage = function adaptMessage(message) {
        var messageType = message.messageType;

        message.offLineMessage = message.isOffLineMessage;
        message.conversationType = message.type;
        for (var key in MessageTypeMap) {
          var val = MessageTypeMap[key];
          if (val === messageType) {
            message.messageType = key;
          }
        }
        return message;
      };
      return {
        callMessageWatch: function callMessageWatch(event) {
          var im = RongIMLib.getInstance();
          if (!im.rtcInnerWatch) {
            throw new Error('Please upgrade RongIMLib');
          }
          im.rtcInnerWatch({
            message: function message(_ref) {
              var _message = _ref.message;

              if (CallLibMsgTypes.indexOf(_message.messageType) !== -1) {
                _message = adaptMessage(_message);
                event(_message);
              }
            }
          });
        },
        getCurrentUserId: function getCurrentUserId() {
          var im = RongIMLib.getInstance();
          return im.getConnectionUserId();
        },
        sendMessage: function sendMessage(params, callback) {
          var conversationType = params.conversationType,
              targetId = params.targetId,
              content = params.content,
              messageType = params.messageType,
              pushText = params.pushText,
              appData = params.appData,
              userIds = params.userIds;

          var im = RongIMLib.getInstance();
          return im.Conversation.get({
            type: conversationType,
            targetId: targetId
          }).send({
            content: content,
            messageType: MessageTypeMap[messageType],
            pushContent: pushText,
            pushData: appData,
            directionalUserIdList: userIds
          }).then(function (message) {
            message = adaptMessage(message);
            callback(null, message);
          }).catch(function (_ref2) {
            var code = _ref2.code;

            callback(code);
          });
        }
      };
    } else {
      var messageFactory = function messageFactory(params) {
        var messageTypes = {
          AcceptMessage: RongIMLib.AcceptMessage,
          RingingMessage: RongIMLib.RingingMessage,
          SummaryMessage: RongIMLib.SummaryMessage,
          HungupMessage: RongIMLib.HungupMessage,
          InviteMessage: RongIMLib.InviteMessage,
          MediaModifyMessage: RongIMLib.MediaModifyMessage,
          MemberModifyMessage: RongIMLib.MemberModifyMessage
        };
        var content = params.content;
        var message = messageTypes[params.messageType] || function () {};
        return new message(content);
      };
      return {
        callMessageWatch: function callMessageWatch(event) {
          RongIMLib.RongIMClient._voipProvider = {
            onReceived: event
          };
        },
        getCurrentUserId: function getCurrentUserId() {
          return RongIMLib.RongIMClient.getInstance().getCurrentUserId();
        },
        sendMessage: function sendMessage(params, callback) {
          callback = callback || function () {};

          var msg = messageFactory(params);

          var conversationType = params.conversationType;
          var targetId = params.targetId;
          var channelId = params.channelId;

          var im = channelId ? RongIMLib.RongIMClient.getInstance().getChannel(channelId) : RongIMLib.RongIMClient.getInstance();

          var isMentioned = false;
          var pushText = params.pushText || '';
          var appData = params.appData || '';
          var methodType = null;
          // console.log('im.sendMessage', msg);
          im.sendMessage(conversationType, targetId, msg, {
            onSuccess: function onSuccess(message) {
              callback(null, message);
            },
            onError: function onError(code) {
              callback(code);
            }
          }, isMentioned, pushText, appData, methodType, params);
        }
      };
    }
  });

  var PUSH_TITLE = {
    audio: '您有一条音频通话',
    video: '您有一条视频通话'
  };

  var zh = {
    PUSH_TITLE: PUSH_TITLE
  };

  var PUSH_TITLE$1 = {
    audio: 'You have a voice call',
    video: 'You have a video call'
  };

  var en = {
    PUSH_TITLE: PUSH_TITLE$1
  };

  /**
   * 语言包
  */
  var language = {
    zh: zh,
    en: en
  };

  /**
   * 设置 CallLib 全局提示语言
   * @param {string} lan 'zh' 中文、'en' 英文、'ar' 阿拉伯语
  */
  var locale = {
    lang: zh,
    set: function set(lang) {
      locale.lang = language[lang] || zh;
    }
  };

  var MsgObserverList = util.ObserverList;

  // patch c++ SDK 多端时发送一条消息，会再收到一条同样 messageUId 的消息这里记录一下做排除
  var cacheMessageUIdList = [];
  var MAXCACHE = 500;

  var getIMPeer = function getIMPeer() {
    return imAdapt(modules.getRongIMLib());
  };

  var getCurrentUserId = function getCurrentUserId() {
    var RongIM = getIMPeer();
    if (!RongIM) {
      console.error('Missing RongIMLib, please pass in RongIMLib in init');
      return '';
    }
    var currentUserId = RongIM.getCurrentUserId();
    if (!currentUserId) {
      console.error('Please connect im first');
      return '';
    }
    return currentUserId;
  };

  /*
    根据 MessageType 返回 message 对象
    let params = {
        messageType:'TextMessage',
        content: { content: 'hello'}    // 消息体
    };
  let textMsg = messageFactory(params);
  */

  var sendMessage = function sendMessage(params, callback, userIds) {
    var RongIM = getIMPeer();
    callback = callback || util.noop;

    // memberModify 中 inviteUserIds 只包含被邀请人，不能作为定向消息参数
    params.userIds = userIds || params.inviteUserIds;

    RongIM.sendMessage(params, function (err, message) {
      if (err) {
        callback(err);
      } else {
        cacheMessageUIdList.unshift(message.messageUId);
        if (cacheMessageUIdList.length > MAXCACHE) {
          cacheMessageUIdList.pop();
        }
        callback(err, message);
      }
    }, userIds);
  };

  var commandItem = {
    /*
        params.conversationType
        params.targetId
        params.content
        */
    invite: function invite(params, callback) {
      params.messageType = 'InviteMessage';

      var content = params.content;

      var mediaType = content.mediaType;
      var inviteUserIds = content.inviteUserIds;
      var callId = content.callId;

      var appData = {
        mediaType: mediaType,
        userIdList: inviteUserIds,
        callId: callId
      };

      // TODO 中文抛出
      var pushItem = {
        1: locale.lang.PUSH_TITLE.audio,
        2: locale.lang.PUSH_TITLE.video
      };
      params.pushText = pushItem[mediaType];
      params.appData = JSON.stringify(appData);
      params.userIds = inviteUserIds;
      sendMessage(params, callback);
    },
    ringing: function ringing(params, callback) {
      params.messageType = 'RingingMessage';
      sendMessage(params, callback);
    },
    /*
        params.conversationType
        params.targetId
        params.content
        */
    accept: function accept(params, callback, userIds) {
      params.messageType = 'AcceptMessage';
      sendMessage(params, callback, userIds);
    },

    /*
       params.conversationType
       params.targetId
       params.content
       */
    hungup: function hungup(params, callback, userIds) {
      params.messageType = 'HungupMessage';
      /**
       * 挂断添加 pushData 
       * 处理：PC 发起又立即挂断动作在 iOS 未连接成功 IM 时间差内，无法处理问题
      */
      var callId = params.content.callId;
      var reason = params.content.reason;
      var appData = {
        callId: callId,
        reason: reason
      };
      params.appData = JSON.stringify(appData);
      sendMessage(params, callback, userIds);
    },
    /*
        params.conversationType
        params.targetId
        params.content
        */
    mediaModify: function mediaModify(params, callback) {
      params.messageType = 'MediaModifyMessage';
      sendMessage(params, callback);
    },
    memberModify: function memberModify(params, callback) {
      params.messageType = 'MemberModifyMessage';
      var content = params.content;
      var userIds = [];
      var inviteUserIds = content.inviteUserIds;
      var existList = content.existedMemberStatusList;

      var crtUserId = getCurrentUserId();

      util.forEach(inviteUserIds, function (userId) {
        userId !== crtUserId && userIds.push(userId);
      });
      util.forEach(existList, function (user) {
        var userId = user.userId;
        userId !== crtUserId && userIds.push(userId);
      });

      params.userIds = userIds;
      sendMessage(params, callback, userIds);
    },
    getToken: function getToken(params, callback) {
      // const RongIMLib = getIMPeer();
      // let im = RongIMLib.RongIMClient.getInstance();
      // let engineType = 3;
      // let channelId = params.channelId;
      callback(null, '');
      // im.getAgoraDynamicKey(engineType, channelId, {
      //   onSuccess: function (data) {
      //     let error = null;
      //     callback(error, data.dynamicKey);
      //   },
      //   onError: function (error) {
      //     callback(error);
      //   }
      // });

      // let uid = params.userId & 0x7fffffff;
      // let url = 'https://api.blinktalk.site:8800/token';
      // $.ajax({
      //     url : url,
      //     type : 'POST',
      //     data : 'uid=' + uid + '&appid=1234567890abcdefg',
      //     async : true,
      //     success : function(data) {
      //         let error = null;
      //         callback(error, data);
      //     },
      //     error : function(error) {
      //         callback(error);
      //     }
      // });
    }
  };
  /*
  let params = {
      command: 'invite' | 'ringing' | 'accept' | 'hungup' | 'mediaModify' | 'memberModify' | 'getToken',
      data: {
          conversationType: 1,
          targetId: '',
          content: {}
      }
  };
  */
  var sendCommand = function sendCommand(params, callback, userIds) {
    var command = params.command;
    var data = params.data;
    commandItem[command] && commandItem[command](data, callback, userIds);
  };

  var watcher = new MsgObserverList();

  var watch = function watch(listener) {
    watcher.add(listener);
  };

  var setVoipProvider = function setVoipProvider() {
    var RongIM = getIMPeer();
    // WebSDK VoIP message adapter.
    RongIM.callMessageWatch(function (message) {
      var isSelfClientSendMessage = cacheMessageUIdList.indexOf(message.messageUId) > -1;
      if (message.offLineMessage || isSelfClientSendMessage) {
        return;
      }
      watcher.notify(message);
    });
  };

  var MessageCtrl = {
    sendCommand: sendCommand,
    watch: watch,
    setVoipProvider: setVoipProvider,
    getCurrentUserId: getCurrentUserId
  };

  var classCallCheck = function (instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  };

  var toConsumableArray = function (arr) {
    if (Array.isArray(arr)) {
      for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

      return arr2;
    } else {
      return Array.from(arr);
    }
  };

  var EnumReason = Enum.Reason;

  var joinRoom$1 = RongVoIP.joinRoom;
  var quitRoom$1 = RongVoIP.quitRoom;
  var enableAudio$1 = RongVoIP.enableAudio;
  var enableVideo$1 = RongVoIP.enableVideo;
  var getMediaID$1 = RongVoIP.getMediaID;

  var sendCommand$1 = MessageCtrl.sendCommand;
  var getCurrentUserId$1 = MessageCtrl.getCurrentUserId;

  var cache$1 = util.cache();

  var ObserverList$1 = util.ObserverList;

  var videoWatcher = new ObserverList$1();
  var meetCommandWatcher = new ObserverList$1();
  var commandWatcher = new ObserverList$1();
  var msgWatcher = new ObserverList$1();

  var config$1 = {
    url: 'https://rtcapi.ronghub.com/nav/websocketlist',
    timeout: 10000 * 3,
    ices: [{
      urls: 'turn:119.254.101.80:3478',
      credential: 'test',
      username: 'test'
    }]
  };

  cache$1.set('videoQueue', {});

  var callTimer = {};
  var cacheInviteMessages = {};

  var MessgeDirection = {
    SENT: 1,
    RECEIVED: 2
  };

  var getSendExtraParams = function getSendExtraParams(params) {
    var extraParamNames = ['extra'];
    var contents = {};
    extraParamNames.forEach(function (name) {
      contents[name] = params[name];
    });
    return contents;
  };

  var stopItem = {
    single: function single(message) {
      var senderUserId = message.senderUserId;
      var timer = callTimer[senderUserId];
      timer && timer.stop();
    },
    multi: function multi() {
      util.forEach(callTimer, function (timer, userId) {
        timer && timer.stop();
        delete callTimer[userId];
      });
      cache$1.remove('inviteUsers');
    }
  };

  var CallStatus$1 = {
    //初始状态
    CallIdle: 0,

    //正在呼出
    Dialing: 1,

    //正在呼入
    Incoming: 2,

    //收到一个通话呼入后，正在振铃
    Ringing: 3,

    //正在通话
    Active: 4,

    //已经挂断
    Hangup: 5
  };

  var Reason$2 = function () {
    // key ：用描述和错误码组成，方便通过错错误码或者描述获取
    var result = {
      CANCEL1: {
        code: 1,
        // 己方取消已发出的通话请求
        info: 'Self side cancelled outgoing calling request'
      },
      REJECT2: {
        code: 2,
        // 己方拒绝收到的通话请求
        info: 'Self side refused incomming calling request'
      },
      HANGUP3: {
        code: 3,
        // 己方挂断
        info: 'Self side hung up'
      },
      BUSYLINE4: {
        code: 4,
        // 己方忙碌
        info: 'Self side is busy'
      },
      NO_RESPONSE5: {
        code: 5,
        // 己方未接听
        info: 'Self side did not answered the call'
      },
      ENGINE_UN_SUPPORTED6: {
        code: 6,
        // 己方不支持当前引擎
        info: 'Current engine is not supported by self side'
      },
      NETWORK_ERROR7: {
        code: 7,
        // 己方网络出错
        info: 'Network exception on self side'
      },
      OTHER_CLIENT_HANDLED8: {
        code: 8,
        // 其他设备已处理
        info: 'Request was handled on other device'
      },
      REMOTE_CANCEL11: {
        code: 11,
        // 对方取消已发出的通话请求
        info: 'Peer side cancelled calling request'
      },
      REMOTE_REJECT12: {
        code: 12,
        // 对方拒绝收到的通话请求
        info: 'Peer side refused calling request'
      },
      REMOTE_HANGUP13: {
        code: 13,
        // 通话过程对方挂断
        info: 'Peer side hung up during call'
      },
      REMOTE_BUSYLINE14: {
        code: 14,
        // 对方忙碌
        info: 'Peer side is busy'
      },
      REMOTE_NO_RESPONSE15: {
        code: 15,
        // 对方未接听
        info: 'Peer side did not answered the call'
      },
      REMOTE_ENGINE_UN_SUPPORTED16: {
        code: 16,
        // 对方不支持当前引擎
        info: 'Current engine is not supported by peer side'
      },
      REMOTE_NETWORK_ERROR17: {
        code: 17,
        // 对方网络错误
        info: 'Network exception on peer side'
      },
      VOIP_NOT_AVALIABLE18: {
        code: 18,
        // VoIP 不可以用
        info: 'VoIP is not avaliable'
      }
    };

    var getKey = function getKey(key) {
      if (util.isNumber(key)) {
        util.forEach(result, function (reason, reasonKey) {
          reasonKey.indexOf(key) > -1 && (key = reasonKey);
        });
      }
      return key;
    };

    var get$$1 = function get$$1(key) {
      key = getKey(key);
      return result[key];
    };

    return {
      get: get$$1
    };
  }();

  var reasonItem = {
    1: function _() {
      return Reason$2.get('REMOTE_CANCEL11');
    },
    2: function _() {
      return Reason$2.get('REMOTE_REJECT12');
    },
    3: function _() {
      return Reason$2.get('REMOTE_HANGUP13');
    },
    4: function _() {
      return Reason$2.get('REMOTE_BUSYLINE14');
    },
    5: function _() {
      return Reason$2.get('REMOTE_NO_RESPONSE15');
    },
    15: function _() {
      return Reason$2.get('NO_RESPONSE5');
    }
  };

  var watch$1 = function watch(listener) {
    msgWatcher.add(listener);
  };

  var Timer = function Timer() {
    this.timeout = 0;
    this.startTime = 0;
    this.start = function (callback, second) {
      second = second || 0;

      if (callback) {
        this.timeout = setTimeout(function () {
          callback();
        }, second);
      }

      this.startTime = +new Date();
    };

    this.stop = function () {

      clearTimeout(this.timeout);

      var endTime = +new Date();
      var startTime = this.startTime;
      var duration = endTime - startTime;
      if (startTime === 0) {
        duration = 0;
      }
      return {
        start: startTime,
        end: endTime,
        duration: duration
      };
    };
    this.clear = function () {
      this.startTime = 0;
    };
  };

  var summayTimer = new Timer();

  var getToken = function getToken(params, callback) {
    var channelId = params.channelId;
    var engineType = 4;
    params = {
      command: 'getToken',
      engineType: engineType,
      data: {
        channelId: channelId
      }
    };
    sendCommand$1(params, callback);
  };

  // params.info
  // params.position
  var errorHandler = function errorHandler(params) {
    var info = params.info;
    throw new Error(info);
  };

  var checkSession = function checkSession(params) {
    if (!params.session) {
      errorHandler(params);
    }
  };

  var stopTimer = function stopTimer(message) {
    var method = message ? 'single' : 'multi';
    stopItem[method](message);
  };

  var room = {
    isActive: false,
    init: function init(params, callback) {
      if (this.isActive) {
        return;
      }
      params.url = config$1.url;
      params.ices = config$1.ices;
      joinRoom$1(params, callback);
      this.isActive = true;
    },
    reset: function reset() {
      this.isActive = false;
      cache$1.remove('session');
      cache$1.remove('initRoom');
    }
  };

  var getSummary = function getSummary(params) {

    var session = params.session || cache$1.get('session') || {};
    var reason = Reason$2.get(params.reasonKey);

    var conversationType = session.conversationType;
    var targetId = session.targetId;
    var channelId = session.channelId;

    var timer = summayTimer.stop();
    summayTimer.clear();

    var caller = session.senderUserId;

    var inviter = session.senderUserId;

    var content = session.content;
    var mediaType = content.mediaType;

    var inviteUserIds = content.inviteUserIds;

    var userOnLine = session.userOnLine || {};

    var noneedRoomReset = params.noneedRoomReset;

    if (conversationType === 1 && userOnLine[caller]) {
      var method = reasonItem[reason.code];
      method && (reason = method());
    }

    var summary = {
      channelId: channelId,
      conversationType: conversationType,
      targetId: targetId,
      messageDirection: session.messageDirection,
      content: {
        caller: caller,
        inviter: inviter,
        mediaType: mediaType,
        startTime: timer.start,
        duration: timer.duration,
        status: reason.code,
        memberIdList: inviteUserIds
      },
      senderUserId: inviter,
      messageType: 'SummaryMessage'
    };
    commandWatcher.notify(summary);

    if (!noneedRoomReset) {
      room.reset();
    }
    cache$1.remove('hungupReason');
    return summary;
  };

  var sendHungup = function sendHungup(params, callback) {
    callback = callback || util.noop;

    var session = cache$1.get('session');
    params.session = session;

    var from = params.from;
    var info = from + ': Not call yet';
    checkSession({
      session: session,
      info: info
    });
    var callId = session.content.callId;
    var conversationType = session.conversationType;
    var targetId = session.targetId;
    var key = params.reasonKey;
    var reason = Reason$2.get(key);

    var requireSendCommand = !params.passive;

    // 点击挂断按钮触发时发送消息，接受到 HungupMessage 时不发送消息
    if (requireSendCommand) {
      var arg = {
        command: 'hungup',
        data: {
          conversationType: conversationType,
          targetId: targetId,
          content: util.extend({
            callId: callId,
            reason: reason.code
          }, getSendExtraParams(params)),
          channelId: params.channelId
        }
      };
      quitRoom$1({
        roomId: callId
      }, function () {
        sendCommand$1(arg, function (error) {
          if (!error) {
            var summary = getSummary(params);
            callback(null, summary);
          }
        });
      });
    } else {
      quitRoom$1({
        roomId: callId
      }, function () {
        var summary = getSummary(params);
        callback(null, summary);
      });
    }

    if (cache$1.get('joinRoom')) {
      cache$1.remove('joinRoom');
    }
    stopTimer();
    // cache.clear();
  };

  var calcTimeout = function calcTimeout(params) {
    var userIds = params.userIds;
    var conversationType = params.conversationType;
    var targetId = params.targetId;
    var channelId = params.channelId;

    var currentUserId = getCurrentUserId$1() || config$1.currentUserId;

    util.forEach(userIds, function (userId) {
      var timer = callTimer[userId] = new Timer();

      var isPrivate = conversationType === 1;
      var isRemote = userId === currentUserId || isPrivate;
      var status = params.status;
      timer.status = status;
      timer.mediaType = params.mediaType;
      var timeout = config$1.timeout;
      if (!isRemote) {
        timeout += params.timeout || 0;
      }
      var sentItem = {
        sent: function sent(timer) {
          // 一直处于呼叫状态认为对方不在线。
          var isOffLine = timer.status === CallStatus$1.Dialing;
          var key = isOffLine ? 'REMOTE_NO_RESPONSE15' : 'NO_RESPONSE5';
          var params = {
            channelId: channelId,
            conversationType: conversationType,
            targetId: targetId,
            from: 'call-timeout',
            reasonKey: key
          };
          var inviteUsers = cache$1.get('inviteUsers') || {};
          sendHungup(params, function (error, message) {
            var senderUserId = message.senderUserId;
            delete inviteUsers[senderUserId];
          });
        },
        local: function local() /*callback*/{
          var key = 'NO_RESPONSE5';
          var reason = Reason$2.get(key);
          var session = cache$1.get('session');
          var content = {
            reason: reason.code,
            callId: session.content.channelInfo.Id
          };
          var message = {
            messageType: 'HungupMessage',
            channelId: channelId,
            conversationType: conversationType,
            targetId: targetId,
            senderUserId: userId,
            content: content,
            messageDirection: 2
          };

          // let error = null;
          msgWatcher.notify(message);
        }
      };
      timer.start(function () {
        // 接收者为自己时发送 HungupMessage, 其他人则本地创建 HungupMessage，认为此人已忽略、或者不在线。
        var method = isRemote ? 'sent' : 'local';
        sentItem[method](timer);
      }, timeout);
    });
  };

  var initRoom = function initRoom(params, callback, command) {
    getToken(params, function (error, token) {
      if (error) {
        throw new Error(error);
      }

      params.token = token;

      var videoItem = {
        added: function added(result) {
          var stream = result.data;
          var userId = stream.getAttribute('userid');
          // App Server 的用户 Id
          result.userId = userId;
          stream.setAttribute('userId', userId);
        }
      };
      room.init(params, function (error, result) {
        callback = callback || util.noop;
        if (error) {
          callback(error, result);
          throw new Error(error);
        }
        if (result.type === 'error') {
          getSummary({
            reasonKey: 'NETWORK_ERROR7'
          });
          throw new Error('RTC Connect Error.');
          // return callback(null, summary);
        }
        if (result.isLeft) {
          // 离开事件
          //   room.reset();
          return;
        }
        if (result.type === 'added' && result.isLocal) {
          callback(null, command);
        }
        var type = result.type;
        var index = result.index;
        var handler = videoItem[type];
        handler && handler(result);
        if (index === 'meet') {
          // 会控相关
          meetCommandWatcher.notify(result);
        } else {
          var sourceId = result.sourceId;
          var userId = result.userId;
          var hasUser = Number(userId) !== sourceId;
          if (hasUser) {
            videoWatcher.notify(result);
          } else {
            var queue = cache$1.get('videoQueue');
            queue[sourceId] = result;
          }
        }
      });
    });
  };

  var array2Obj$1 = function array2Obj(arrs) {
    var obj = {};
    util.forEach(arrs, function (item) {
      obj[item] = item;
    });
    return obj;
  };

  var isGroup = function isGroup(type) {
    return type === 3;
  };

  var doUserRelation = function doUserRelation(senderUserId, mediaId) {
    var session = cache$1.get('session');

    session[senderUserId] = mediaId;
    session[mediaId] = senderUserId;

    return {
      userId: mediaId,
      sender: senderUserId
    };
  };

  var addUserRelation = function addUserRelation(params) {
    // let sentTime = params.sentTime;
    var senderUserId = params.senderUserId;
    var mediaID = getMediaID$1(params);
    // console.log('addUserRelation:sentTime->userId', sentTime, '->', senderUserId);
    return doUserRelation(senderUserId, mediaID);
  };

  var inviteItem = {
    busy: function busy(message) {
      var reasonKey = 'BUSYLINE4';
      var reason = Reason$2.get(reasonKey);

      var isSender = message.messageDirection === 1;

      if (isSender) {
        reasonKey = 'HANGUP3';
      }

      var callId = message.content.callId;

      var content = {
        callId: callId,
        reason: reason.code
      };

      var conversationType = message.conversationType;
      var targetId = message.targetId;
      var channelId = message.channelId;

      var data = {
        channelId: channelId,
        conversationType: conversationType,
        targetId: targetId,
        content: content
      };

      var crtUserId = getCurrentUserId$1();
      var userIds = void 0;
      // 群聊中 hungup 消息应为群内定向消息
      if (conversationType === 3) {
        userIds = [message.senderUserId];
        var addUserId = function addUserId() {
          for (var _len = arguments.length, ids = Array(_len), _key = 0; _key < _len; _key++) {
            ids[_key] = arguments[_key];
          }

          ids.forEach(function (userId) {
            if (userId !== crtUserId && !userIds.includes(userId)) {
              userIds.push(userId);
            }
          });
        };
        if (message.messageType === 'InviteMessage') {
          addUserId.apply(undefined, toConsumableArray(message.content.inviteUserIds));
        } else if (message.objectName === 'MemberModifyMessage') {
          addUserId.apply(undefined, toConsumableArray(message.content.inviteUserIds).concat(toConsumableArray(message.content.existedUserPofiles.map(function (item) {
            return item.userId;
          }))));
        }
      }

      var params = {
        command: 'hungup',
        data: data
      };

      sendCommand$1(params, null, userIds);
    },
    free: function free(message, isNeedUpUserRel, isInvite) {

      cache$1.set('session', message);
      commandWatcher.notify(message);

      var sentTime = message.sentTime;
      var senderUserId = message.senderUserId;
      if (isNeedUpUserRel) {
        //邀请方一人映射
        addUserRelation({
          sentTime: sentTime,
          senderUserId: senderUserId
        });
      } else {
        // 群聊 映射 正在视频的成员
        message.content.existedUserPofiles.map(function (user) {
          doUserRelation(user.userId, user.mediaId);
        });
      }

      var content = message.content;
      var callId = content.callId;

      var conversationType = message.conversationType;
      var targetId = message.targetId;
      var channelId = message.channelId;

      var userIds = content.inviteUserIds;

      cache$1.set('inviteUsers', array2Obj$1(userIds));

      var mediaType = content.mediaType;
      var params = {
        channelId: channelId,
        conversationType: conversationType,
        targetId: targetId,
        userIds: userIds,
        mediaType: mediaType,
        status: CallStatus$1.Incoming
      };
      calcTimeout(params);
      // 移动端第一次向pc端发起单个群聊
      if (isInvite) {
        var _params = {
          channelId: channelId,
          conversationType: conversationType,
          targetId: targetId,
          userIds: [message.senderUserId],
          mediaType: mediaType,
          status: CallStatus$1.Active
        };
        calcTimeout(_params);
        stopTimer(message);
        var data = {
          channelId: channelId,
          conversationType: conversationType,
          targetId: targetId,
          content: {
            callId: callId
          }
        };
        var result = {
          command: 'ringing',
          data: data
        };

        sendCommand$1(result);
      }
    }
  };

  var Consumer = function Consumer(result) {
    var queue = cache$1.get('videoQueue');

    var stream = result.data;
    var userId = stream.getAttribute('userid');
    var session = cache$1.get('session');

    if (userId in session) {
      delete queue[userId];
      userId = session[userId] || userId;
      result.sourceId = userId;
      stream.setAttribute('userid', userId);
      videoWatcher.notify(result);
    }
  };

  var otherClientHandler = function otherClientHandler(message) {
    var type = message.conversationType;
    var targetId = message.targetId;
    var channelId = message.channelId;
    var direction = 2;

    var session = cache$1.get('session');
    var senderUserId = session.senderUserId;
    var caller = senderUserId;
    var inviter = senderUserId;
    var content = session.content;
    var mediaType = content.mediaType;
    var inviteUserIds = content.inviteUserIds;

    var start = 0;
    var duration = 0;
    var reason = Reason$2.get('OTHER_CLIENT_HANDLED8');

    var summary = {
      channelId: channelId,
      conversationType: type,
      targetId: targetId,
      messageDirection: direction,
      content: {
        caller: caller,
        inviter: inviter,
        mediaType: mediaType,
        startTime: start,
        duration: duration,
        status: reason.code,
        memberIdList: inviteUserIds
      },
      senderUserId: inviter,
      messageType: 'SummaryMessage'
    };

    commandWatcher.notify(summary);
    cache$1.remove('session');
  };

  var messageHandler = {
    InviteMessage: function InviteMessage(message) {
      var currentUserId = getCurrentUserId$1() || config$1.currentUserId;
      if (currentUserId === message.senderUserId) {
        return;
      }
      var session = cache$1.get('session');
      var method = session ? 'busy' : 'free';
      inviteItem[method](message, true, true);

      var callId = message.content.callId;
      cacheInviteMessages[callId] = message;
      var cacheHungupMessage = cache$1.get('cacheHungupMessage');
      if (cacheHungupMessage && message.content.callId === cacheHungupMessage.content.callId) {
        messageHandler['HungupMessage'](cacheHungupMessage);
      }

      if (method === 'busy') {
        //忙碌中抛出 summaryMessage
        getSummary({
          reasonKey: 'BUSYLINE4',
          noneedRoomReset: true,
          session: message
        });
      }
    },
    RingingMessage: function RingingMessage(message) {
      var senderUserId = message.senderUserId;
      var timer = callTimer[senderUserId];
      if (timer) {
        timer.stop();
        timer.status = CallStatus$1.Ringing;
      }
      var session = cache$1.get('session');
      if (session) {
        var userOnLine = session.userOnLine || {};
        userOnLine[senderUserId] = true;
        session.userOnLine = userOnLine;
        commandWatcher.notify(message);
      }
    },
    AcceptMessage: function AcceptMessage(message) {
      var session = cache$1.get('session');
      if (!session) {
        // 己方已挂断, 再收到对方 accept 消息时
        return;
      }
      var params = session.params;
      var sessionSenderUserId = session.senderUserId;
      function hasInitRoom() {
        return cache$1.get('initRoom') && sessionSenderUserId === getCurrentUserId$1();
      }
      function isSelf() {
        return sessionSenderUserId === getCurrentUserId$1();
      }
      if (!hasInitRoom() && isSelf()) {
        cache$1.set('initRoom', true);
        params.role = 'RC_CallInviter';
        initRoom(params);
      }
      // let already = session.already;

      var senderUserId = message.senderUserId;
      // 存储用户信息标识
      var sentTime = message.sentTime;
      var user = addUserRelation({
        sentTime: sentTime,
        senderUserId: senderUserId
      });

      var queue = cache$1.get('videoQueue');
      var video = queue[user.userId] || queue[user.sender];
      if (video) {
        Consumer(video);
      }

      var isSender = message.messageDirection === 1;

      if (isSender) {
        otherClientHandler(message);
        return;
      }

      // if (already) {
      //     return;
      // }

      var content = message.content;

      message.callInfo = {
        mediaType: content.mediaType,
        status: CallStatus$1.Active
      };
      stopTimer(message);

      var channel = session.content.channelInfo;
      var channelId = channel.Id;

      // 过滤其他端的发送消息
      var callInfo = session.callInfo || {};
      if (!callInfo[channelId]) {
        return;
      }

      session.already = true;
      summayTimer.start();

      var timer = callTimer[senderUserId] || {
        stop: function stop() {},
        status: CallStatus$1.Active, mediaType: content.mediaType };
      timer.status = CallStatus$1.Active;
      callTimer[senderUserId] = timer;

      commandWatcher.notify(message);
    },
    HungupMessage: function HungupMessage(message) {

      var currentUserId = getCurrentUserId$1() || config$1.currentUserId;
      var inviteUsers = cache$1.get('inviteUsers') || {};
      var senderUserId = message.senderUserId;
      // let conversationType = message.conversationType;

      var session = cache$1.get('session');

      var curInvite = cacheInviteMessages[message.content.callId];
      if (message.content.reason === 4 && !curInvite && currentUserId == senderUserId) {
        cache$1.set('cacheHungupMessage', message);
        return;
      }

      if (!session) {
        return;
      }

      var content = session.content;
      var callId = content.channelInfo.Id;
      var hungupContent = message.content;
      var hungupCallId = hungupContent.callId;

      if (callId !== hungupCallId) {
        return;
      }

      message.callInfo = {
        mediaType: content.mediaType,
        status: CallStatus$1.Hangup
      };

      stopTimer(message);

      delete inviteUsers[senderUserId];
      delete callTimer[senderUserId]; // 挂断在邀请

      var isReceived = message.messageDirection === MessgeDirection.RECEIVED;

      if (isReceived) {
        var _content = message.content;
        var reasonCode = _content.reason;
        // 兼容移动端拒绝时 reason = 3
        if (reasonCode === 3 && summayTimer.startTime === 0) {
          reasonCode = 2;
        }

        var getReason = reasonItem[reasonCode] || util.noop;
        var reason = getReason() || {};

        reasonCode = reason.code || reasonCode;

        message.content.reason = reasonCode;

        // content.reason = reasonCode;
        // message.content.reason = reasonCode;
        cache$1.set('hungupReason', reasonCode);
      } else {
        otherClientHandler(message);
      }
      if (cacheInviteMessages[message.content.callId]) {
        delete cacheInviteMessages[message.content.callId];
      }
      commandWatcher.notify(message);
    },
    MediaModifyMessage: function MediaModifyMessage(message) {
      commandWatcher.notify(message);
    },
    MemberModifyMessage: function MemberModifyMessage(message) {
      console.warn('MemberModifyMessage =>', message);
      // fix: 移动端与 PC 端属性名称不一致
      if (message.content.existedUserPofiles) {
        message.content.existedMemberStatusList = message.content.existedUserPofiles;
      } else {
        message.content.existedUserPofiles = message.content.existedMemberStatusList;
      }

      var existedUserList = message.content.existedUserPofiles || [];
      existedUserList.forEach(function (user) {
        callTimer[user.userId] = { status: CallStatus$1.Active, stop: function stop() {},
          mediaType: user.mediaType };
      });

      inviteItem['free'](message, false, false);
    },
    otherMessage: function otherMessage(message) {
      commandWatcher.notify(message);
    }
  };

  watch$1(function (message) {
    var messageType = message.messageType;
    messageType = messageType in messageHandler ? messageType : 'otherMessage';

    var handler = messageHandler[messageType];
    handler(message);
  });

  var getRoomId = function getRoomId() /*params*/{
    var random = Math.floor(Math.random() * 1000);
    // let info = [params.conversationType, params.targetId, random];
    var uuid = util.getUUID22();
    var info = [uuid, Date.now(), random];
    return info.join('_');
  };

  var sendCall = function sendCall(data, callback) {
    var content = data.content;
    var callId = content.callId;
    var mediaType = content.mediaType;
    var isSharing = data.isSharing;
    var inviteUserIds = content.inviteUserIds;

    var conversationType = data.conversationType;
    var targetId = data.targetId;

    cache$1.set('inviteUsers', array2Obj$1(inviteUserIds));

    var params = {
      command: 'invite',
      data: data
    };

    sendCommand$1(params, function (error, result) {
      if (error) {
        callback({ code: error });
        return;
      }

      var callInfo = {};
      callInfo[callId] = true;

      result.callInfo = callInfo;
      result.isSharing = isSharing;

      //主叫方 userId 为 inviterMessage.sentTime
      //被叫方 userId 为 AcceptMessage.sentTime
      var sentTime = result.sentTime;
      var senderUserId = result.senderUserId;

      var userOnLine = result.userOnLine = {};
      util.forEach(inviteUserIds, function (userId) {
        userOnLine[userId] = false;
      });

      cache$1.update('session', result);

      addUserRelation({
        sentTime: sentTime,
        senderUserId: senderUserId
      });

      result.params = {
        channelId: callId,
        userId: senderUserId,
        sentTime: sentTime,
        mediaType: mediaType,
        isSharing: isSharing
      };

      callback({ code: null }, result);

      var params = {
        conversationType: conversationType,
        targetId: targetId,
        userIds: inviteUserIds,
        timer: 10,
        mediaType: mediaType,
        status: CallStatus$1.Dialing
      };
      calcTimeout(params);
      //self
      var self = {
        conversationType: conversationType,
        targetId: targetId,
        userIds: [senderUserId],
        timer: 10,
        mediaType: mediaType,
        status: CallStatus$1.Active
      };
      calcTimeout(self);
      stopTimer(result);
    });
  };

  var call = function call(params, callback) {

    var cacheKey = 'session';

    var session = cache$1.get(cacheKey);
    if (session) {
      var key = 'BUSYLINE4';
      callback(Reason$2.get(key));
      return;
    }

    var engineType = params.engineType || 4;

    cache$1.set(callback, params);

    callback = callback || util.noop;

    var conversationType = params.conversationType;
    var isPrivate = conversationType === 1;
    var targetId = params.targetId;
    var mediaType = params.mediaType;
    var isSharing = params.isSharing;
    var inviteUserIds = [];

    if (isPrivate) {
      inviteUserIds.push(targetId);
    } else {
      inviteUserIds = params.inviteUserIds;
    }

    var callId = getRoomId(params);
    var channel = {
      Key: '',
      Id: callId
    };

    var observerUserIds = params.observerUserIds || [];
    var data = {
      isSharing: isSharing,
      conversationType: conversationType,
      targetId: targetId,
      content: util.extend({
        sharing: isSharing,
        engineType: engineType,
        inviteUserIds: inviteUserIds,
        observerUserIds: observerUserIds,
        mediaType: mediaType,
        callId: callId,
        channelInfo: channel
      }, getSendExtraParams(params)),
      channelId: params.channelId
    };

    sendCall(data, function (error, result) {
      callback(error.code, result);

      // let params = result.params;
      // params.engineType = engineType;
      // initRoom(params);
    });
  };

  var sendInvite = function sendInvite(data, callback) {
    var content = data.content;
    var inviteUserIds = content.inviteUserIds;

    var inviteUsers = cache$1.get('inviteUsers') || {};
    util.forEach(inviteUserIds, function (userId) {
      inviteUsers[userId] = userId;
    });

    var params = {
      command: 'memberModify',
      data: data
    };
    var conversationType = data.conversationType;
    var targetId = data.targetId;
    var mediaType = data.content.mediaType;
    // console.log('send memberModify', data);
    sendCommand$1(params, function (errorcode, result) {
      callback({ code: errorcode }, result);

      var params = {
        conversationType: conversationType,
        targetId: targetId,
        userIds: inviteUserIds,
        timer: 10,
        mediaType: mediaType,
        status: CallStatus$1.Dialing
      };
      calcTimeout(params);
    });
  };

  var invite = function invite(params, callback) {
    var cacheKey = 'session';

    var session = cache$1.get(cacheKey);

    var info = 'Invite: Not call yet';
    checkSession({
      session: session,
      info: info
    });

    callback = callback || util.noop;

    session = cache$1.get('session');
    var conversationType = params.conversationType;
    var targetId = params.targetId;

    var content = session.content;
    var callId = content.callId;

    var caller = session.senderUserId;
    var engineType = params.engineType || 4;
    var channel = {
      Key: '',
      Id: callId
    };

    var mediaType = params.mediaType;
    var inviteUserIds = params.inviteUserIds;
    // let isSharing = params.isSharing;

    var modifyMemType = 1;

    var existList = [];

    util.forEach(callTimer, function (timer, userId) {
      var sendTimeFrom = session[userId];
      var member = {
        userId: userId,
        mediaId: getMediaID$1({
          sentTime: sendTimeFrom,
          userId: userId
        }), //ios o只支持string 类型
        mediaType: timer.mediaType,
        callStatus: timer.status
      };
      existList.push(member);
    });

    var currentUserId = getCurrentUserId$1() || config$1.currentUserId;
    var sendTimeSelf = session[currentUserId];
    var currentUser = {
      userId: currentUserId,
      mediaId: getMediaID$1({
        sentTime: sendTimeSelf,
        userId: currentUserId
      }),
      mediaType: mediaType,
      callStatus: CallStatus$1.Active
    };
    var userIDs = existList.map(function (user) {
      return user.userId;
    });
    if (userIDs.indexOf(currentUser.userId) < 0) existList.push(currentUser);

    var observerUserIds = params.observerUserIds || [];
    var data = {
      conversationType: conversationType,
      targetId: targetId,
      content: util.extend({
        modifyMemType: modifyMemType,
        callId: callId,
        caller: caller,
        engineType: engineType,
        channelInfo: channel,
        mediaType: mediaType,
        inviteUserIds: inviteUserIds,
        existedMemberStatusList: existList,
        existedUserPofiles: existList,
        observerUserIds: observerUserIds,
        extra: params.extra
      }, getSendExtraParams(params)),
      channelId: params.channelId
    };

    sendInvite(data, function (error, result) {
      callback(error.code, result);
    });
  };

  var sendAccept = function sendAccept(params, callback) {
    callback = callback || util.noop;

    var conversationType = params.conversationType;
    var targetId = params.targetId;
    var userType = params.userType;
    var mediaType = params.mediaType;
    var isSharing = params.isSharing;
    var userIds = params.inviteUserIds;

    var session = cache$1.get('session');

    var from = params.from;
    var info = from + ': Not call yet';
    checkSession({
      session: session,
      info: info
    });

    var engineType = params.engineType;

    var content = session.content;
    var callId = content.callId;

    params = {
      command: 'accept',
      data: {
        conversationType: conversationType,
        targetId: targetId,
        content: util.extend({
          callId: callId,
          mediaType: mediaType
        }, getSendExtraParams(params)),
        channelId: params.channelId
      }
    };

    sendCommand$1(params, function (error, command) {
      if (error) {
        return callback(error);
      }

      var sentTime = command.sentTime;
      var channelId = content.callId;
      var userId = command.senderUserId;

      command.callInfo = {
        mediaType: content.mediaType,
        status: CallStatus$1.Active
      };

      stopTimer(command);

      addUserRelation({
        sentTime: sentTime,
        senderUserId: userId
      });

      var params = {

        channelId: channelId,
        userId: userId,
        sentTime: sentTime,
        mediaType: mediaType,
        isSharing: isSharing,
        engineType: engineType,
        userType: userType
      };
      if (callTimer[userId]) {
        callTimer[userId].status = CallStatus$1.Active;
      } else {
        callTimer[userId] = {
          status: CallStatus$1.Active,
          stop: function stop() {},

          mediaType: mediaType
        };
      }
      if (conversationType === 3) {
        cache$1.set('joinRoom', true);
      }
      params.role = 'RC_CallInvitee';
      initRoom(params, callback, command);
      summayTimer.start();

      // callback(null, command);
    }, userIds);
  };

  var accept = function accept(params, callback) {
    params.from = 'accept';
    sendAccept(params, callback);
  };

  var join = function join(params) {
    params.from = 'join';
    sendAccept(params);
  };

  var hungup = function hungup(params, callback) {
    params.from = 'hungup';
    var key = 'CANCEL1';
    util.forEach(callTimer, function (timer, userId) {
      if (timer.status === CallStatus$1.Active && userId !== getCurrentUserId$1()) {
        key = 'HANGUP3';
      }
    });

    var conversationType = params.conversationType;
    if (params.passive) {
      key = cache$1.get('hungupReason') || key;
      if (isGroup(conversationType)) {
        var timer = callTimer[getCurrentUserId$1()];
        if (timer && timer.status === CallStatus$1.Active) {
          key = 'REMOTE_HANGUP13';
        } else {
          key = 'NO_RESPONSE5';
        }
      }
    }
    params.reasonKey = key;
    sendHungup(params, callback);
  };

  var reject = function reject(params, callback) {
    params = params || {};
    params.from = 'reject';
    params.reasonKey = 'REJECT2';
    sendHungup(params, callback);
  };

  // let quit = function (params, callback) {
  //   params.reasonKey = 'HANGUP3';
  //   sendHungup(params, callback);
  // };

  var mute = function mute() {
    var params = {
      isEnabled: false
    };
    enableAudio$1(params);
  };

  var unmute = function unmute() {
    var params = {
      isEnabled: true
    };
    enableAudio$1(params);
  };

  var sendMediaModify = function sendMediaModify(mediaType, callback) {
    var session = cache$1.get('session');
    var content = session.content;
    var callId = content.callId;
    // mediaType = mediaType;
    var conversationType = session.conversationType;
    var targetId = session.targetId;
    var channelId = session.channelId;

    var params = {
      command: 'mediaModify',
      data: {
        conversationType: conversationType,
        targetId: targetId,
        content: {
          callId: callId,
          mediaType: mediaType
        },
        channelId: channelId
      }
    };

    session.content.mediaType = mediaType;
    cache$1.get('session', session);

    sendCommand$1(params, callback);
  };

  var videoToAudio = function videoToAudio(callback) {
    var params = {
      isEnabled: false
    };
    enableVideo$1(params);
    // TODO
    var mediaType = 1;
    sendMediaModify(mediaType, callback);
  };

  var audioToVideo = function audioToVideo(callback) {
    var deviceEnable = util.deviceEnable;
    if (!deviceEnable.camera) {
      return callback && callback(EnumReason.DEVICE_ERROR.code, EnumReason.DEVICE_ERROR.info);
    }

    var params = {
      isEnabled: true
    };
    enableVideo$1(params);
    // TODO
    var mediaType = 2;
    sendMediaModify(mediaType, callback);
  };
  var requestWhiteBoardURL$1 = function requestWhiteBoardURL() {
    RongVoIP.requestWhiteBoardURL();
  };

  var videoWatch = function videoWatch(watcher) {
    videoWatcher.remove();
    videoWatcher.add(watcher);
  };

  var meetCommandWatch = function meetCommandWatch(watcher) {
    meetCommandWatcher.remove();
    meetCommandWatcher.add(watcher);
  };

  var meetCommandWatche = function meetCommandWatche() {
    throw '`meetCommandWatche` deprecated，please use `meetCommandWatch` instead';
  };

  var commandWatch = function commandWatch(watcher) {
    commandWatcher.remove();
    commandWatcher.add(watcher);
  };

  var CallVIdeoProfile = {
    20: 'VIDEO_PROFILE_240P',
    40: 'VIDEO_PROFILE_480P',
    50: 'VIDEO_PROFILE_720P'
  };
  var setVideoProfile$1 = function setVideoProfile(profile) {
    var enableProfile = CallVIdeoProfile[profile];
    RongVoIP.setVideoProfile(enableProfile);
  };

  /*  option: { audioDeviceId, videoDeviceId } */
  var setMediaDevice$1 = function setMediaDevice(option) {
    option = option || {};
    RongVoIP.setMediaDevice(option);
  };

  // TODO: 代码错误，rtc.js 中的 startScreenShare 不接受传参
  var startScreenShare$1 = function startScreenShare(stream) {
    RongVoIP.startScreenShare(stream);
  };
  var stopScreenShare$1 = function stopScreenShare() {
    RongVoIP.stopScreenShare();
  };

  var getSessionId$1 = function getSessionId() {
    return RongVoIP.getSessionId();
  };

  var getCallId = function getCallId() {
    var session = cache$1.get('session');
    var content = session.content;
    return content.callId;
  };

  var init = function init(cfg, rongRTCStream) {

    if (cfg.watch) {
      cfg.watch(function (message) {
        msgWatcher.notify(message);
      });
    } else {
      MessageCtrl.watch(function (message) {
        msgWatcher.notify(message);
      });
    }

    return {
      videoWatch: videoWatch,
      commandWatch: commandWatch,

      call: call,
      invite: invite,
      accept: accept,
      hungup: hungup,
      reject: reject,
      join: join,
      mute: mute,
      unmute: unmute,
      videoToAudio: videoToAudio,
      audioToVideo: audioToVideo,
      // 拼写错误，后续弃用
      meetCommandWatche: meetCommandWatche,
      meetCommandWatch: meetCommandWatch,
      requestWhiteBoardURL: requestWhiteBoardURL$1,
      startScreenShare: startScreenShare$1,
      stopScreenShare: stopScreenShare$1,
      setVideoProfile: setVideoProfile$1,
      setMediaDevice: setMediaDevice$1,
      rongRTCStream: rongRTCStream,
      // 获取当前会话 sessionId
      getSessionId: getSessionId$1,
      getCallId: getCallId
    };
  };

  var CallLib = function CallLib(cfg) {
    classCallCheck(this, CallLib);

    if (!cfg.RongIMLib) {
      throw new Error('Please import Web IM SDK: http://www.rongcloud.cn/docs/web.html#sdk');
    }
    util.extend(config$1, cfg);
    modules.setRongIMLib(cfg.RongIMLib);
    modules.setRongRTC(cfg.RongRTC);
    MessageCtrl.setVoipProvider();
    var rongRTCStream = RongVoIP.setConfig(config$1);
    if (cfg.sendCommand) {
      sendCommand$1 = cfg.sendCommand;
    }
    return init(cfg, rongRTCStream);
  };

  var RongCallLib = {
    /**
     * @param {string} cfg.lang 推送语言设置：‘zh’ 中文、‘en’ 英文
    */
    init: function init(cfg) {
      try {
        if (!util.isSupportedBrowser()) {
          util.console.error('This browser is not supported at this time. Please use Chrome 57+ or Safari 12+ to access it');
        }
        if (!util.isSupportedPlatform()) {
          util.console.error('Mobile is not supported at this time, please use PC to access');
        }
        if (!util.isSupportedProtocol()) {
          util.console.error('The web site must be localhost or https');
        }
      } catch (e) {
        util.console.error('init error', e);
      }
      locale.set(cfg.lang);
      return new CallLib(cfg);
    }

  };

  var index = util.extend(RongCallLib, Enum);

  return index;

})));
