// 缓存结果，其值在加载时已确定，无需实时计算
// 在 Mac 非高分屏 Chrome 浏览器下, emoji会出现与文字重叠现象. 原因: chrome渲染
import system from '../system';
import getBrowser from './getBrowser';

const platform = system.platform;
const isOSX = platform.indexOf('darwin') !== -1;
const browserType = getBrowser().type;
const isChrome = browserType.toLowerCase() === 'chrome';
const isNotRetina = window.devicePixelRatio <= 1;
const isEmojiOverlapValue = isOSX && isChrome && isNotRetina;
export default function isEmojiOverlap() {
    return isEmojiOverlapValue;
}
