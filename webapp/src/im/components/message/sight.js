/* eslint-disable no-param-reassign */
import Base64Util from '../../utils/Base64Media';
import { messageIfSupportView } from '../../utils/netEnvironment';

function secondsToTime(seconds) {
    const hours = Math.floor(seconds / (60 * 60));
    seconds -= hours * (60 * 60);
    const minutes = Math.floor(seconds / 60);
    seconds -= minutes * 60;
    let result = hours > 0 ? `${hours}:` : '';
    result += `${minutes}:${seconds > 9 ? seconds : `0${seconds}`}`;
    return result;
}

export default {
    name: 'sight-message',
    props: ['message'],
    data() {
        return {
            downloading: false,
            uploading: false,
            progress: 0,
        };
    },
    computed: {
        base64() {
            const sightMessage = this.message.content;
            const content = sightMessage.content;
            return Base64Util.concat(content);
        },
        path() {
            let percent = (this.progress || 0) / 100;
            if (percent === 1) {
                percent = 0.99;
            }
            const r = 18;
            const degrees = percent * 360;
            const rad = degrees * (Math.PI / 180);
            const x = (Math.sin(rad) * r).toFixed(2);
            const y = -(Math.cos(rad) * r).toFixed(2);
            const lenghty = window.Number(degrees > 180);
            const a = ['M', 0, -r, 'A', r, r, 0, lenghty];
            const b = [1, x, y, 'L', 0, 0, 'Z'];
            let path = a.concat(b);
            path = path.join(' ');
            return path;
        },
        seconds() {
            return secondsToTime(this.message.content.duration);
        },
    },
    watch: {
        'message.progress': function onprogress(newValue) {
            this.uploading = newValue < 100;
            this.progress = newValue;
        },
    },
    created() {
        const [url, noSupportView] = messageIfSupportView(this.message.content.sightUrl);
        this.message.content.sightUrl = url;
        this.message.noSupportView = noSupportView;
    },
    methods: {
        play() {
            if (this.message.noSupportView || this.downloading) {
                return;
            }
            this.$emit('showSight', this.message);
        },
    },
};
