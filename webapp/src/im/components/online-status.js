import cache from '../utils/cache';
import getLocaleMixins from '../utils/getLocaleMixins';

const cacheKey = 'online-status';
const name = 'online-status';

export default {
    name,
    data() {
        return {
            showMenu: false,
            status: cache.get(cacheKey) || 'online', /* 'online' or 'leave' or 'busy' */
        };
    },
    computed: {
        statusText() {
            return this.locale[this.status];
        },
    },
    mixins: [
        getLocaleMixins(name),
    ],
    mounted() {
        this.$im().$on('imclick', this.close);
    },
    methods: {
        setStatus(value) {
            this.status = value;
            cache.set(cacheKey, value);
            this.RongIM.dataModel.User.setStatus(value);
            this.close();
        },
        close() {
            this.showMenu = false;
        },
    },
};
