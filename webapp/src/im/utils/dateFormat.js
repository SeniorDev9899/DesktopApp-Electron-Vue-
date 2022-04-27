/* eslint-disable no-underscore-dangle */
/* eslint-disable no-param-reassign */
import config from '../config';

function updateLocale() {
    moment.updateLocale(moment.locale(), {
        week: {
            dow: 7,
        },
        meridiem(hour, minute) {
            const locale = config.currentLocale();
            const hm = hour * 100 + minute;
            if (hm < 600) {
                return locale.time.morning;
                // 文档中没有早上这个时间段
                // } else if (hm < 900) {
                //     return '早上';
            } if (hm < 1130) {
                return locale.time.forenoon;
            } if (hm < 1230) {
                return locale.time.noon;
            } if (hm < 1800) {
                return locale.time.afternoon;
            }
            return locale.time.evening;
        },
    });
}

export default function dateFormat(timestamp, options) {
    const locale = config.currentLocale();
    options = $.extend({
        alwaysShowTime: false,
        timeHour: 24, /* 24小时制 */
    }, options);
    if (dateFormat._init !== 'done') {
        updateLocale();
        dateFormat._init = 'done';
    }
    const now = moment();
    const date = moment(timestamp);
    let hourTime = options.timeHour === 24 ? 'H' : ' A h';
    hourTime = ' H:mm'.replace(/H/ig, hourTime);
    const time = options.alwaysShowTime ? date.format(hourTime) : '';
    if (options.showAll) {
        return date.format(locale.time.format) + time;
    }
    if (date.isSame(now, 'day')) {
        return date.format(hourTime);
    }
    const yesterday = now.add(-1, 'days');
    if (date.isSame(yesterday, 'day')) {
        // return date.format(locale.time.yesterday + time);
        return locale.time.yesterday + time;
    }
    if (date.isSame(now, 'week')) {
        if (date.isSame(now, 'month')) {
            const dayOfWeek = locale.time.week[date.weekday()];
            return dayOfWeek + time;
        }
        return date.format('M/D') + time;
    }
    if (date.isSameOrBefore(now, 'month') && date.isSame(now, 'year')) {
        return date.format('M/D') + time;
    }
    return date.format(locale.time.format) + time;
}
