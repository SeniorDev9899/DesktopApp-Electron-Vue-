export default function getResizeDirection(params) {
    // 实时距离
    const { range, bound, directions } = params;

    const min = parseInt(bound.min);
    const max = parseInt(bound.max);

    const pre = (directions[0] === 'left') ? 'x' : 'y';
    let prop = 'normal';
    if ((range + 5) >= max) {
        prop = directions[0];
    } else if (range <= min) {
        prop = directions[1];
    } else {
        prop = 'middle';
    }
    return [pre, prop].join('-');
}
