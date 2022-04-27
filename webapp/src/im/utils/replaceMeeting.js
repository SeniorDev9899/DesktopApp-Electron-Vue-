export default function replaceMeetingId(str) {
    let result = '';
    const reg = /meeting:\/{2}[\d\w-]+(?=，)/g;
    result = str.replace(reg,
        meetingId => `<a href="javascript:;" class="meeting-id">${meetingId}</a>`);
    return result;
}

// export function matchMeetingNumber(str) {
//     const match1 = str.match(/会议号[：]\s*[\d\w-]+(?!\d)/g);
//     const match2 = str.match(/number[：]\s*[\d\w-]+(?!\d)/g);
//     return match1 || match2;
// }
