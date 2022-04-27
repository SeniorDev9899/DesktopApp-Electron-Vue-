/* eslint-disable no-underscore-dangle */
/* eslint-disable no-param-reassign */

import templateFormat from './templateFormat';
import kebabToCamel from './kebabToCamel';
import isString from './isString';
import isEmpty from './isEmpty';
import cache from './cache';
import createUid from './createUid';
import toThousands from './toThousands';
import getDeviceId from './getDeviceId';
import toJSON from './toJSON';
import intersection from './intersection';
import convertToABC from './convertToABC';
import { emojiUnicodeReg, emojiNativeReg } from './emojiReg';
import getLength from './getLength';
import GroupPermission from './GroupPermission';
import MessageType from './MessageType';
import debounce from './debounce';
import searchName from './searchName';
import slice from './slice';
import throttle from './throttle';
import {
    encode as base64Encode,
    decode as base64Decode,
} from './base64encoder';
import { compile as compileStr, uncompile as uncompileStr } from './encrypt';
import DownloadStatus from './DownloadStatus';
import prefixZero from './prefixZero';
import secondToMinute from './secondToMinute';
import htmlLang from './htmlLang';
import encodeHtmlStr from './encodeHtmlStr';
import keyCode from './KeyCode';
import searchStrRange from './searchStrRange';
import getFilename from './getFilename';
import replaceUri from './replaceUri';
import replaceEmail from './replaceEmail';
import copyToClipboard from './copyToClipboard';
import getFilenameExtension from './getFilenameExtension';
import getBrowser from './getBrowser';
import Base64 from './Base64Media';
import getFileType from './getFileType';
import formatFileSize from './formatFileSize';
import getBase64Size from './getBase64Size';
import parseUrl from './parseUrl';
import getQuerystr from './getQuerystr';
import getDateId from './getDateId';
import isChinese from './isChinese';
import loadTemplate from './loadTemplate';
import isEmojiOverlap from './isEmojiOverlap';
import getPlatform from './getPlatform';
import asyncComponent from './asyncComponent';
import dateFormat from './dateFormat';
import console from './console';
import replaceMeeting from './replaceMeeting';
import getUrlMatchProtocol from './getUrlMatchProtocol';
import netEnvironment from './netEnvironment';

export default {
    base64Encode,
    base64Decode,
    secondToMinute,
    prefixZero,
    getPlatform,
    getDeviceId,
    createUid,
    keyCode,
    downloadStatus: DownloadStatus,
    status: RongIMLib.ConnectionStatus,
    sentStatus: RongIMLib.SentStatus,
    receivedStatus: RongIMLib.ReceivedStatus,
    messageDirection: RongIMLib.MessageDirection,
    mentionedType: RongIMLib.MentionedType,
    conversationType: RongIMLib.ConversationType,
    messageType: MessageType,
    loadTemplate,
    asyncComponent,
    dateFormat,
    toJSON,
    copyToClipboard,
    getFileType,
    formatFileSize,
    intersection,
    getLength,
    slice,
    isEmpty,
    throttle,
    debounce,
    convertToABC,
    searchName,
    searchStrRange,
    replaceUri,
    replaceEmail,
    encodeHtmlStr,
    getFilenameExtension,
    Base64,
    cache,
    kebabToCamel,
    templateFormat,
    getBase64Size,
    isChinese,
    getFilename,
    getDateId,
    isEmojiOverlap,
    getBrowser,
    emojiUnicodeReg,
    emojiNativeReg,
    getQuerystr,
    parseUrl,
    htmlLang,
    isString,
    groupPermission: GroupPermission,
    compileStr,
    uncompileStr,
    toThousands,
    console,
    replaceMeeting,
    getUrlMatchProtocol,
    netEnvironment,
};
