/* eslint-disable no-param-reassign */
import getLocaleMixins from '../../utils/getLocaleMixins';
import addReceivers from '../../dialog/seal-meeting/add-receiver';
import avatar from '../avatar.vue';
import userProfile from '../../dialog/contact/user';
import config from '../../config';
import validate from '../mixins/validate';
import customSelect from '../custom-select.vue';
import sendPin from './share';

export default {
    name: 'meetingSchedule',
    data() {
        return {
            formData: {
                subject: '',
                startTime: '',
                duration: '1',
                enablePassword: false,
                linkTitle: '',
            },
            password: '',
            receivers: [],
            selectedTime: '',
            isSpecificTimeSelecting: false,
            isSending: false,
            durationList: [],
        };
    },
    components: {
        avatar,
        customSelect,
    },
    mixins: [getLocaleMixins('meetingSchedule'), validate()],
    mounted() {
        for (let i = 0; i < 6; i += 1) {
            const hour = ((i + 1) * 0.5).toString();
            this.durationList.push({ label: hour + this.locale.hour, value: hour });
        }
        const im = this.$im();
        if (im.loginUser) {
            // 41232 - 【会议】预约会议，会议主题里应显示默认主题
            this.formData.subject = im.loginUser.name + this.locale.subjectTip1;
        }
        this.selectedTime = getNowTime();
        this.formData.startTime = this.getFormatDate();
    },
    methods: {
        userProfile,
        addMembers() {
            addReceivers(this.receivers, this.receivers).done(
                (selectedReceivers) => {
                    this.receivers = selectedReceivers;
                },
            );
        },
        selectSpecificTime() {
            this.isSpecificTimeSelecting = true;
        },
        getDateItems() {
            const locale = config.currentLocale().components.newPin;
            return [locale.year, locale.month, locale.day, locale.hour, locale.minute];
        },
        getFormatDate(type) {
            const date = new Date(this.selectedTime);
            return formatDate(type, date);
        },
        calcDate,
        closeSelectTime(event) {
            const $target = $(event.target);
            const wrap = '.position-right, .rong-pin-select-time, .rong-pin-select-sepcific-time, .rong-pin-select-time-box, .rong-pin-select-type-box';
            const inBody = $target.closest('body').length > 0;
            const inWrap = $target.closest(wrap).length < 1;
            const isOuter = inBody && inWrap;
            if (this.isSpecificTimeSelecting && isOuter) {
                this.isSpecificTimeSelecting = false;
            }
        },
        removeReceiver(index) {
            this.receivers.splice(index, 1);
        },
        sendPinMeeting() {
            const context = this;
            if (context.isSending || !context.valid()) {
                return;
            }
            if (context.formData.enablePassword && !context.validPassword()) {
                return;
            }
            context.isSending = true;
            const params = {
                subject: context.formData.subject,
                startDt: context.selectedTime,
                endDt: context.selectedTime + context.formData.duration * 3600 * 1000,
                meetingNumber: context.formData.number,
                password: context.formData.enablePassword ? context.password : '',
            };

            const meetingApi = context.$im().dataModel.Meeting;
            meetingApi.schedule(params).then((resultData) => {
                resultData.startTime = context.formData.startTime;
                resultData.duration = context.formData.duration;
                sendPin(context.$im(), context.receivers, resultData, context.locale, () => {
                    context.isSending = false;
                    context.$router.push({ name: 'pin-sent' });
                });
            }, (errorCode) => {
                context.$im().RongIM.common.toastError(errorCode);
                context.isSending = false;
            });
        },
        upPage() {
            this.$router.push({
                name: 'seal-meeting',
            });
        },
        validPassword() {
            let errorTip = '';
            if (!this.password) {
                errorTip = this.locale.passwordPlaceholder;
            } else if (!/^[0-9]{4,6}$/.test(this.password)) {
                errorTip = this.locale.passwordRule;
            }
            this.$set(this.errors, 'password', errorTip);
            return !errorTip;
        },
    },
    watch: {
        $route() {
            const im = this.$im();
            im.RongIM.common.resizeNavNode(this);
        },
        password() {
            this.validPassword();
        },
    },
};

function calcDate(dateType, addNumber) {
    const date = new Date(this.selectedTime);
    switch (dateType) {
    case 0:
        date.setFullYear(date.getFullYear() + addNumber);
        break;
    case 1:
        date.setMonth(date.getMonth() + addNumber);
        break;
    case 2:
        date.setDate(date.getDate() + addNumber);
        break;
    case 3:
        date.setHours(date.getHours() + addNumber);
        break;
    case 4:
        date.setMinutes(date.getMinutes() + addNumber);
        break;
    default:
        break;
    }
    const thisTime = new Date().getTime();
    if ((thisTime - date.getTime()) > 30 * 1000) {
        this.$im().RongIM.common.messageToast({
            type: 'error',
            message: config.currentLocale().components.newPin.pastTime,
        });
        return;
    }
    date.setSeconds(0);
    date.setMilliseconds(0);
    this.selectedTime = date.getTime();
    this.formData.startTime = this.getFormatDate();
}

function addZeroWhenSingle(number) {
    return `${number}`.length > 1 ? number : `0${number}`;
}

function formatDate(type, date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour = date.getHours();
    const minute = date.getMinutes();
    switch (type) {
    case 0:
        return year;
    case 1:
        return month;
    case 2:
        return day;
    case 3:
        return hour;
    case 4:
        return minute;
    default:
        return `${year}/${month}/${day} ${addZeroWhenSingle(
            hour,
        )}:${addZeroWhenSingle(minute)}`;
    }
}

function getNowTime() {
    const date = new Date();
    date.setMilliseconds(0);
    date.setSeconds(0);
    date.setMinutes(60);
    return date.getTime();
}
