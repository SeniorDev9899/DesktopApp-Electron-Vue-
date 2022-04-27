/* eslint-disable func-names */
/* eslint-disable camelcase */
/* eslint-disable no-param-reassign */
/* eslint-disable no-underscore-dangle */

import isEmpty from '../utils/isEmpty';
import encodeHtmlStr from '../utils/encodeHtmlStr';
import replaceUri from '../utils/replaceUri';
import replaceEmail from '../utils/replaceEmail';
import templateFormat from '../utils/templateFormat';
import isString from '../utils/isString';
import kebabToCamel from '../utils/kebabToCamel';
import searchStrRange from '../utils/searchStrRange';
import cache from '../utils/cache';
import ScrollBarY from '../directive/scroll-bar-y';
import SuccessionCliek from '../directive/succession-click';
import ScrollToBottom from '../directive/scroll-to-bottom';
import groupNoticeFormat from './groupNoticeFormat';
import latestGroupNoticeFormat from './latestGroupNoticeFormat';
import buildMessage from './buildMessage';
import UserType from './UserType';
import UserState from './UserState';
import sortByMydeptAndMajorCompany from './sortByMydeptAndMajorCompany';
import getPathName from './getPathName';
import getPathNameEllipsis from './getPathNameEllipsis';
import getPathNameSuffix from './getPathNameSuffix';
import encodeUrl from './encodeUrl';
import getResizeDirection from './getResizeDirection';
import removeDuplicatesById from './removeDuplicatesById';
import CallType from './CallType';
import RCCallStatus from './RCCallStatus';
import sameConversaton from './sameConversaton';
import isCanceled from './isCanceled';
import FriendState from './FriendState';
import OrgType from './OrgType';
import CompanyType from './CompanyType';
import ApproveState from './ApproveState';
import ErrorCode from './ErrorCode';
import highlight from './highlight';
import getSearchUsername from './getSearchUsername';
import getUsernameHighlight from './getUsernameHighlight';
import getGroupName from './getGroupName';
import getFileName from './getFileName';
import groupSummaryFormat from './groupSummaryFormat';
import sortUsers from './sortUsers';
import without from './without';
import playSound from './playSound';
import getHighlight from './getHighlight';
import filterMark from './filterMark';
import equalMessage from './equalMessage';
import createNotificationMessage from './createNotificationMessage';
import searchAlias from './searchAlias';
import getDownloadUrl from './getDownloadUrl';
import isSysUser from './isSysUser';
import sortGroups from './sortGroups';
import isPrivate from './isPrivate';
import downloaders from './downloaders';
import RemotePlatform from './RemotePlatform';
import convertEmoji from './convertEmoji';
import emojiConvertHTML from './emojiConvertHTML';
import utils from '../utils';
import config from '../config';
import system from '../system';
import imageViewer from '../imageViewer';
import replaceMeetingId from '../utils/replaceMeeting';
import {
    getServerConfig,
    getServerConfigByChainedKey,
    getAppKey,
} from '../cache/helper';

const RongIMEmoji = RongIMLib.RongIMEmoji;
const defaultSize = config.emoji.sizePX;

export default (RongIM) => {
    /*
纵向滚动条解决透明问题
update 数据变化时重新计算滚动条高度
*/
    Vue.directive('rong-scroll-bar-y', ScrollBarY);
    Vue.directive('rong-succession-click', SuccessionCliek);
    Vue.directive('rong-scroll-to-bottom', ScrollToBottom);

    const watermark = function watermark(el, binding) {
        const im = RongIM.instance;
        const watermarkConfig = getServerConfig().watermark;
        if (!watermarkConfig.enable) {
            return;
        }
        const $container = $(el);
        if (!binding.value) {
            if (!im.loginUser) {
                return;
            }
            let showText = im.loginUser.mobile || im.loginUser.staff_no || im.loginUser.id;
            showText = im.loginUser.name + showText.slice(-4);
            $container.watermark({
                texts: showText,
                // texts : '章颖',
                backgroundScroll: false,
            });
        } else {
            $container.css({ 'background-image': 'none' });
            $container.css({ 'background-color': '#ffffff' });
        }
    };
    // 背景加水印
    Vue.directive('watermark', {
        inserted: watermark,
        update: watermark,
    });

    function textMessageFormat(content) {
        if (isEmpty(content) || content.length === 0) {
            return '';
        }

        // 要处理的到底是message？还是message里的content？
        // str到处都是？
        // 传入依赖
        // if-else只处理差异化部分

        content = encodeHtmlStr(content);

        content = replaceUri(content, (uri, protocol) => {
            let link = uri;
            if (!protocol) {
                link = `http://${uri}`;
            }
            return `<a class="rong-link-site" target="_blank" href="${link}">${uri}</a>`;
        });

        content = replaceEmail(
            content,
            email => `<a class="rong-link-email" href="mailto:${email}">${email}</a>`,
        );
        content = replaceMeetingId(content);
        // content = RongIMEmoji.messageDecode(content);
        return convertEmoji(content, 18);
    }

    // 转化消息，用于显示
    function convertMessage(text) {
        if (isEmpty(text)) {
            return text;
        }
        // var content = RongIMEmoji.messageDecode(text.trim());
        let content = text.trim();
        content = content.replace(/\n/g, '');
        content = encodeHtmlStr(content);
        content = RongIMEmoji.symbolToEmoji(content);
        const SIZE_PX = defaultSize || 16;
        return convertEmoji(content, SIZE_PX);
    }

    /*
说明：统一弹窗格式
参数：
    @param {object}      params
    @param {string}      params.type          - 'confirm':有2个按钮的弹窗，'alert':有1个按钮的弹窗，默认为'alert'
    @param {string}      params.title         - 弹窗title，不传则为空
    @param {string}      params.message       - 弹窗内容，不传则为空
    @param {string}      params.submitText    - 确定按钮的文案
    @param {boolean}     params.isAlignLeft   - 弹窗内容不都左对齐
    @param {function}    params.closeCallback - 取消按钮回调函数
    @param {function}    params.callback      - 确认按钮回调函数
    @param {boolean}     params.hashchangeClose - default true
*/
    function messagebox(params) {
        if (isEmpty(params.hashchangeClose)) {
            params.hashchangeClose = true;
        }
        const options = {
            name: 'messagebox',
            template: $('#rong-messagebox').html(),
            data() {
                return {
                    type: params.type || 'alert',
                    title: params.title,
                    message: params.message,
                    submitText: params.submitText,
                    show: true,
                    isAlignLeft: params.isAlignLeft,
                };
            },
            created() {
                const context = this;
                const im = RongIM.instance;
                context.title = params.title || context.locale.tips.msgboxTitle;
                context.submitText = params.submitText || context.locale.tips.msgboxSubmitText;
                im.$on('imlogined', context.close);
                im.$on('messageboxHide', context.close);
                if (params.hashchangeClose) {
                    window.addEventListener('hashchange', context.close);
                }
            },
            methods: {
                close() {
                    if (params.closeCallback) params.closeCallback();
                    this.show = false;
                    this.$destroy();
                    $(this.$el).remove();
                },
                confirm() {
                    if (params.callback) params.callback();
                    this.show = false;
                    this.$destroy();
                    $(this.$el).remove();
                },
            },
            directives: {
                autofocus: {
                    inserted(el) {
                        Vue.nextTick(() => {
                            el.focus();
                        });
                    },
                },
            },
            destroyed() {
                const im = RongIM.instance;
                im.$off('imlogined', this.close);
                im.$on('messageboxHide', this.close);
                window.removeEventListener('hashchange', this.close);
            },
        };
        const localeMix = {
            computed: {
                locale() {
                    const locale = config.currentLocale();
                    const name = kebabToCamel(options.name);
                    return $.extend(true, {}, locale, locale.components[name]);
                },
            },
        };
        options.mixins = [localeMix];
        const Messagebox = Vue.extend(options);
        const instance = new Messagebox({
            el: document.createElement('div'),
        });
        const wrap = RongIM.instance.$el.firstChild;
        $(wrap).append(instance.$el);
        return instance;
    }

    /*
说明：统一弹窗格式
参数：
    @param {string}      params.message       - toast内容
    @param {string}      params.type          - toast类型，'success'绿色，'error'红色，默认为'success'
*/
    function messageToast(params) {
        const options = {
            name: 'messagetoast',
            template: $('#rong-messagetoast').html(),
            data() {
                return {
                    type: params.type || 'success',
                    message: params.message,
                    show: true,
                };
            },
            created() {
                const context = this;
                setTimeout(() => {
                    context.show = false;
                    if (typeof params.callback === 'function') {
                        params.callback();
                    }
                }, 3000);
            },
        };
        const messagetoast = Vue.extend(options);
        // eslint-disable-next-line new-cap
        const instance = new messagetoast({
            el: document.createElement('div'),
        });
        let wrap = RongIM.instance.$el.firstChild;
        if (params.el) {
            wrap = params.el;
        }
        $(wrap).append(instance.$el);
    }

    // 根据错误码获取错误信息
    function getErrorMessage(errorCode, defaultMessage) {
        const locale = config.currentLocale();
        if (isEmpty(defaultMessage)) {
            // defaultMessage = locale.errorCode['unknown-error'];
            defaultMessage = `错误码：${errorCode}`;
        }
        // 如果readyState为0，即请求没发送出去，获取对应的错误码
        if (errorCode && errorCode.readyState === 0) {
            defaultMessage = locale.errorCode['request-data-failed'];
        }
        const message = locale.errorCode[errorCode] || defaultMessage;
        console.warn(`${message}错误码：`, errorCode);
        return message;
    }

    function toastError(errorCode, el) {
        const message = getErrorMessage(errorCode);
        const noLoginCodeList = [10102, 10108];
        // 登录信息验证失败，则返回登录页面
        if (noLoginCodeList.indexOf(errorCode) >= 0) {
            const im = RongIM.instance;
            im.logout();
            if (message) {
                messagebox({
                    hashchangeClose: false,
                    message,
                });
            }
        } else if (message) {
            messageToast({
                el,
                type: 'error',
                message,
            });
        }
    }

    function handleError(errorCode, defaultMessage) {
        const im = RongIM.instance;
        const message = getErrorMessage(errorCode, defaultMessage);
        const noLoginCodeList = [10102, 10108];
        // 登录信息验证失败，则返回登录页面
        if (noLoginCodeList.indexOf(errorCode) >= 0) {
            im.logout();
            if (message) {
                messagebox({
                    hashchangeClose: false,
                    message,
                });
            }
        } else if (message) {
            im.$emit('messageboxHide');
            messagebox({ message });
        }
    }

    // 获取群组的类型，部门群、公司群、全员群
    function getGroupType(type) {
        const locale = config.currentLocale();
        const map = {
            // '0': '自建群',
            1: locale.tips.departmentGroup,
            2: locale.tips.companyGroup,
            4: locale.tips.allMemberGroup,
        };
        return map[type];
    }

    // 获取userName，type等于3为文件助手
    function getUsername(user) {
        if (!user) {
            return '';
        }
        const isFileHelper = user.id === getServerConfigByChainedKey('file.file_transfer_robot_id');
        if (isFileHelper) {
            return config.currentLocale().components.getFileHelper.title;
        }
        return user.alias || user.name;
    }

    // 获取 username 的 html, 包含emoji转化为html
    function getHtmlUsername(user, size, convertText) {
        let userName = getUsername(user) || convertText;
        if (!userName) {
            return '';
        }
        userName = encodeHtmlStr(userName);
        return convertEmoji(userName, size, true);
    }

    // TODO: 性能考虑，删除该方法，避免运行时遍历调用
    // 获取群组中人员的名称显示
    function getGroupUsername(user, groupId) {
        let _user = {};
        if (user) {
            _user = RongIM.dataModel._Cache.user[user.id] || user;
        }
        _user.alias = _user.alias || RongIM.dataModel._Cache.alias[_user.id];
        const group = RongIM.dataModel._Cache.group[groupId] || {};
        let alias = _user.alias || _user.name;
        if (group && group.members) {
            const members = group.members || [];
            for (let i = 0, len = members.length; i < len; i += 1) {
                const item = members[i];
                if (item.id === _user.id) {
                    alias = _user.alias || item.groupAlias || item.alias || alias;
                }
            }
        }
        return alias;
    }
    // 可能会有异步的情况
    async function getGroupUsernameAsync(user, groupId) {
        let _user = {};
        if (user) {
            _user = RongIM.dataModel._Cache.user[user.id] || user;
        }
        _user.alias = _user.alias || RongIM.dataModel._Cache.alias[_user.id];
        let group = RongIM.dataModel._Cache.group[groupId];
        if (!group) {
            group = await RongIM.dataModel._Cache.group._defer[groupId];
        }
        let alias = _user.alias || _user.name;
        if (group && group.members) {
            const members = group.members || [];
            for (let i = 0, len = members.length; i < len; i += 1) {
                const item = members[i];
                if (item.id === _user.id) {
                    alias = _user.alias || item.groupAlias || item.alias || alias;
                }
            }
        }
        return alias;
    }

    function getGroupMemberMap(group) {
    // let group = RongIM.dataModel._Cache.group[groupId];
        if (group && group.members) {
            const obj = {};
            group.members.forEach((member) => {
                obj[member.id] = member;
            });
            return obj;
        }
        return null;
    }

    function getHtmlGroupUsername(user, groupId, size, replaceText) {
        const name = getGroupUsername(user, groupId);
        return getHtmlGroupUsername2(name, size, replaceText);
    }
    // 异步获取
    async function getHtmlGroupUsernameAsync([user, groupId, size, replaceText], callback) {
        const name = await getGroupUsernameAsync(user, groupId);
        await callback(getHtmlGroupUsername2(name, size, replaceText));
    }

    function getHtmlGroupUsername2(name, size, replaceText) {
        if (!name) {
            return name;
        }
        name = encodeHtmlStr(name);
        if (!name && replaceText) {
            name = replaceText;
        }
        return convertEmoji(name, size, true);
    }

    function unifyUser(user) {
        const keys = [
            'alias',
            'avatar',
            'createDt',
            'deptId',
            'dutyName',
            'id',
            'name',
            'path',
            'star',
            'orgsInfo',
        ];
        const result = {};
        keys.forEach((key) => {
            result[key] = getUserKey(user, key);
        });
        return result;
    }

    function getUserKey(user, key) {
        let result = {};
        const cacheUser = RongIM.dataModel._Cache.user[user.id] || {};
        if (key === 'star') {
            result = user[key] || cacheUser[key] || false;
        } else {
            result = user[key] || cacheUser[key] || '';
        }
        return result;
    }

    function getHtmlGroupName(group, size, convertText) {
        let groupName = getGroupName(group) || convertText;
        groupName = encodeHtmlStr(groupName);
        return convertEmoji(groupName, size, true);
    }

    // 高亮显示搜索结果群组中的成员
    function getMatchedMembers(keyword, group) {
        if (isEmpty(keyword)) {
            return '';
        }
        const memberNames = group.member_names || [];
        const members = [];
        memberNames.forEach((name) => {
            const range = searchStrRange(name, keyword);
            if (range) {
                members.push(highlight(name, range));
            }
        });

        if (members.length > 0) {
            return members.join('，');
        }
        return '';
    }

    // 群通知的相关文案
    function groupNotificationFormat(operation) {
        const locale = config.currentLocale();
        const groupNotification = {
            Create: locale.message.create,
            Created: locale.message.created,
            Join: locale.message.join,
            JoinByQRCode: locale.message.joinByQRCode,
            Invite: locale.message.invite,
            Invited: locale.message.invited,
            InviteMe: locale.message.inviteMe,
            Kick: locale.message.kick,
            Kicked: locale.message.kicked,
            Rename: locale.message.rename,
            Renamed: locale.message.renamed,
            Quit: locale.message.quit,
            Dismiss: locale.message.dismiss,
            Notice: locale.message.notice,
            OpenMute: locale.message.OpenMute,
            CloseMute: locale.message.CloseMute,
            addMute: locale.message.addMute,
            removeMute: locale.message.removeMute,
            updateManager: locale.message.updateManager,
            updateManagerSelf: locale.message.updateManagerSelf,
            departmentInvite: locale.message.departmentInvite,
            departmentInviteSelf: locale.message.departmentInviteSelf,
            joinDepartment: locale.message.joinDepartment,
            joinDepartmentSelf: locale.message.joinDepartmentSelf,
            KickDepartment: locale.message.KickDepartment,
            KickedDepartment: locale.message.KickedDepartment,
            createDepartment: locale.message.createDepartment,
            dismissDepartment: locale.message.dismissDepartment,
            renameDepartment: locale.message.renameDepartment,
            updateDepartmentManager: locale.message.updateDepartmentManager,
            updateDepartmentManagerSelf:
        locale.message.updateDepartmentManagerSelf,
        };
        let template = groupNotification[operation];

        if (!template) {
            template = locale.message.unSupport;
            console.warn(`不支持操作类型${operation}`);
        }
        return template;
    }
    /*
二维码扫描入群,content.extra
{
  type: 0 //扫码入群
  operatorId //分享二维码的用户id
}
*/
    function getGroupNotificationByQRCode(joinInfo) {
        const action = 'JoinByQRCode';
        const format = groupNotificationFormat(action);
        const operatorName = joinInfo.operatorName;
        let QRCodeSharerName = joinInfo.QRCodeSharerName;
        if (!QRCodeSharerName) {
            QRCodeSharerName = RongIM.dataModel.Group.getMember(
                joinInfo.operatorId,
            );
        }
        QRCodeSharerName = QRCodeSharerName || joinInfo.operatorId;

        return templateFormat(format, operatorName, QRCodeSharerName);
    }

    // 根据后台传递的数据，获取群通知具体信息
    function getGroupNotification(message, authId) {
        const locale = config.currentLocale();
        const self = locale.message.self;
        const actionMap = {
            GroupMemChangedNotifyMessage: {
                1: 'Invite',
                2: 'Join',
                3: 'Kick',
                4: 'Quit',
            },
            GroupNotifyMessage: {
                1: 'Create',
                2: 'Dismiss',
                4: 'Rename',
                5: 'Notice',
                21: 'OpenMute',
                22: 'CloseMute',
                23: 'addMute',
                24: 'removeMute',
                10: 'updateManager',
            },
        };
        const departmentActionMap = {
            GroupMemChangedNotifyMessage: {
                1: 'departmentInvite',
                2: 'joinDepartment',
                3: 'KickDepartment',
                4: 'Quit',
            },
            GroupNotifyMessage: {
                1: 'createDepartment',
                2: 'dismissDepartment',
                4: 'renameDepartment',
                5: 'Notice',
                21: 'OpenMute',
                22: 'CloseMute',
                23: 'addMute',
                24: 'removeMute',
                10: 'updateDepartmentManager',
            },
        };
        const content = message.content;
        let actionName;

        // 根据 targetGroup 中 type 属性判断群组是普通群/部门群
        if (content.targetGroup.type === 0) {
            actionName = actionMap[message.messageType][content.action];
        } else {
            actionName = departmentActionMap[message.messageType][content.action];
        }

        let operator = content.operatorUser.name || '';
        if (content.operatorUser.id === authId) {
            operator = self;
        }

        // 二维码进群提示
        let extra = content.extra;
        if (extra) {
            extra = JSON.parse(extra);
        }
        let isScanCode = actionName === 'Join' || actionName === 'Invite';
        isScanCode = extra && +extra.type === 0 && isScanCode;
        if (isScanCode) {
            extra.operatorName = operator;
            extra.groupId = content.targetGroup.id;
            if (extra.operatorId === authId) {
                extra.QRCodeSharerName = self;
            }
            return getGroupNotificationByQRCode(extra);
        }

        let targetUsers = content.targetUsers || [];
        const targetIncludeMe = targetUsers.some(item => item.id === authId);
        const operatorUserIncludeMe = content.operatorUser.id === authId;
        const includeMe = targetIncludeMe || operatorUserIncludeMe;
        const separator = config.currentLocale().punctuation.separator;
        // 被禁言、解除禁言 小灰条提示显示人名
        if (actionName === 'addMute' || actionName === 'removeMute') {
            targetUsers = targetUsers.map(item => item.name).join(separator);
        } else if (
            targetIncludeMe
      && (actionName === 'Kick' || actionName === 'KickDepartment')
        ) {
            // 移除成员只提示自己
            targetUsers = [self];
        } else {
            targetUsers = targetUsers
                .map(item => (item.id === authId ? self : item.name))
                .join(separator);
        }
        actionName = getAction(
            actionName,
            includeMe,
            targetIncludeMe,
            operatorUserIncludeMe,
        );
        const groupTypeName = getGroupType(content.targetGroup.type);
        const targetGroupName = content.targetGroup.name;
        const format = groupNotificationFormat(actionName);
        return templateFormat(
            format,
            operator,
            targetUsers,
            targetGroupName,
            groupTypeName,
        );
    }

    function getJrmfRedPacketOpened(message, authId) {
        const locale = config.currentLocale();
        // PC 与 Web 消息结构不一致
        const content = message.content.message || message.content;
        const isSelfSend = content.sendPacketId === authId;
        const isSelfOpen = content.openPacketId === authId;
        if (isSelfSend) {
            if (isSelfOpen) {
                return locale.message.youOpenedRedpackOfYouSent;
            }
            return templateFormat(
                locale.message.redPacketOpened,
                content.openNickName,
            );
        }
        return templateFormat(
            locale.message.youOpenedRedpack,
            content.sendNickName,
        );
    }

    function getJrmfRedPacket(message) {
        const locale = config.currentLocale();
        const SEND = RongIMLib.MessageDirection.SEND;
        if (message.messageDirection === SEND) {
            return locale.message.redPacketSent;
        }
        return locale.message.redPacketReceived;
    }

    // 根据操作者和被操作者是否包括当前登录者来判断action
    function getAction(
        action,
        includeMe,
        targetIncludeMe,
        operatorUserIncludeMe,
    ) {
        if (action === 'Create' && includeMe) {
            action = 'Created';
        }
        if (action === 'Rename' && includeMe) {
            action = 'Renamed';
        }
        if (action === 'Invite' && targetIncludeMe) {
            action = 'InviteMe';
        }
        if (action === 'Invite' && operatorUserIncludeMe) {
            action = 'Invited';
        }
        if (action === 'Kick' && targetIncludeMe) {
            action = 'Kicked';
        }
        if (action === 'updateManager' && targetIncludeMe) {
            action = 'updateManagerSelf';
        }
        if (action === 'KickDepartment' && targetIncludeMe) {
            action = 'KickedDepartment';
        }
        if (action === 'joinDepartment' && targetIncludeMe) {
            action = 'joinDepartmentSelf';
        }
        if (action === 'departmentInvite' && targetIncludeMe) {
            action = 'departmentInviteSelf';
        }
        if (action === 'updateDepartmentManager' && targetIncludeMe) {
            action = 'updateDepartmentManagerSelf';
        }
        return action;
    }

    // 获取会话中的操作通知
    function getContactNotification(content, authId) {
        const locale = config.currentLocale();
        const actionMap = {
            1: 'Add',
            2: 'Accept',
            3: 'Reject',
            4: 'Delete',
        };
        const action = actionMap[content.actionType];
        if (action !== 'Accept') {
            return '';
        }
        let targetId = content.operator.userId;
        let targetName = content.operator.name;
        let notificaiton = locale.message.passed;
        // 如果操作者是当前登录者
        if (content.operator.userId === authId) {
            targetId = content.target.userId;
            targetName = content.target.name;
            notificaiton = locale.message.pass;
        }
        notificaiton = templateFormat(notificaiton, targetName || targetId);
        return notificaiton;
    }

    // 增加一个弹出框
    function mountDialog(options, callback) {
        const templateSrc = options.template;
        /**
* 37097 - 【更新】更新提示弹层，断网再连网后会弹出多个更新提示弹层
*/
        if (templateSrc !== 'modules/voip/call-kit/voip-invitemember.html') {
            if (mountDialog.current && mountDialog.current[templateSrc] === 'busy') {
                return;
            }
        }

        if (!mountDialog.current) {
            mountDialog.current = {};
        }
        mountDialog.current[templateSrc] = 'busy';
        const promise = utils.loadTemplate(options.template);
        promise
            .then((html) => {
                $.extend(options, { template: html });
                options.mixins = options.mixins || [];
                const localeMix = {
                    mounted() {
                        if (options.delay) {
                            this.$el.style.display = 'none';
                            setTimeout(() => {
                                this.$el.style.display = '';
                            }, options.delay);
                        }
                        // 当页面有跳转的时候，关闭弹层
                        const im = RongIM.instance;
                        im.$on('imLogouted', this.close);
                        window.addEventListener('hashchange', this.close);
                    },
                    computed: {
                        // 获取对应的相关文案
                        locale() {
                            const locale = config.currentLocale();
                            const name = kebabToCamel(options.name);
                            return $.extend(
                                true,
                                {},
                                locale,
                                locale.components[name],
                            );
                        },
                    },
                    methods: {
                        close() {
                            this.$destroy();
                            $(this.$el).remove();
                            if (mountDialog.current) {
                                delete mountDialog.current[templateSrc];
                            }
                        },
                        localeFormat: templateFormat,
                    },
                    destroyed() {
                        const im = RongIM.instance;
                        im.$off('imLogouted', this.close);
                        window.removeEventListener('hashchange', this.close);
                    },
                };
                options.mixins.push(localeMix);
                let wrap = options.parent
                    ? options.parent.$el
                    : RongIM.instance.$el.firstChild;
                options.parent = options.parent || RongIM.instance;
                const Dialog = Vue.extend(options);

                /**
* 35470 - 【PIN】MAC 15 系统编辑 PIN 时收到消息，点消息后 PIN 编辑页消失
* mixins 不能合并methods下面的方法。 用这几行替换上去
*/
                const outerClose = Dialog.options.methods.close;
                const dialogClose = function () {
                    if (outerClose) {
                        outerClose.call(this);
                    }
                    localeMix.methods.close.call(this);
                };
                Dialog.options.methods.close = dialogClose;

                const instance = new Dialog({
                    el: document.createElement('div'),
                });
                if (options.elParent) {
                    wrap = options.elParent;
                }
                $(wrap).append(instance.$el);
                if ($.isFunction(callback)) callback(instance);
            })
            .fail(() => {
                const locale = config.currentLocale();
                const im = RongIM.instance;
                const message = locale.errorCode['request-data-failed'];
                im.$emit('messageboxHide');
                if (message) messageToast({ message });
            })
            .always(() => {
            });
    }

    /*
  params.container
  params.node
  params.hander
*/
    function resizeNode(params) {
        const getNode = function (node) {
            if (isString(node)) {
                node = $(node);
            }
            return node;
        };

        const im = RongIM.instance;
        let container = params.container || $(RongIM.instance.$el);
        container = getNode(container);

        let node = params.node;
        node = getNode(node);

        let hander = params.hander || '.rong-resize';
        const getHander = function () {
            return isString(hander) ? node.find(hander) : hander;
        };
        hander = getHander();

        const onbefore = params.onbefore || $.noop;
        const onresize = params.onresize || $.noop;
        const onended = params.onended || $.noop;

        let direction = params.direction;
        const directionMap = {
            top: {
                page: 'pageY',
                attr: 'height',
                getRange(parent, resize) {
                    return parent - resize;
                },
            },
            right: {
                page: 'pageX',
                attr: 'width',
                getRange(parent, resize) {
                    const layout = config.layout;
                    const navBar = layout.navBar;
                    const navBarWidth = navBar.width.min;
                    return resize - navBarWidth;
                },
            },
            // ... 按需扩展
        };

        direction = directionMap[direction];

        const page = direction.page;
        const attr = direction.attr;

        let parentRange = parseInt(container.css(attr));

        onbefore();

        const getBound = function (type) {
            const propName = [type, attr].join('-');
            const bound = node.css(propName);
            return parseInt(bound);
        };

        const min = getBound('min');
        const max = getBound('max');

        const resumeSelect = function () {
            // Chrome
            document.onselectstart = function () {
                return true;
            };
            // FireFox Opera12.6+
            const bodyEl = $('body');
            bodyEl.removeClass('rong-disable-select');
            // Opera12.5 及以下
            bodyEl.attr('unselectable', 'off');
        };

        const pauseSelect = function () {
            // Chrome IE6-9
            document.onselectstart = function () {
                return false;
            };
            // FireFox Opera
            const bodyEl = $('body');
            bodyEl.addClass('rong-disable-select');
            // Opera12.5 及以下
            bodyEl.attr('unselectable', 'on');
        };

        let resizeP = 0;
        let isMouseDown = false;

        hander.mousedown(() => {
            isMouseDown = true;
            pauseSelect();
        });

        const resizePause = function () {
            if (isMouseDown) {
                isMouseDown = false;
                onended();
                resumeSelect();
            }
        };

        container.bind('click mouseup', resizePause).mousemove((e) => {
            if (isMouseDown) {
                resizeP = e[page];
                parentRange = parseInt(container.css(attr));
                let range = direction.getRange(parentRange, resizeP);

                if (range > max) {
                    range = max;
                }
                if (range < min) {
                    range = min;
                }
                const isLegal = range <= max && range >= min;
                if (isLegal) {
                    onresize({
                        range,
                    });
                } else {
                    isMouseDown = false;
                }
            }
        });

        im.$el.onmouseleave = function () {
            resizePause();
        };
    }

    function resizeNavNode(context, im) {
        const layout = config.layout;
        const navBar = layout.navBar;
        const navBarWidth = navBar.width.min;

        const rongList = $(context.$el);

        const resizeDirection = im.resizeDirection;

        resizeNode({
            el: im.$el,
            node: rongList,
            direction: 'right',
            onbefore() {
                im.resizeRange += 1;
                im.resizeRange -= 1;
            },
            onresize(result) {
                context.isResizing = true;
                const range = result.range;
                const node = im.resizeNode;
                node.main.marginLeft = range + navBarWidth;
                node.rongList.width = range;
                resizeDirection.use = resizeDirection.temp;
            },
            onended() {
                context.isResizing = false;
                resizeDirection.use = 'normal';
            },
        });
        const getBound = function (name) {
            return rongList.css(name);
        };
        context.bound.width = {
            min: getBound('min-width'),
            max: getBound('max-width'),
        };
    }

    const cacheTextRanderArr = [];
    const cacheTextRanderMax = 200;
    function getTextRenderWidth(str, fontSize) {
        const key = `${str}~;${fontSize}`;
        // 查找缓存是否存在
        for (let i = cacheTextRanderArr.length - 1; i >= 0; i -= 1) {
            const item = cacheTextRanderArr[i];
            if (item.key === key) {
                return item.value;
            }
        }
        let width = 0;
        const $span = $(
            `<span style="position:absolute;left: -999999px;">${str}</span>`,
        );
        if (fontSize) {
            $span.css('fontSize', fontSize);
        }
        const $contain = RongIM.instance ? RongIM.instance.$el : document.body;
        $($contain).append($span);
        width = parseInt($span.css('width'));
        $span.remove();

        // 缓存不存在加入到缓存，并判断缓存是否超限超限则清除
        cacheTextRanderArr.push({ key, value: width });
        if (cacheTextRanderArr.length > cacheTextRanderMax) {
            cacheTextRanderArr.shift();
        }
        return width;
    }

    /*
说明： 根据 server 返回获取详细组织结构信息 path 如果有独立子公司从独立子公司开始显示 path
*/
    function getFullOrgInfo(orgsInfo) {
        orgsInfo = orgsInfo || [];
        return orgsInfo.map((item) => {
            /*
path 部门路径总公司信息在第一级
独立子公司在第二级
*/
            let company = item.path[0];
            const autonomy = item.path[1];
            const isAutonomyCompany = RongIM.dataModel.Organization.isAutonomyCompany(
                (autonomy || {}).id,
            );
            if (autonomy && isAutonomyCompany) {
                company = autonomy;
            }
            return {
                companyId: company.id,
                companyName: company.name,
                isAutonomyCompany,
                deptId: item.id,
                deptName: item.name,
                deptType: item.type,
                path: item.path,
            };
        });
    }

    function getDeviceId() {
        let deviceId = cache.get('deviceId');
        if (isEmpty(deviceId)) {
            deviceId = createUid();
            cache.set('deviceId', deviceId);
        }
        return deviceId;
    }

    function createUid() {
        let deviceId = system.getDeviceId();
        if (deviceId) {
            deviceId = deviceId + getAppKey() + config.product.name.en;
            deviceId = RongIMLib.RongUtil.MD5(deviceId);
            if (deviceId.length === 32) {
                deviceId = deviceId.substr(5, 22);
                console.debug('deviceId', deviceId);
                return deviceId;
            }
            console.warn('md5加密异常');
        }
        return '';
    }

    const origin = `${window.location.protocol}//${window.location.host}`;
    /**
* 将远程地址转为 PC 主进程提供的文件缓存服务请求地址
* @param {string} url 目标文件远程地址
* @param {string} dir 缓存服务指定的缓存目录
* @returns {string} 转换后的请求地址
*/
    function trans2Localfile(url, dir) {
        if (system.platform.startsWith('web-')) {
            return url;
        }
        return url
            ? `${origin}/localfile/${getFileName(url)}?url=${encodeURIComponent(
                url,
            )}&dir=${dir || ''}`
            : url;
    }

    /**
* 确定缓存服务是否已缓存指定网络资源
* @param {string} url 网路资源路径
* @param {*} dir 所缓存的目标目录
* @param {*} callback 结果回调，若存在则回传本地缓存路径，否则回传 null
*/
    function localfileInDesk(url, dir, callback) {
        if (system.platform.startsWith('web-')) {
            callback(null);
            return;
        }
        const requestUrl = `${origin}/localpath?url=${encodeURIComponent(
            url,
        )}&dir=${dir || ''}`;
        $.ajax({
            url: requestUrl,
            dataType: 'json',
            method: 'GET',
        }).then(
            (response) => {
                callback(response.localPath);
            },
            () => {
                callback(null);
            },
        );
    }

    function showImage(messageList, messageUId, locale) {
        RongIM.dataModel.File.getImageDownloadToken((token) => {
            const dataSource = [];
            let defaultIndex = 0;
            for (let j = 0; j < messageList.length; j += 1) {
                const msg = messageList[j];
                let content = msg.content;
                if (msg.messageType === 'ReferenceMessage') {
                    content = msg.content.content;
                }
                // 38807 - 【小视频】移动端发送的小视频，PC 端查看失败，无法查看
                if (msg.messageType === 'SightMessage') {
                    if (!content.messageName) {
                        content.messageName = 'SightMessage';
                    }
                }
                let url = content.imageUri || content.sightUrl || content.remoteUrl;
                if (url) {
                    // 网络资源内容，将资源路径转为本地文件代理服务路径
                    if (url.indexOf('?') !== -1) {
                        url += `&token=${token}`;
                    } else {
                        url += `?token=${token}`;
                    }
                    url = trans2Localfile(url, 'media');
                } else {
                    // 本地磁盘文件，使用文件代理服务读取该文件
                    url = `/file2http/${getFileName(
                        content.localPath,
                    )}?url=${encodeURIComponent(content.localPath)}`;
                }
                const source = {
                    thumbnail: content.content,
                    url,
                    type: content.messageName,
                    name: content.name || '',
                    uid: msg.messageUId,
                };
                dataSource.push(source);
                if (msg.messageUId === messageUId) {
                    defaultIndex = j;
                }
            }
            const options = {
                dataSource,
                defaultIndex,
                locale,
            };
            imageViewer.openWin(options);
        });
    }

    function timestampToDisplayTime(timestamp) {
        const locale = config.currentLocale();
        const minute = Math.floor(timestamp / 60 / 1000);
        if (minute > 0) {
            return `${minute} ${locale.time.minutes}`;
        }
        const second = Math.ceil(timestamp / 1000);
        return `${second} ${locale.time.seconds}`;
    }

    // 密码加密传输
    function encryptPassword(value) {
    // 加密公钥由 server 在 configuration_all 下发配置
        const jsencrypt = new JSEncrypt();
        const publicKey = getServerConfigByChainedKey(
            'security.password_public_key_rsa',
        );
        jsencrypt.setPublicKey(publicKey);
        value = jsencrypt.encrypt(value);
        return value;
    }

    // 判断@人是否高亮
    function checkAt(msg, content, callback) {
    // 先判断@类型
        if (!msg.content.mentionedInfo) {
            callback(content);
            return;
        }
        let memberIds = [];
        if (msg.content.mentionedInfo.type === 1) {
            content = content.replace(/@所有人/g, '<span class="rong-at-click rong-at-onlyblue">@所有人</span>');
            try {
                if (msg.content.extra && JSON.parse(msg.content.extra)) {
                    memberIds = JSON.parse(msg.content.extra).userIdList;
                }
            } catch (error) {
                memberIds = [];
            }
        } else {
            memberIds = msg.content.mentionedInfo.userIdList;
        }
        if (!memberIds || memberIds.length === 0) {
            callback(content);
            return;
        }
        if (RongIM.dataModel._Cache.group[msg.targetId] && RongIM.dataModel._Cache.group[msg.targetId].groupMembers.length !== 0) {
            // 如果有群成员缓存，直接从群成员中匹配
            const groupMembers = RongIM.dataModel._Cache.group[msg.targetId].groupMembers;
            const membersMap = {};
            for (let index = 0; index < groupMembers.length; index += 1) {
                const element = groupMembers[index];
                if (memberIds.indexOf(element.id) > -1) {
                    membersMap[element.id] = {
                        id: element.id,
                        name: element.name,
                    };
                }
            }
            memberIds.forEach((id, index) => {
                const member = membersMap[id];
                // 41402 - 【消息】偶现mac-有人发的@人的消息没有显示消息内容，只显示了气泡
                if (member) {
                    const reg = new RegExp(`@${member.name}`, 'i');
                    content = content.replace(reg, `@${member.id}${index}`);
                }
            });
            memberIds.forEach((id, index) => {
                const member = membersMap[id];
                if (member) {
                    const reg = new RegExp(`@${member.id}${index}`, 'i');
                    // @ 自己 id === authId 背景蓝色
                    // content = content.replace(reg, `<span class="rong-at-click rong-at-highlight" data-id="${member.id}">@${member.name}</span>`);
                    content = content.replace(reg, `<span class="rong-at-click rong-at-onlyblue" data-id="${member.id}">@${member.name}</span>`);
                }
            });
            callback(content);
        } else {
            const membersMap = {};
            RongIM.dataModel.User.getBatch(memberIds, (errorCode, userList) => {
                userList.forEach((user) => {
                    membersMap[user.id] = {
                        id: user.id,
                        name: user.name,
                    };
                });
                memberIds.forEach((id, index) => {
                    const member = membersMap[id];
                    // 41402 - 【消息】偶现mac-有人发的@人的消息没有显示消息内容，只显示了气泡
                    // When any member of group was quited on group, member will be undefined
                    if (member) {
                        const reg = new RegExp(`@${member.name}`, 'i');
                        content = content.replace(reg, `@${member.id}${index}`);
                    }
                });
                memberIds.forEach((id, index) => {
                    const member = membersMap[id];
                    // 41402 - 【消息】偶现mac-有人发的@人的消息没有显示消息内容，只显示了气泡
                    if (member) {
                        const reg = new RegExp(`@${member.id}${index}`, 'i');
                        // @ 自己 id === authId 背景蓝色
                        // content = content.replace(reg, `<span class="rong-at-click rong-at-highlight" data-id="${member.id}">@${member.name}</span>`);
                        content = content.replace(reg, `<span class="rong-at-click rong-at-onlyblue" data-id="${member.id}">@${member.name}</span>`);
                    }
                });
                callback(content);
            });
        }
    }

    RongIM.common = {
        checkAt,
        timestampToDisplayTime,
        sortByMydeptAndMajorCompany,
        showImage,
        trans2Localfile,
        localfileInDesk,
        getPathName,
        getPathNameEllipsis,
        getPathNameSuffix,
        getFullOrgInfo,
        removeDuplicatesById,
        getTextRenderWidth,
        CallType,
        RCCallStatus,
        resizeNode,
        getResizeDirection,
        resizeNavNode,
        sameConversaton,
        textMessageFormat,
        groupNoticeFormat,
        groupSummaryFormat,
        latestGroupNoticeFormat,
        convertMessage,
        buildMessage,
        messagebox,
        messageToast,
        getErrorMessage,
        handleError,
        toastError,
        getGroupType,
        getUsername,
        getHtmlUsername,
        getGroupUsername,
        getHtmlGroupUsername,
        getHtmlGroupUsername2,
        getHtmlGroupUsernameAsync,
        unifyUser,
        getSearchUsername,
        getGroupName,
        getHtmlGroupName,
        getMatchedMembers,
        sortUsers,
        without,
        // showGroupNotification: showGroupNotification,
        getGroupNotification,
        getJrmfRedPacket,
        getJrmfRedPacketOpened,
        playSound,
        mountDialog,
        highlight,
        getHighlight,
        getUsernameHighlight,
        filterMark,
        equalMessage,
        createNotificationMessage,
        searchAlias,
        isCanceled,
        UserType,
        FriendState,
        OrgType,
        CompanyType,
        getContactNotification,
        UserState,
        getDownloadUrl,
        isSysUser,
        ApproveState,
        ErrorCode,
        sortGroups,
        emojiConvertHTML,
        isPrivate,
        downloaders,
        RemotePlatform,
        encodeUrl,
        getDeviceId,
        encryptPassword,
        getGroupMemberMap,
    };
};
