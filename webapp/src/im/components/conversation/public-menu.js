/* eslint-disable no-param-reassign */
import browserWindow from '../../browserWindow';

const menuType = {
    0: 'parent',
    1: 'url',
    2: 'click',
};

const handleMenucommand = {
    parent(menu, context, im) {
        Vue.set(menu, 'show', true);
        menu.hidden = function hidden() {
            menu.show = false;
            im.$off('imclick', menu.hidden);
            context.$off('hiddenMenu', menu.hidden);
        };
        context.$on('hiddenMenu', menu.hidden);
        im.$on('imclick', menu.hidden);
    },
    url(menu) {
        // openUrl(url);
        browserWindow.openPSArticle(menu.url);
    },
    click(menu) {
        console.debug(menu);
    },
};

// 公众号服务聊天界 面菜单组件
export default {
    name: 'public-menu',
    props: ['menuInfo'],
    data() {
        return {
            subShow: false,
        };
    },
    methods: {
        // 公众号点击 切换输入框和菜单
        inputMenuChanged() {
            this.$emit('inputMenuChanged', false);
        },
        menuClick(menu) {
            const context = this;
            const im = this.$im();
            context.$emit('hiddenMenu');
            const handleName = menuType[menu.type];
            if (menu.type !== 0) {
                sendMessage(menu, this.menuInfo, im.dataModel);
            }
            const handle = handleMenucommand[handleName];
            if (handle) {
                handle(menu, context, im);
            }
        },
    },
};

function sendMessage(menu, menuInfo, dataModel) {
    const params = {
        conversationType: 7,
        targetId: menuInfo.app_id,
        cmd: '',
        id: menu.id,
        type: menu.type,
        name: menu.name,
        data: menu.id,
    };
    if (menu.type === 1) {
        params.cmd = 'VIEW';
    } else if (menu.type === 2) {
        params.cmd = 'CLICK';
    }
    const msg = new RongIMClient.RegisterMessage.ClickMenuMessage({
        cmd: params.cmd, id: params.id, type: params.type, name: params.name, data: params.data,
    });
    dataModel.Message.sendCommandMessage({
        conversationType: params.conversationType,
        targetId: params.targetId,
        content: msg,
    });
}
