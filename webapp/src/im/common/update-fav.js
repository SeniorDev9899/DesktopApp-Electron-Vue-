function createFav(unReadCount) {
    const size = 32;
    const longer = 20;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;

    const context = canvas.getContext('2d');

    // 绘制icon
    // context.drawImage(img, longer, 0, size, size);

    // 绘制红色圆
    const r = longer / 2;
    context.strokeStyle = '#f45349';
    context.fillStyle = '#f45349';
    context.beginPath();
    context.arc(r + 5, r + 5, r * 1.5, 0, Math.PI * 2, false);
    // arc(x, y, radius, startAngle, endAngle, anticlockwise)

    context.closePath();
    context.stroke();
    context.fill();

    // 绘制未读数
    let number = 0;
    if (unReadCount < 10) {
        number = ` ${unReadCount}`;
    } else if (unReadCount < 100) {
        number = `${unReadCount}`;
    } else {
        // number = '…';
        number = '⋯';
    }
    context.font = `${size * 0.6}px Arial`;
    context.textBaseline = 'top';

    context.fillStyle = '#ffffff';

    context.fillText(number, 5, 4);

    // 返回fav图标
    return canvas.toDataURL('image/png');
}

function updateFav(RongIM, fav) {
    const { auth, unReadCount, pinUnReadCount } = RongIM.instance;
    const normalUnReadCount = unReadCount;
    const value = fav || normalUnReadCount + pinUnReadCount.unConfirm;
    const $fav = $('link[rel=icon]');
    const defaultValue = $fav.data('default-value') || $fav.attr('href');
    $fav.data('default-value', defaultValue);
    const href = value > 0 && auth ? createFav(value) : defaultValue;
    $fav.attr('href', href);
}

export default updateFav;
