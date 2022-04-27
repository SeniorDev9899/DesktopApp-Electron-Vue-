// 复制到剪切板
export default function copyToClipboard(str) {
    if (window.copy) {
        window.copy(str);
    } else if (document.execCommand) {
        const input = document.createElement('input');
        input.style.position = 'fixed';
        input.style.top = '-99999999px';
        const $input = $('<textarea></textarea>').css({
            position: 'fixed',
            left: '-99999999px',
        });
        $(document.body).append($input);
        $input.val(str);
        $input.select();
        document.execCommand('copy');
        $input.remove();
    }
}
