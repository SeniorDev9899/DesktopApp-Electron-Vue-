import cache from '../../utils/cache';
import locale from '../../locale';
import config from '../../config';
import system from '../../system';
import customSelect from '../custom-select.vue';
import getLocaleMixins from '../../utils/getLocaleMixins';

const messageKey = 'sysMessage';
const supportLocales = [];
$.each(locale, (key, data) => {
    supportLocales.push({
        value: key,
        name: data.name,
    });
});

function getOrgsInfoCompanies(orgsInfo, orgApi) {
    const companies = [];
    if (orgsInfo) {
        const tempCache = {};
        orgsInfo.forEach((orgInfo) => {
        // 判断第二级是否是独立子公司，是则从独立子公司开始计算
            let company = orgInfo.path[0] || {};
            const subcompany = orgInfo.path[1];
            const isAutomy = subcompany && orgApi.isAutonomyCompany(subcompany.id);
            if (isAutomy) {
                company = subcompany;
            }
            const existed = tempCache[company.id];
            if (!existed) {
                tempCache[company.id] = true;
                companies.push({
                    id: company.id,
                    name: company.name,
                });
            }
        });
    }
    return companies;
}

const name = 'setting-system';

/*
说明：设置 - 内容页(系统)
功能：
    1. 设置系统消息提示
    2. 设置语言
*/
export default {
    name,
    data() {
        return {
            playSound: !!cache.get(messageKey),
            language: config.locale,
            supportLocales,
            product: config.product,
            companies: [],
            selectedCompanyId: '',
            autoStartText: '',
            autoStart: system.getAutoLaunch(),
            showPreview: !!cache.get('showPreview'),
            permanentNot: !!cache.get('permanentNot'),
            isPC: !system.platform.startsWith('web'),
            isMac: system.platform.startsWith('darwin'),
            isLinux: system.platform.indexOf('linux') > -1,
            isWindows: system.platform === 'win32',
            isWindowsWeb: system.platform === 'web-win32',
            isMacWeb: system.platform === 'web-darwin',
        };
    },
    components: {
        customSelect,
    },
    mixins: [getLocaleMixins(name)],
    watch: {
        playSound(newVal) {
            cache.set(messageKey, newVal);
        },
        language(lang) {
            cache.set('locale', lang);
            config.locale = lang;
            document.title = this.$im().productName;
            RongIMLib.RongIMEmoji.setConfig({ lang });
            system.setLanguage(lang);
        },
        selectedCompanyId(newVal) {
            const im = this.$im();
            // 38904 - 【设置】系统设置 - 修改主企业再次进入系统设置，主企业显示为空
            const oldCompanyId = cache.get('auth').companyId;
            if (!newVal || newVal === oldCompanyId) {
                return;
            }
            const context = this;
            im.dataModel.User.updateMajorCompany(newVal, (errorCode) => {
                if (errorCode) {
                    this.RongIM.common.toastError(errorCode);
                    // 恢复原值
                    context.selectedCompanyId = oldCompanyId;
                    return;
                }
                // clone 对象写缓存，auth.companyId 被值变更被监听，故先 copy 写缓存后重新赋值
                const clone = JSON.parse(JSON.stringify(im.auth));
                clone.companyId = newVal;
                cache.set('auth', clone, true);
                im.auth.companyId = newVal;
            });
        },
        autoStart(newVal) {
            system.setAutoLaunch(newVal);
        },
        showPreview(newVal) {
            cache.set('showPreview', newVal);
        },
        permanentNot(newVal) {
            cache.set('permanentNot', newVal);
        },
        locale() {
            this.autoStartText = this.localeFormat(this.locale.autoStart, config.product.name[config.locale]);
        },
    },
    mounted() {
        const im = this.$im();
        const orgsInfo = im.auth.orgsInfo;
        const orgApi = im.dataModel.Organization;
        this.companies = getOrgsInfoCompanies(orgsInfo, orgApi);
        this.selectedCompanyId = cache.get('auth').companyId;
        this.autoStartText = this.localeFormat(this.locale.autoStart, config.product.name[config.locale]);
        // this.autoStart = system.getAutoLaunch();
    },
    methods: {
        sysMessage() {
            cache.set(messageKey, this.playSound);
        },
    },
};
