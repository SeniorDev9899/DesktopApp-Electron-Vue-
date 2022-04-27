import getLocaleMixins from '../../utils/getLocaleMixins';

const name = 'unknown-message';

export default {
    name,
    props: ['message'],
    mixins: [getLocaleMixins(name)],
};
