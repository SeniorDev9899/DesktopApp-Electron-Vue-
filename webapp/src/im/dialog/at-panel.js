/* eslint-disable no-param-reassign */
import avatar from '../components/avatar.vue';
import asyncComponent from '../utils/asyncComponent';
/*
说明：'@' 时成员列表显示
功能：
    1. render 根据传入参数在页面渲染 '@' 列表
    2. prev 选择前一个（键盘方向键上下选择）
    3. next 选择后一个
    4. getValue 获取当前选中的
备注：
    @所有人 id 为 0
*/
export default function (resolve, reject) {
    const options = {
        name: 'at-panel',
        template: '#rong-template-at-panel',
        components: {
            avatar,
        },
        data() {
            return {
                positionStyle: {},
                list: [],
                isShow: false,
                value: null,
            };
        },
        mounted() {
            const context = this;
            const im = context.$im();
            im.$on('imclick', () => {
                context.isShow = false;
            });
        },
        methods: {
            getValue() {
                return this.value;
            },
            render,
            prev() {
                const result = getNextOrPrev(this.list, this.value, -1);
                this.value = result.item;
                this.scrollHandle(result.index);
            },
            next() {
                const result = getNextOrPrev(this.list, this.value, +1);
                this.value = result.item;
                this.scrollHandle(result.index);
            },
            clickSelect(member) {
                this.$emit('atPanelClickSelect', member);
                this.isShow = false;
                this.value = null;
            },
            scrollHandle(index) {
                scroll(this.$el, index);
            },
            isAtAll(user) {
                return user.id === 0;
            },
        },
    };
    asyncComponent(options, resolve, reject);
}


/*
说明：根据传入参数在指定位置渲染生成 '@' 列表
参数：
    @param {array<object>}  memberList    '@' 需要展示的成员
    @param {object}         position      css 样式 {left:'',bottom:''}
    @param {boolean}        showAtall     是否显示 @所有人
*/
function render(memberList, position, showAtall) {
    const context = this;
    if (memberList.length === 0) {
        context.isShow = false;
        return;
    }
    const list = memberList.map((item) => {
        item.selected = false;
        return item;
    });
    if (showAtall) {
        list.unshift({
            id: 0,
            name: context.locale.everyone,
            avatar: '',
        });
    }

    const selectedMember = list[0];
    selectedMember.selected = true;

    context.value = selectedMember;
    context.positionStyle = position;
    context.list = list;
    context.isShow = true;
}

/*
说明： '@' 列表移动选择 "光标" ("-" 向前移动 "+" 向后移动)
参数：
    @param {Array}      list   页面绑定展示的列表
    @param {objece}     item   "光标" 当前选中 list 中的对象
    @param {number}     opt    "-" 向前(上)移动 "+" 向后(下)移动
*/
function getNextOrPrev(list, item, opt) {
    // eslint-disable-next-line no-restricted-globals
    if (isNaN(opt)) {
        return undefined;
    }
    item.selected = false;
    let index = list.indexOf(item);
    const length = list.length;
    index += opt;
    if (index < 0) {
        index = length - 1;
    }
    if (index > length - 1) {
        index = 0;
    }
    const resultItem = list[index];
    resultItem.selected = true;
    Vue.set(list, index, resultItem);
    return {
        item: resultItem,
        index,
    };
}

/*
说明： 滚动到当前选中的对象，使在可见区域
参数：
    @param {HTMLElement} container  "@" 列表 html 对象
    @param {number}      index      当前选中的下标
*/
function scroll(container, index) {
    const curEle = container.children[index];
    const top = curEle.offsetTop;
    const containerHeight = container.offsetHeight + container.scrollTop;
    if (top + curEle.offsetHeight > containerHeight) {
        const scrollTop = top - container.offsetHeight + curEle.offsetHeight;
        container.scrollTop = scrollTop;
    } else if (top < container.scrollTop) {
        container.scrollTop = top;
    }
}
