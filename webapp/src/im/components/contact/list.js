/* eslint-disable no-param-reassign */
import config from '../../config';
import getLocalMixins from '../../utils/getLocaleMixins';
import sortByMydeptAndMajorCompany from '../../common/sortByMydeptAndMajorCompany';
import OrgType from '../../common/OrgType';
import getResizeDirectionMethod from '../../common/getResizeDirection';
import { getServerConfigByChainedKey } from '../../cache/helper';

import imageLoader from '../image-loader.vue';
import search from '../search.vue';

// var orgExpand = false;
// 缓存根节点信息切换时不重新获取
let cacheRootList = null;

export default {
    name: 'contact-list',
    mixins: [getLocalMixins('contact-list')],
    data() {
        const im = this.$im();
        const modules = config.modules;
        // 好友
        const enabledFriend = getServerConfigByChainedKey('friend.enable');
        // 星标联系人
        const enabledStar = modules.star;
        return {
            enabledFriend,
            enabledStar,
            auth: im.auth,
            companyList: [],
            selfOrgInfoList: [],
            isStaff: im.auth.isStaff,
            bound: {
                width: {
                    min: 0,
                    max: 0,
                },
            },
        };
    },
    watch: {
        $route() {
            this.$im().RongIM.common.resizeNavNode(this, this.$im());
        },
        companyId(newVal) {
            if (newVal && cacheRootList) {
                sortByMydeptAndMajorCompany(cacheRootList, newVal);
            }
        },
    },
    computed: {
        companyId() {
            return this.auth.companyId;
        },
        myDeptId() {
            return this.auth.deptId || 'root';
        },
        requestUnReadCount() {
            return this.$im().requestUnReadCount;
        },
        approveUnReadCount() {
            return this.$im().approveUnReadCount;
        },
        width() {
            const node = this.$im().resizeNode.rongList;
            return node.width;
        },
    },
    components: {
        imageLoader,
        search,
    },
    created() {
        if (this.isStaff) {
            const orgApi = this.$im().dataModel.Organization;
            getCompany(this, orgApi);
        }
    },
    mounted() {
        const im = this.$im();
        const groupApi = im.dataModel.Group;
        this.RongIM.common.resizeNavNode(this, im);
        watchApproveRequest(groupApi, this, im);
    },
    methods: {
        getMyDeptName(info, company, list) {
            if (list.length === 1) {
                return this.locale.myDept;
            }
            let deptName = info.deptName;
            for (let i = info.path.length - 1; i >= 0; i -= 1) {
                const item = info.path[i];
                if (item.type === OrgType.COMPANY) {
                    if (item.id !== company.id) {
                        deptName = `${info.path[1].name} - ${deptName}`;
                    }
                    break;
                }
            }
            return deptName;
        },
        toggleList(company) {
            toggleList(company);
        },
        getResizeDirection() {
            const direction = getResizeDirectionMethod({
                range: this.width,
                bound: this.bound.width,
                directions: ['left', 'right'],
            });
            this.$im().resizeDirection.temp = direction;
            return direction;
        },
    },
    destroyed() {
        // orgExpand = null;
        cacheRootList = null;
        const groupApi = this.$im().dataModel.Group;
        groupApi.unwatch(this.setApproveUnread);
    },
};

function getCompany(context, orgApi) {
    if (cacheRootList) {
        context.companyList = cacheRootList;
        return;
    }
    orgApi.getAutocephalyCompanyWithMydept((error, companyList) => {
        cacheRootList = [].concat(companyList);
        sortByMydeptAndMajorCompany(cacheRootList, context.companyId);
        context.companyList = cacheRootList;
    });
}

function toggleList(company) {
    Vue.set(company, 'expand', !company.expand);
}

function watchApproveRequest(groupApi, context, im) {
    setApproveUnReadCount(groupApi, im);
    context.setApproveUnread = function setApproveUnread(message) {
        const messageType = message.messageType;
        const isGroupVerifyNotify = messageType === 'GroupVerifyNotifyMessage';
        if (isGroupVerifyNotify) {
            setApproveUnReadCount(groupApi, im);
        }
    };
    groupApi.watch(context.setApproveUnread);
}

function setApproveUnReadCount(groupApi, im) {
    groupApi.getApproveUnread((err, count) => {
        if (!err) {
            im.approveUnReadCount = count;
        }
    });
}
