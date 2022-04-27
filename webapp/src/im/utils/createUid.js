/* eslint-disable no-mixed-operators */
/* eslint-disable no-bitwise */
// 创建一个Uid
export default function createUid() {
    let date = new Date().getTime();
    const uuid = 'xxxxxx4xxxyxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (date + Math.random() * 16) % 16 | 0;
        date = Math.floor(date / 16);
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    return uuid;
}
