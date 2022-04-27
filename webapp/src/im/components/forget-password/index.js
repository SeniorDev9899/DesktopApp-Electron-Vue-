import StepPhone from './step-phone.vue';
import StepPassword from './step-password.vue';
import StepSuccess from './step-success.vue';
import getLocalMixins from '../../utils/getLocaleMixins';

const name = 'forget-password';

export default {
    name,
    mixins: [getLocalMixins(name)],
    data() {
        return {
            currentView: 'step-phone',
        };
    },
    components: {
        'step-phone': StepPhone,
        'step-password': StepPassword,
        'step-success': StepSuccess,
    },
    methods: {
        currentViewChanged(currentView) {
            this.currentView = currentView;
        },
    },
    computed: {
        productName() {
            return this.$im().productName;
        },
    },
};
