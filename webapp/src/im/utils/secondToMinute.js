import prefixZero from './prefixZero';

export default function secondToMinute(val) {
    const value = Math.round(val);
    return `${prefixZero(Math.floor(value / 60))}:${prefixZero(value % 60)}`;
}
