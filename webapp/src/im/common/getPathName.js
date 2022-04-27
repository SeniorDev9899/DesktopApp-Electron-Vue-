import isEmpty from '../utils/isEmpty';

export default function getPathName(item, orgApi) {
    const boundSymbol = ' > ';
    let pathList = [];
    if (item.org_path) {
        pathList = item.org_path;
    }
    if (item.path) {
        pathList = item.path;
    }
    /* 多公司搜索员工使用 orgs_info */
    const orgsInfo = item.orgs_info || item.orgsInfo;
    if (orgsInfo) {
        // 取主公司信息
        let mainOrgInfo = orgsInfo[0] || {};
        orgsInfo.forEach((orgInfo) => {
            let company = orgInfo.path[0] || {};
            const subcompany = orgInfo.path[1];
            const isAutomy = subcompany && orgApi.isAutonomyCompany(subcompany.id);
            if (isAutomy) {
                company = subcompany;
            }
            const mainCompanyId = item.companyId || item.company_id;
            if (company.id === mainCompanyId) {
                mainOrgInfo = orgInfo;
            }
        });
        pathList = mainOrgInfo.path || [];
    }
    // 增加日志用于排查错误
    if (!(pathList instanceof Array)) {
        // eslint-disable-next-line no-console
        console.error('pathList error!\npathList => ', pathList, '\nitem => ', item);
    }
    // 排除无效信息
    pathList = pathList.filter(pathItem => !isEmpty(pathItem.id));

    let pathNameList = [];
    pathNameList = pathList.map(dept => dept.name);
    // 第二级是独立子公司则从独立子公司开始显示路径
    const subcompany = pathList[1];
    const isAutonomy = subcompany && orgApi.isAutonomyCompany(subcompany.id);
    if (isAutonomy) {
        pathNameList.shift();
    }
    const pathName = pathNameList.join(boundSymbol);
    return pathName;
}
