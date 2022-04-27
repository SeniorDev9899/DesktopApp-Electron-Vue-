/* eslint-disable no-param-reassign */
import config from '../../config';
import OrgType from '../../common/OrgType';
import avatar from '../avatar.vue';
import userProfile from '../../dialog/contact/user';
import getLocaleMixins from '../../utils/getLocaleMixins';
import Loading from '../../dialog/loading';

const pageNum = config.profile.pageNum;

export default {
    name: 'contact-org',
    mixins: [getLocaleMixins('contact-org')],
    data() {
        return {
            deptName: '',
            company: {},
            breadcrumb: [],
            allMembers: [],
            allDepts: [],
            allCompanies: [],
            loadingNextPage: false,
            lastIndex: 0,
            isPart: false,
            allList: [],
        };
    },
    computed: {
        coId() {
            const coId = this.$route.params.coId;
            return coId;
        },
        orgId() {
            const coId = this.$route.params.coId;
            const orgId = this.$route.params.orgId;
            return orgId || coId;
        },
        type() {
            const coType = OrgType.COMPANY;
            const orgType = +this.$route.params.type;
            return orgType || coType;
        },
        members() {
            if (this.allMembers.length < this.lastIndex) {
                return this.allMembers;
            }
            return this.allMembers.slice(0, this.lastIndex);
        },
        depts() {
            const length = this.allMembers.length + this.allDepts.length;
            if (this.lastIndex < this.allMembers.length) {
                return [];
            } if (this.lastIndex > this.allMembers.length && this.lastIndex < length) {
                return this.allDepts.slice(0, this.lastIndex - this.allMembers.length);
            }
            return this.allDepts;
        },
        companies() {
            const length = this.allMembers.length + this.allDepts.length;
            const d = this.lastIndex - length;
            if (d <= 0) {
                return [];
            }
            return this.allCompanies.slice(0, d).filter(item => !this.isAutonomyCompany(item));
        },
    },
    mounted() {
        const orgApi = this.$im().dataModel.Organization;
        initData(this, orgApi);
    },
    watch: {
        $route() {
            const orgApi = this.$im().dataModel.Organization;
            initData(this, orgApi);
        },
    },
    methods: {
        userProfile,
        getUsername(...args) {
            return this.RongIM.common.getUsername(...args);
        },
        getRoute,
        getTypeName(...args) {
            return this.RongIM.common.getGroupType(...args);
        },
        memberCount(item) {
            let format = this.locale.contact.person;
            if (item.member_count === 1) {
                format = this.locale.contact.personSingle;
            }
            return this.localeFormat(format, item.member_count);
        },
        isAutonomyCompany(item) {
            const orgApi = this.$im().dataModel.Organization;
            return orgApi.isAutonomyCompany(item.id);
        },
        loadMore() {
            loadMore(this);
        },
    },
    components: {
        avatar,
    },
};

/*
说明：路由改变时，组件加载时，根据路由参数，组织机构 id 和类型 (orgId, type) 初始化页面数据
    context.members = [];       成员列表
    context.depts = [];         部门列表
    context.companies = [];     公司列表
    context.breadcrumb = [];    面包屑导航
    context.company = {};       当前公司，如果在独立子公司下则显示独立子公司
    context.deptName = '';      当前部门名称
*/
function initData(context, orgApi) {
    const orgId = context.orgId;
    context.allMembers = [];
    context.allDepts = [];
    context.allCompanies = [];
    context.breadcrumb = [];
    context.company = {};
    context.deptName = '';
    context.isPart = false;
    Loading({
        parent: context,
    }, (loading) => {
        // 获取当前组织机构的直属子节点
        orgApi.getBranch(orgId, (error, data) => {
            loading.close();
            const isPart = error === 'part';
            if (error && !isPart) {
                context.RongIM.common.toastError(error);
                return;
            }
            context.isPart = isPart;
            context.allMembers = data.staffs;
            context.allDepts = data.depts;
            context.allCompanies = data.companies.filter(co => !orgApi.isAutonomyCompany(co.id));
            const done = function done() {
                // 获取所有list的总和
                context.allList = context.allMembers.concat(context.allDepts).concat(context.allCompanies);
                context.lastIndex = context.allList.length > pageNum ? pageNum : context.allList.length;
            };
            /*
            获取部门 path 和公司信息 如果有 独立子部门直接显示独立子部门
            */
            const orgTree = orgApi.getLocalDept(orgId);
            let pathList = orgTree.pathList || [];
            const autonomy = pathList[1];
            if (autonomy && orgApi.isAutonomyCompany(autonomy.id)) {
                pathList.shift();
            }
            // 根据类型 type 获取公司或部门信息
            if (context.type === OrgType.COMPANY) {
                const company = orgApi.getLocalCompany(orgId);
                if (orgApi.isAutonomyCompany(orgId)) {
                    pathList = [];
                    context.company = company;
                } else {
                    context.company = pathList[0] || company;
                }
                context.deptName = company.name;
                done();
            } else if (context.type === OrgType.DEPT) {
                context.company = pathList[0] || { name: '' };
                orgApi.getDept(orgId, (errorCode, dept) => {
                    context.deptName = dept.deptName;
                    done();
                }, true);
            }
            context.breadcrumb = pathList;
        });
    });
}

function getRoute(item) {
    const coId = this.coId;
    return {
        name: 'organization',
        params: {
            coId,
            orgId: item.id,
            type: item.type,
        },
    };
}

function loadMore(context) {
    context.loadingNextPage = true;
    const totalNum = context.allList.length;
    let end = context.lastIndex + pageNum;
    const adjust = index => (index > totalNum ? totalNum : index);
    end = adjust(end);
    if (end === context.lastIndex) {
        context.loadingNextPage = false;
        return;
    }
    setTimeout(() => {
        context.lastIndex = end;
        context.loadingNextPage = false;
    }, 500);
}
