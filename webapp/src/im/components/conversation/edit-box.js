/* eslint-disable no-param-reassign */
import getLocaleMixins from '../../utils/getLocaleMixins';
import isEmojiOverlap from '../../utils/isEmojiOverlap';
import isEmpty from '../../utils/isEmpty';
import KEYCODE from '../../utils/KeyCode';
import debounce from '../../utils/debounce';
import convertToABC from '../../utils/convertToABC';
import { emojiNativeReg } from '../../utils/emojiReg';
import getAtPanel from '../../dialog/at-panel';

const RongIMEmoji = RongIMLib.RongIMEmoji;

const emojiReg = getEmojiEditReg();
const MaxLen = 10000;
let isCtrlOrCommand;

const EmojiRegExp = (() => {
    const names = RongIMEmoji.list.map((data) => {
        const symbol = data.symbol;
        return `\\[${symbol.substring(1, symbol.length - 1)}\\]`;
    });
    const nameReg = names.join('|');
    return new RegExp(nameReg, 'ig');
})();

let valueTextArr = [];
/*
说明： 输入文本框
*/
export default {
    name: 'edit-box',
    mixins: [getLocaleMixins('edit-box')],
    props: {
        atMembers: {
            type: Array,
            required: false,
        },
        autoFocus: {
            type: Boolean,
            required: false,
            default: true,
        },
        disabled: false,
        notSaveDraft: false,
        checkSendEnable: {
            type: Function,
            required: true,
        },
    },
    data() {
        return {
            value: '',
            at: {},
            atPanel: {},
            // @ 按字符搜索成员列表结果
            atFilterMembers: [],
            // 已选 @ 成员
            atSelectedMembers: [],
        };
    },
    computed: {
        status() {
            return this.$im().status;
        },
    },
    mounted() {
        mounted(this, this.$im().dataModel.Conversation);
    },
    watch: {
        atFilterMembers() {
            // @ 搜索结果改变更新 @ panel 展示
            /* eslint no-underscore-dangle: 0 */
            const Cache = this.RongIM.dataModel._Cache;
            const users = [];
            this.atFilterMembers.forEach((item) => {
                const user = Cache.user[item.id] ? Cache.user[item.id] : item;
                users.push(user);
            });
            const params = {
                atPanel: this.atPanel,
                atFilterMembers: users,
                at: this.at,
            };
            renderAtpanel(params);
        },
        $route() {
            const context = this;
            const conversationApi = this.$im().dataModel.Conversation;
            const params = context.$route.params;
            const draft = conversationApi.getDraft(params.conversationType, params.targetId);
            context.atSelectedMembers = draft.atMembers || [];
            context.value = draft.content || '';
        },
        status() {
            const context = this;
            context.$emit('editBoxChange', context.getValue().text);
        },
        notSaveDraft() {
            const params = this.$route.params;
            const conversationApi = this.$im().dataModel.Conversation;
            const conversationType = params.conversationType;
            const targetId = params.targetId;
            if (this.notSaveDraft) {
                conversationApi.clearDraft(conversationType, targetId);
            }
        },
    },
    methods: {
        focus() {
            const context = this;
            valueTextArr = [];
            Vue.nextTick(() => {
                context.$el.focus();
            });
        },
        getValue() {
            return {
                text: this.value,
                at: this.atSelectedMembers,
            };
        },
        setValue(value) {
            this.value = value.text;
            this.atSelectedMembers = value.at;
        },
        appendValue(value) {
            this.value += value.text;
            Array.prototype.push.apply(this.atSelectedMembers, value.at);
            this.focus();
        },
        insertText(str) {
            const el = this.$el;
            let cursorOffset = getCursorOffset(el);
            let text = el.value;

            const beforeCursorStr = text.substring(0, cursorOffset);
            const afterCursorStr = text.substring(el.selectionEnd);

            text = beforeCursorStr + str + afterCursorStr;
            el.value = text;

            cursorOffset += str.length;
            el.focus();
            el.setSelectionRange(cursorOffset, cursorOffset);

            this.value = text;
        },
        saveDraft() {
            // 此处执行了输入框blur事件，将ctrl键的按下状态恢复，避免按下ctrl的同时，焦点离开输入框使ctrol状态混乱
            isCtrlOrCommand = false;
            const conversationApi = this.$im().dataModel.Conversation;
            const params = this.$route.params;
            const conversationType = params.conversationType;
            const targetId = params.targetId;
            const Olddraft = conversationApi.getDraft(conversationType, targetId);
            let newDraftContent = this.value;
            if (Olddraft.content === newDraftContent) {
                return;
            }
            if (isEmpty((this.value || '').trim())) {
                newDraftContent = '';
            }
            const draft = {
                content: newDraftContent,
                atMembers: newDraftContent ? this.atSelectedMembers : [],
                editTime: newDraftContent ? Date.now() : 0,
            };
            conversationApi.setDraft(conversationType, targetId, draft);
        },
        selectAtMember(member) {
            selectAtMember(this, member);
        },
        findIndexSelectedMemberByName(name) {
            return findIndexSelectedMemberByName(this, name);
        },
        searchAtRemove(event) {
            searchAtRemove(this, event);
        },
        enter() {
            const message = this.getValue();
            if (!this.checkSendEnable(message)) {
                return;
            }
            this.clear();
            this.$emit('enter', message);
        },
        keydown(event) {
            keydown(this, event, this.$im().auth.id);
        },
        keyup(event) {
            keyup(this, event, this.$im().auth.id);
        },
        prepareinput() {
            const len = this.value.length;
            if (len === 0) {
                return;
            }
            if (valueTextArr.length === 0 || len !== valueTextArr[valueTextArr.length - 1].length) {
                valueTextArr.push(this.value);
                // console.log(valueTextArr);
            }
            this.$emit('prepareinput');
        },
        clear() {
            this.atSelectedMembers = [];
            this.value = '';
        },
        scrollToInput() {
            const textNode = this.$el;
            textNode.blur();
            textNode.focus();
        },
        updateInput(event) {
            const context = this;
            this.value = event.target.value;
            if (this.value.length > MaxLen) {
                this.value = this.value.substr(0, MaxLen);
            }
            context.$emit('editBoxChange', context.getValue().text);
            // Mac 下输入框中 emoji 字符会重叠占位较窄拼接空格拉开距离
            dealWithEmoji(context, (value, index) => {
                let isValid = true;
                if (index || index === 0) {
                    index += value.length;
                    const space = context.value.substring(index, index + 1);
                    isValid = space !== ' ';
                }
                return isValid ? `${value} ` : value;
            }, emojiReg.native);
        },
    },
};

function mounted(context, conversationApi) {
    const params = context.$route.params;
    const draft = conversationApi.getDraft(params.conversationType, params.targetId);
    context.atSelectedMembers = draft.atMembers || [];
    context.value = draft.content || '';

    if (context.autoFocus) {
        Vue.nextTick(() => {
            context.$el.focus();
        });
    }

    $(context.$el).on('paste', (event) => {
        context.$emit('paste', event.originalEvent);
    });

    context.at = new At(context.$el);

    getAtPanel((option) => {
        const AtPanel = Vue.extend(option);
        const atPanelInstance = new AtPanel();
        atPanelInstance.$on('atPanelClickSelect', (data) => {
            context.selectAtMember(data);
        });
        atPanelInstance.$mount();
        context.$el.parentNode.insertBefore(atPanelInstance.$el, context.$el);
        context.atPanel = atPanelInstance;
    });
}

/*
说明： 计算 @ 列表显示位置调用 render 方法渲染到页面
*/
function renderAtpanel(params) {
    const height = document.body.clientHeight;
    // console.time('get cursor pos');
    const cursorPostion = params.at.getCursorPos();
    // console.timeEnd('get cursor pos');
    const left = cursorPostion.left;
    const bottom = height - cursorPostion.top;
    const atPanelStyle = {
        position: 'fixed',
        left: `${left}px`,
        bottom: `${bottom}px`,
    };
    const showAtall = !params.at.matchStr.text || params.at.matchStr.text.length === 0;
    params.atPanel.render(params.atFilterMembers, atPanelStyle, showAtall);
}

/*
说明： 根据 @ 字符串搜索成员
*/
function searchAtShowMembers(context, authId) {
    const atStr = context.at.inputMatch();
    if (isEmpty(atStr)) {
        context.atFilterMembers = [];
        return;
    }
    const members = searchMember(context.atMembers, atStr.text);
    context.atFilterMembers = members.filter(item => item.id !== authId);
}

/*
说明： 确认选择 @ 成员，添加到已选择列表
*/
function selectAtMember(context, member) {
    context.atSelectedMembers.push(member);
    const text = context.at.insert(member.name);
    context.value = text;
    context.atFilterMembers = [];
}

/*
说明： 根据名称查找是否存在已选择列表当中（目前用于删除）
*/
function findIndexSelectedMemberByName(context, name) {
    const arr = context.atSelectedMembers;
    for (let i = 0, len = arr.length; i < len; i += 1) {
        if (name === arr[i].name) {
            return i;
        }
    }
    return -1;
}

/*
说明： 删除单个 @ 成员
*/
function searchAtRemove(context, event) {
    const atStr = context.at.removeMatch();
    if (isEmpty(atStr)) {
        return;
    }
    if (event.keyCode === KEYCODE.backspace && atStr.cursorPos === 'before') {
        return;
    }
    if (event.keyCode === KEYCODE.delete && atStr.cursorPos === 'after') {
        return;
    }
    const index = context.findIndexSelectedMemberByName(atStr.text);
    if (index > -1) {
        event.preventDefault();
        context.atSelectedMembers.splice(index, 1);
        context.value = context.at.remove(atStr);
    }
}

/*
说明： 删除选中区域（多个文字）时查找删除字符串当中是否包含已选 @ 成员
*/
function delSelection(context) {
    const el = context.$el;
    const startP = el.selectionStart;
    const endP = el.selectionEnd;
    if (startP !== endP) {
        const delCount = endP - startP;
        const deleteValue = context.value.substr(startP, delCount);
        context.value.slice(startP, delCount);

        for (let i = context.atSelectedMembers.length - 1; i > -1; i -= 1) {
            const item = context.atSelectedMembers[i];
            if (deleteValue.indexOf(`@${item.name}`) > -1) {
                context.atSelectedMembers.splice(i, 1);
            }
        }
        return true;
    }
    return false;
}

function delValue(context, event) {
    if (delSelection(context)) {
        return;
    }
    context.searchAtRemove(event);
}

const debounceSearch = debounce(searchAtShowMembers, 200);
isCtrlOrCommand = false;
// TODO: 使用键值对优化算法，避免频繁比对
function keydown(context, event, authId) {
    if (event.code === 'MetaLeft') {
        isCtrlOrCommand = true;
    }
    let params;
    switch (event.keyCode) {
    case KEYCODE.enter:
        enter(context, event);
        break;
    case KEYCODE.up:
        up(context, event);
        break;
    case KEYCODE.down:
        if (context.atFilterMembers.length) {
            event.preventDefault();
            context.atPanel.next();
        }
        break;
    case KEYCODE.left:
        params = {
            value: context.value,
            el: context.$el,
            keycode: KEYCODE.left,
        };
        moveEmojiTag(params);
        break;
    case KEYCODE.right:
        params = {
            value: context.value,
            el: context.$el,
            keycode: KEYCODE.rirognght,
        };
        moveEmojiTag(params);
        break;
    case KEYCODE.esc:
        context.atFilterMembers = [];
        break;
    case KEYCODE.backspace:
        dealWithEmoji(context, () => ' ', emojiReg.delete);
        delValue(context, event);
        break;
    case KEYCODE.delete:
        delValue(context, event);
        break;
    case 229:
        debounceSearch(context, authId);
        break;
    case KEYCODE.ctrl:
        isCtrlOrCommand = true;
        break;
    case KEYCODE.z:
        if (isCtrlOrCommand) {
            if (valueTextArr.length === 0) {
                context.value = '';
            } else if (valueTextArr[valueTextArr.length - 1] === context.value) {
                valueTextArr.pop();
                context.value = valueTextArr.length === 0 ? '' : valueTextArr.pop();
            } else {
                context.value = valueTextArr.pop();
            }
        }
        break;
    default:
        break;
    }
}

function up(context, event) {
    if (context.atFilterMembers.length) {
        event.preventDefault();
        context.atPanel.prev();
    }
}

function enter(context, event) {
    if (!event.ctrlKey && !event.shiftKey) {
        event.preventDefault();
        if (context.atFilterMembers.length) {
            context.selectAtMember(context.atPanel.getValue());
        } else {
            context.enter();
        }
    }
}

function keyup(context, event, authId) {
    if (event.code === 'MetaLeft') {
        isCtrlOrCommand = false;
    }
    switch (event.keyCode) {
    case KEYCODE.ctrl:
        isCtrlOrCommand = false;
        break;
    case KEYCODE.up:
    case KEYCODE.down:
    case KEYCODE.esc:
        break;
    default:
        if (
            [50, KEYCODE.backspace, KEYCODE.enter, KEYCODE.shift].indexOf(event.keyCode) > -1
        || context.atFilterMembers.length
        ) {
            debounceSearch(context, authId);
        }
        convertTextToEmoji(context);
        break;
    }
}

/*
说明： 根据 @ 字符串 搜索成员
*/
function searchMember(members, keyword) {
    if (!$.isArray(members) || $.type(keyword) !== 'string') {
        return [];
    }
    // 深拷贝一个数组防止修改原来数组内对象
    members = $.extend(true, [], members);
    if (isEmpty(keyword)) {
        return members;
    }

    const resultArr = [];
    // eg.  As中文 => as中文
    keyword = keyword.toLowerCase();
    for (let i = 0, len = members.length; i < len; i += 1) {
        const user = members[i];
        if (matchUser(user, keyword)) {
            resultArr.push(user);
        }
    }
    return resultArr;
}
// 此 at 字符串是否可以匹配到此用户
function matchUser(user, keyword) {
    const name = user.name;
    const nameLetter = convertToABC(name);
    const alias = user.alias || '';
    const aliasLetter = convertToABC(alias);
    const sign = '\u0000';
    const matchList = [
        name,
        nameLetter.pinyin,
        nameLetter.first,
        alias,
        aliasLetter.pinyin,
        aliasLetter.first,
    ];
    const str = matchList.join(sign);
    return str.toLowerCase().indexOf(keyword) !== -1;
}

function getCursorOffset(el) {
    return el.selectionStart;
}

/*
说明： 处理 emoji 字符 根据传入 replaceReg 替换调用 repeatFunc
*/
function dealWithEmoji(context, repeatFunc, replaceReg) {
    const isDeal = context.value && isEmojiOverlap() && RongIMEmoji.isSupportEmoji;
    if (!isDeal) {
        return;
    }
    let cursorOffset = getCursorOffset(context.$el);
    const beforeValue = context.value.substring(0, cursorOffset);
    const afterValue = context.value.substring(cursorOffset);
    const replaceValue = beforeValue.replace(replaceReg, (value, p, index) => repeatFunc(value, index));
    const changeCount = replaceValue.length - beforeValue.length;
    const value = replaceValue + afterValue;
    if (changeCount) {
        cursorOffset += changeCount;
        context.$el.value = value;
        context.$el.focus();
        context.$el.setSelectionRange(cursorOffset, cursorOffset);
        context.value = value;
    }
}

function moveEmojiTag(params) {
    if (!isEmojiOverlap() || !RongIMEmoji.isSupportEmoji) {
        return;
    }
    const keycode = params.keycode;
    const el = params.el;
    let cursorOffset = getCursorOffset(el);
    const beforeValue = params.value.substring(0, cursorOffset);
    const afterValue = params.value.substring(cursorOffset);
    const leftReg = emojiReg.moveLeft;
    const rightReg = emojiReg.moveRight;
    if (keycode === KEYCODE.left && beforeValue.match(leftReg)) {
        cursorOffset -= 1;
        el.setSelectionRange(cursorOffset, cursorOffset);
    }
    if (keycode === KEYCODE.right && afterValue.match(rightReg)) {
        cursorOffset += 1;
        el.setSelectionRange(cursorOffset, cursorOffset);
    }
}

function convertTextToEmoji(context) {
    if (!RongIMEmoji.isSupportEmoji) {
        return;
    }
    let value = context.value;
    if (value.length === 0) {
        return;
    }
    const reg = EmojiRegExp;
    if (!reg.test(value)) {
        return;
    }
    const matchValue = value.match(reg)[0];
    const beforeIndex = value.indexOf(matchValue);
    let afterIndex;
    value = value.replace(matchValue, (name) => {
        const emoji = RongIMEmoji.symbolToEmoji(name);
        afterIndex = beforeIndex + emoji.length;
        return emoji;
    });
    if (afterIndex) {
        const el = context.$el;
        el.value = value;
        el.focus();
        el.setSelectionRange(afterIndex, afterIndex);
        context.value = value;
    }
}

function At(el) {
    this.el = el;
    this.matchStr = {};
}

At.prototype.inputMatch = function inputMatch() {
    const cursorOffset = getCursorOffset(this.el);
    const text = this.el.value;
    const beforeCursorStr = text.slice(0, cursorOffset);

    const reg = new RegExp('(?:[^0-9a-z]|^)@([^\u0020@]*)$', 'i');
    const atMatch = reg.exec(beforeCursorStr);
    if (atMatch) {
        const atText = atMatch[1];
        const start = cursorOffset - atText.length;
        this.matchStr = {
            text: atText,
            start,
            end: cursorOffset,
        };
        return this.matchStr;
    }
    return undefined;
};

// 获取光标 相对页面位置
At.prototype.getCursorPos = function getCursorPos() {
    const cursorPostion = $(this.el).caret('offset', this.matchStr.start - 1);
    return cursorPostion;
};

At.prototype.insert = function insert(str) {
    let text = this.el.value;
    const end = Math.max(this.matchStr.start, 0);
    const beforeAtStr = text.substring(0, end);
    const atText = `${str} `;
    const afterAtStr = text.substring(this.matchStr.end);

    text = beforeAtStr + atText + afterAtStr;
    this.el.value = text;
    this.el.focus();
    const cursorOffset = beforeAtStr.length + atText.length;
    $(this.el).caret('pos', cursorOffset);

    return text;
};

At.prototype.removeMatch = function removeMatch() {
    const text = this.el.value;
    const cursorOffset = getCursorOffset(this.el);
    let cursorScroll = cursorOffset;

    // 匹配光标在 atText 中间或之前
    const afterCursorStr = text.substring(cursorScroll);
    const afterReg = /(^[^\u0020@]*\u0020)|(^@[^\u0020@]+\u0020)/;
    const afterCursorAtMatch = afterReg.exec(afterCursorStr);

    // 将游标移至 atText 之后
    if (afterCursorAtMatch) {
        cursorScroll += afterCursorAtMatch[0].length;
    }

    // 截取游标之前的字符串
    const beforeCursorStr = text.substring(0, cursorScroll);

    // 匹配游标前的 atText
    const allReg = /@([^\u0020@]+)\u0020$/;
    const atMatch = allReg.exec(beforeCursorStr);

    if (atMatch) {
        const atText = atMatch[1];
        const start = cursorScroll - atMatch[0].length;
        let cursorPos = '';
        if (cursorOffset === start) {
            cursorPos = 'before';
        } else if (cursorOffset === cursorScroll) {
            cursorPos = 'after';
        } else {
            cursorPos = 'amongst';
        }
        return {
            cursorPos,
            text: atText,
            start,
            end: cursorScroll,
        };
    }
    return undefined;
};

At.prototype.remove = function remove(matchStr) {
    const text = this.el.value;
    const beforeCursorStr = text.substring(0, matchStr.start);
    const afterCursorStr = text.substring(matchStr.end);
    const value = beforeCursorStr + afterCursorStr;

    this.el.value = value;
    this.el.focus();
    $(this.el).caret('pos', matchStr.start);

    return value;
};

function getEmojiEditReg() {
    const regMark = 'ig';
    let tagReg = emojiNativeReg.toString();
    tagReg = tagReg.substring(1, tagReg.length - 3);
    const nativeReg = new RegExp(tagReg, regMark);
    // 删除时, 匹配 emoji + 空格
    let deleteReg = `${tagReg}([ ])(?=$)`;
    deleteReg = new RegExp(deleteReg, regMark);
    // 添加时, 匹配 emoji && 后面无空格
    let addReg = `${tagReg}(?=[^ ]|$)`;
    addReg = new RegExp(addReg, regMark);
    // 向右移动时, 匹配 emoji && 处于开始位置
    let moveRightReg = '^{{reg}}';
    moveRightReg = moveRightReg.replace('{{reg}}', tagReg);
    moveRightReg = new RegExp(moveRightReg, regMark);
    return {
        native: nativeReg,
        add: addReg,
        delete: deleteReg,
        moveLeft: deleteReg,
        moveRight: moveRightReg,
    };
}
