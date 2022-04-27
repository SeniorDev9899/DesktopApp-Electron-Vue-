/* eslint-disable no-param-reassign */

function optional(elem) {
    return !$(elem).val();
}

function checkable(elem) {
    return /radio|checkbox/i.test(elem.type);
}

function getLength(value, elem) {
    switch (elem.nodeName.toLowerCase()) {
    case 'select':
        return $('option:selected', elem).length;
    case 'input':
        if (checkable(elem)) {
            const $field = $(elem)
                .closest('form')
                .find(`[name="${elem.name}"]`);
            return $field.filter(':checked').length;
        }
        break;
    default:
    }
    return value.length;
}

function getRange(param) {
    const range = param.match(/(\d+)\s*,\s*(\d+)/);
    if (range) {
        return [Number(range[1]), Number(range[2])];
    }
    return range;
}

const methods = {
    required(value /* , elem, param */) {
    // 不能为空
        return value.length > 0;
    },
    mobile(value, elem /* , param */) {
    // 手机号验证
        return optional(elem) || /^1\d{10}$/.test(value);
    },
    equalto(value, elem, param) {
    // 和表单中的另一个元素的value相同
        return (
            optional(elem)
      || value
        === $(elem)
            .closest('form')
            .find(param)
            .val()
        );
    },
    mix(value, elem, param) {
    // 最小值
        return optional(elem) || value >= param;
    },
    max(value, elem, param) {
    // 最大值
        return optional(elem) || value <= param;
    },
    minlength(value, elem, param) {
    // 最小长度
        const length = $.isArray(value) ? value.length : getLength(value, elem);
        return optional(elem) || length >= param;
    },
    maxlength(value, elem, param) {
    // 最大长度
        const length = $.isArray(value) ? value.length : getLength(value, elem);
        return optional(elem) || length <= param;
    },
    range(value, elem, param) {
    // 范围
        const range = getRange(param);
        if (!range) {
            return true;
        }
        return optional(elem) || (value >= range[0] && value <= range[1]);
    },
    rangelength(value, elem, param) {
    // 范围长度
        const range = getRange(param);
        if (!range) {
            return true;
        }
        const length = getLength(value, elem);
        return optional(elem) || (length >= range[0] && length <= range[1]);
    },
    specialsymbol(value, elem, param) {
    // 特殊字符验证
        const specialsymbol = param.split(',');
        let hasSpecialSymbol = false;
        specialsymbol.forEach((symbol) => {
            if (value.indexOf(symbol) !== -1) {
                hasSpecialSymbol = true;
            }
        });
        return optional(elem) || !hasSpecialSymbol;
    },
    password(value) {
        // 密码验证
        // const num = /[0-9]+/;
        // const letter = /[a-zA-Z]+/;
        // const containNum = num.test(value);
        // const containLetter = letter.test(value);
        // var invalidSign = /[^0-9a-zA-Z~`@#$%^&*\-_=+\|\\?/()<>\[\]{}",.;'!]+/;
        // var validSign = !invalidSign.test(value);
        // return containNum && containLetter && validSign;
        // return containNum && containLetter;
        const reg = /^[^\s]+$/;
        return reg.test(value);
    },
    // 验证会议号
    number(value, elem) {
        return optional(elem) || /^[0-9]{1,12}$/.test(value);
    },
    // 验证会议主题
    subject(value, elem) {
        return optional(elem) || /^(?!\\s)[\u4E00-\u9FA5 A-Za-z0-9_]{1,20}$/.test(value);
    },

    // 验证会议密码
    meetingpassword(value, elem) {
        return optional(elem) || /^[0-9]{4,6}$/.test(value);
    },
};

function getRules(field) {
    const rules = {};
    $.each($(field).data(), (key, value) => {
        if (key.slice(0, 4) === 'rule') {
            const name = key.slice(4).toLowerCase();
            rules[name] = value;
        }
    });
    return rules;
}

function validateField(context, event) {
    const field = event.target;
    const tabKey = (event.key || '').toLowerCase() === 'tab';
    const tabKeyCode = event.keyCode === 9;
    const isTab = tabKey || tabKeyCode;
    const enterKey = (event.key || '').toLowerCase() === 'enter';
    const enterKeyCode = event.keyCode === 13;
    const isEnter = enterKey || enterKeyCode;
    if (isTab || isEnter) {
        return;
    }
    Vue.delete(context.errors, field.name);
    $.each(getRules(field), (key, value) => {
        const valid = methods[key]($(field).val(), field, value);
        if (!valid) {
            const message = valid ? null : $(field).data(`message-${key}`);
            Vue.set(context.errors, field.name, message);
        }
        return valid;
    });
}

function init() {
    const context = this;
    const selector = 'input, textarea, select';
    $(context.$el)
        .on('blur check', selector, (event) => {
            validateField(context, event);
        })
        .on('focus keyup', selector, (event) => {
            const isTab = (event.key || '').toLowerCase() === 'tab' || event.keyCode === 9;
            const isEnter = (event.key || '').toLowerCase() === 'enter' || event.keyCode === 13;
            if (isTab || isEnter) {
                return;
            }
            Vue.delete(context.errors, event.target.name);
        });
}

/*
表单验证
说明：
    对form中表单元素进行验证，可自定义规则
    初始化执行init方法，对input, textarea, select标签进行验证
    绑定失去焦点、键盘等事件，当事件触发时进行表单验证
*/
function getValidate(options) {
    options = options || {};
    $.extend(methods, options.methods);
    return {
        name: 'validate',
        data() {
            return {
                errors: {},
            };
        },
        computed: {
            isValid() {
                const errors = JSON.parse(JSON.stringify(this.errors));
                return $.isEmptyObject(errors);
            },
        },
        mounted: init,
        methods: {
            valid(selector) {
                const self = this;
                selector = selector || 'input, textarea, select';
                const $fieldList = $(self.$el)
                    .find(selector)
                    .trigger('check');
                const errors = {};
                $fieldList.each(function temp() {
                    const name = $(this).attr('name');
                    if (self.errors[name]) {
                        errors[name] = self.errors[name];
                    }
                });
                return $.isEmptyObject(errors);
            },
        },
    };
}

export default getValidate;
