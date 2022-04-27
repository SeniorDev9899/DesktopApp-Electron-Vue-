// 数字转化，每3位增加一个逗号，数字必须为整数
export default function toThousands(num) {
    return (num || 0).toString().replace(/(\d)(?=(?:\d{3})+$)/g, '$1,');
}
