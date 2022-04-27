const match = window.location.href.match(/langulage=([a-zA-Z]+)/);
const locale = match ? match[1] : 'zh';
export default {
    minSize: {
        image: { width: 340, height: 250 },
        video: { width: 460, height: 380 },
    },
    maxSize: {
        image: { width: 340, height: 250 },
        video: { width: 460, height: 380 },
    },
    locale,
};
