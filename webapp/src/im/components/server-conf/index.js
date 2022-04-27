import ServerConfList from './ServerConfList.vue';
import ServerConfAdd from './ServerConfAdd.vue';
import ServerConfLook from './ServerConfLook.vue';
import getLocaleMixins from '../../utils/getLocaleMixins';

const name = 'serverConf';
export default {
    name,
    data() {
        return {
            currentView: 'server-conf-list',
            currentItem: null,
            productName: '',
            imInstance: null,
            oldItem: null, // 每次修改的时候更新该值，点击登录作为对比的依据
        };
    },
    components: {
        'server-conf-list': ServerConfList, // 配置服务列表
        'server-conf-add': ServerConfAdd,
        'server-conf-look': ServerConfLook,
    },
    mounted() {
        this.imInstance = this.$im();
    },
    mixins: [
        getLocaleMixins(name),
    ],
    watch: {
        imInstance(newVal) {
            if (newVal) {
                this.productName = newVal.productName;
            } else {
                this.$nextTick(() => {
                    this.imInstance = this.$im();
                });
            }
        },
    },
    methods: {
        currentViewChanged(currentView, current) {
            this.currentView = currentView;
            if (currentView === 'server-conf-look') {
                this.currentItem = current;
            } else {
                this.currentItem = null;
            }
        },
        // 更新老值
        updateOldItem(item) {
            this.oldItem = item;
        },
    },

};
