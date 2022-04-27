const name = 'custom-select';

export default {
    name,
    data() {
        return {
            isShowOption: false,
        };
    },
    props: {
        value: {
            type: String,
            required: true,
        },
        list: {
            type: Array,
            required: true,
        },
        valueKey: {
            type: String,
            default: 'value',
        },
        nameKey: {
            type: String,
            default: 'name',
        },
    },
    mounted() {
        const context = this;
        context.hideOption = function hideOption() {
            context.isShowOption = false;
        };
        this.$im().$on('imclick', context.hideOption);
    },
    methods: {
        toggleOption() {
            this.isShowOption = !this.isShowOption;
        },
        getItemName(item) {
            return item[this.nameKey];
        },
        getItemValue(item) {
            return item[this.valueKey];
        },
        getSelected(value) {
            const context = this;
            let item = {};
            this.list.forEach((i) => {
                if (context.getItemValue(i) === value) {
                    item = i;
                }
            });
            return context.getItemName(item);
        },
        select(item) {
            const value = this.getItemValue(item);
            this.$emit('input', value);
            this.isShowOption = false;
        },
    },
    destroyed() {
        this.$im().$off('imclick', this.hideOption);
    },
};
