/* eslint-disable no-param-reassign */
/* eslint-disable no-underscore-dangle */
/* eslint-disable func-names */
export default (RongIM) => {
    const Http = RongIM.dataModel._Http;
    const Cache = RongIM.dataModel._Cache;
    const ObserverList = RongIM.dataModel._ObserverList;
    const utils = RongIM.utils;
    const request = RongIM.dataModel._request;
    const common = RongIM.common;

    let userApi = RongIM.dataModel.User;

    const Organization = {
        observerList: new ObserverList(),
    };

    Cache.orgTree = {};
    // 多公司缓存公司信息
    Cache.company = {};

    Organization.cleanCache = function () {
        Cache.orgTree = {};
        Cache.company = {};
        delete Organization.getRoot.cache;
    };

    Organization.loadApi = function () {
        userApi = RongIM.dataModel.User;
    };

    /*
    说明：多部门修改，模拟之前部门树结构
    */
    Organization.getOrgTree = function () {
        const tree = {};
        function createTree(result) {
            const deptList = result.data.filter(item => item.member_type !== common.OrgType.STAFF);
            deptList.forEach((item) => {
                const pathIdString = item.path.map(pathItem => pathItem.id).join(',');
                tree[item.member_uid] = {
                    id: item.member_uid,
                    type: item.member_type,
                    parentId: item.parent_uid,
                    path: pathIdString,
                    pathList: item.path,
                };
            });
        }
        const coPromise = request('/organization', 'GET', { type: 'company' }).then(createTree);
        const deptPromise = request('/organization', 'GET', { type: 'depart' }).then(createTree);
        return $.when(coPromise, deptPromise).then(() => tree);
    };

    Organization.getAllCompany = function () {
        return request('/companies/diff/0', 'GET').then(result => result.data);
    };

    function getMydeptByCompany(company) {
        let orgInfo = null;
        if (!RongIM.instance.auth.orgsInfo) {
            return {};
        }
        common.getFullOrgInfo(RongIM.instance.auth.orgsInfo).forEach((org, index) => {
            if (company.id === org.companyId) {
                if (!orgInfo) {
                    orgInfo = {
                        index,
                        deptList: [],
                    };
                }
                const info = $.extend({}, org);
                orgInfo.deptList.push(info);
            }
        });
        return orgInfo;
    }
    Organization.getAutocephalyCompanyWithMydept = function (callback) {
        Organization.getAll({
            type: 'company',
        }, (error, list) => {
            if (error) {
                callback(error);
                return;
            }
            const ordersMap = {};
            const idList = list.map((item) => {
                const id = item.member_uid;
                ordersMap[id] = item.order;
                // parent_uid 空为集团（总公司）
                if (item.parent_uid === '') {
                    ordersMap[id] = 0;
                }
                return id;
            });
            Organization.getCompanyBatch(idList, (errorCode, companyList) => {
                if (errorCode) {
                    callback(errorCode);
                    return;
                }
                const autonomyCompany = companyList
                    .filter(item => item.type === common.CompanyType.AUTONOMY || item.parent_id === '')
                    .map((item) => {
                        const myDept = getMydeptByCompany(item);
                        let memberCount = item.member_count;
                        if (item.parent_id === '') {
                            memberCount = Cache.rootCompanyMemberCount;
                        }
                        return {
                            id: item.id,
                            name: item.name,
                            logoUrl: item.logo_url,
                            member_count: memberCount,
                            myDept,
                            order: ordersMap[item.id],
                        };
                    });
                callback(null, autonomyCompany);
            });
        });
    };

    const BrancheType = {
        Dept: 1,
        Member: 0,
    };

    function formatDept(dept) {
        const path = (Cache.orgTree[dept.id] || {}).path || '';
        return {
            id: dept.id,
            deptName: dept.name,
            path,
            avatar: '',
            member_count: dept.member_count,
        };
    }

    function branchesGetMemberId(branches) {
        return branches.filter(item => +item.type === BrancheType.Member).map(item => item.id);
    }

    function branchesGetDept(branches) {
        return branches.filter(item => +item.type === BrancheType.Dept).map(item => formatDept(item));
    }

    Organization.watch = function (handle) {
        Organization.observerList.add(handle);
    };

    Organization.unwatch = function (handle) {
        Organization.observerList.remove(handle);
    };

    Organization.getLocalCompany = function (id) {
        return Cache.company[id] || {};
    };

    Organization.getCompanyById = function (id, callback) {
        const cacheCompany = Cache.company[id];
        if (!RongIM.utils.isEmpty(cacheCompany)) {
            callback(null, cacheCompany);
            return;
        }
        Http.get(`/companies/${id}`, (errorCode, company) => {
            if (errorCode) {
                callback(errorCode);
                return;
            }
            Cache.company[company.id] = company;
            callback(null, company);
        });
    };

    Organization.getCompanyBatch = function (idList, callback) {
        if (idList.length === 0) {
            callback('params error');
            return;
        }
        const requestIdList = [];
        const companyList = [];
        idList.forEach((id) => {
            const cacheCompany = Cache.company[id];
            if (RongIM.utils.isEmpty(cacheCompany)) {
                requestIdList.push(id);
            } else {
                companyList.push(cacheCompany);
            }
        });
        if (requestIdList.length === 0) {
            callback(null, companyList);
            return;
        }
        Http.post('/companies/batch', {
            ids: requestIdList,
        }, (errorCode, result) => {
            if (errorCode) {
                callback(errorCode);
                return;
            }
            const list = result.data.filter((item) => {
                if (item.state !== 2) {
                    Cache.company[item.id] = item;
                    return true;
                }
                return false;
            });
            callback(null, companyList.concat(list));
        });
    };

    // 更新cache.company
    Organization.updateCompany = function (callback) {
        Cache.company = {};
        request('/companies/diff/0', 'GET').then((result) => {
            result.data.forEach((company) => {
                if (company.state !== 2) {
                    Cache.company[company.id] = company;
                }
            });
            if (callback) {
                callback();
            }
        });
    };

    /*
说明： 根据 id 判读是否是独立子公司
*/
    Organization.isAutonomyCompany = function (id) {
        const company = Cache.company[id] || {};
        return company.type === common.CompanyType.AUTONOMY;
    };

    Organization.getCompanyAutonomysubcompany = function (parentId) {
        const list = [];
        $.each(Cache.company, (id, company) => {
            if (company.parent_id === parentId && company.type === common.CompanyType.AUTONOMY) {
                list.push(company);
            }
        });
        return list;
    };

    /*
说明： 获取所有组织机构信息
参数：
    params : 接口请求 query 参数 type: 0 staff，1 depart，2 company，不指定代表三种全选
*/
    Organization.getAll = function (params, callback) {
        if (typeof params === 'function') {
            callback = params;
            params = null;
        }
        Http.get('/organization', params, (errorCode, result) => {
            if (errorCode) {
                callback(errorCode);
                return;
            }
            callback(null, result.data);
        });
    };

    Organization.getLocalRoot = function () {
        const rootList = [];
        const cacheCompany = Cache.company;
        $.each(cacheCompany, (coId, co) => {
            if (utils.isEmpty(co.parent_id)) {
                rootList.push(co);
            }
        });
        return rootList;
    };

    Organization.getRoot = function (callback) {
        callback = callback || $.noop;
        const cache = Organization.getRoot.cache;
        if (!utils.isEmpty(cache)) {
            callback(null, cache);
            return;
        }
        Http.get('/organization/root', (errorCode, result) => {
            if (errorCode) {
                callback(errorCode);
                return;
            }
            /*
        获取根组织机构列表
            member_type 0:员工 1:部门 2:公司
        */
            const idList = result.data.filter(item => item.member_type === 2).map(item => item.member_uid);
            Organization.getCompanyBatch(idList, (error, companyList) => {
                if (error) {
                    callback(error);
                    return;
                }
                const list = companyList.map(item => $.extend({}, item, { type: 2 }));
                Organization.getRoot.cache = list;
                callback(null, companyList);
            });
        });
    };

    /*
说明： fix 获取根部门人数
*/
    Organization.getRootCompanyMemberCount = function () {
        Http.get('/companies/root/valid_member_count?state=0', (errorCode, result) => {
            if (errorCode) {
                return;
            }
            Cache.rootCompanyMemberCount = result.member_count;
        });
    };

    Organization.getBranch = function (uid, params, callback) {
        if (typeof params === 'function') {
            callback = params;
            params = null;
        }
        Http.get(`/organization/${uid}/members`, params, (errorCode, result) => {
            if (errorCode) {
                callback(errorCode);
                return;
            }
            const data = result.data || [];
            const staffs = data.filter(org => org.type === common.OrgType.STAFF);
            const depts = data.filter(org => org.type === common.OrgType.DEPT);
            // 更新缓存中部门路径
            depts.forEach((org) => {
                const pathIdString = org.path.map(item => item.id).join(',');
                Cache.orgTree[org.id] = {
                    id: org.id,
                    type: org.type,
                    parentId: org.parent_id,
                    path: pathIdString,
                    pathList: org.path,
                };
            });
            const companies = data.filter(org => org.type === common.OrgType.COMPANY);
            companies.forEach((co) => {
                co.logoUrl = Organization.getLocalCompany(co.id).logo_url;
            });
            const ret = {
                staffs,
                depts,
                companies,
            };
            if (staffs.length === 0) {
                callback(null, ret);
                return;
            }
            const idList = staffs.map(item => item.id);
            userApi.getBatchPart(idList, (error, userList) => {
                if (error) {
                    callback(error);
                    return;
                }
                ret.staffs = userList;
                const isPart = userList.length < idList.length;
                callback(isPart ? 'part' : null, ret);
            });
            // userApi.getBatch(idList, (error, userList) => {
            //     if (error) {
            //         callback(error);
            //         return;
            //     }
            //     ret.staffs = userList;
            //     callback(null, ret);
            // });
        });
    };

    Organization.getAllBranch = function (uid, params, callback) {
        if (typeof params === 'function') {
            callback = params;
            params = null;
        }
        Http.get(`/organization/${uid}/all_members?relation_type=inCompany`, params, (errorCode, result) => {
            if (errorCode) {
                callback(errorCode);
                return;
            }
            const data = result.data || [];
            const staffs = data.filter(org => org.type === common.OrgType.STAFF);
            const depts = data.filter(org => org.type === common.OrgType.DEPT);
            const companies = data.filter(org => org.type === common.OrgType.COMPANY);
            const ret = {
                staffs,
                depts,
                companies,
            };
            if (staffs.length === 0) {
                callback(null, ret);
                return;
            }
            const idList = staffs.map(item => item.id);
            userApi.getBatch(idList, (error, userList) => {
                if (error) {
                    callback(error);
                    return;
                }
                ret.staffs = userList;
                callback(null, ret);
            });
        });
    };

    Organization.getDept = function (deptId, callback, withoutBranch) {
        callback = callback || $.noop;
        const deptPromise = Http.get(`/departments/${deptId}`);
        if (withoutBranch) {
            deptPromise.then((deptResult) => {
                const dept = formatDept(deptResult);
                callback(null, dept);
            }).fail(callback);
        } else {
            const branchesPromise = Http.get(`/departments/${deptId}/branches`);
            $.when(deptPromise, branchesPromise).done((deptResult, branchesResult) => {
                const dept = formatDept(deptResult);
                const memberIds = branchesGetMemberId(branchesResult.data);
                userApi.getBatch(memberIds, (errorCode, list) => {
                    if (errorCode) {
                        callback(errorCode);
                        return;
                    }
                    dept.members = list;
                    dept.depts = branchesGetDept(branchesResult.data);
                    callback(null, dept);
                });
            }).fail(callback);
        }
    };

    Organization.getDeptNames = function (path, callback) {
        const list = path.split(',').map((item) => {
            const dept = Cache.orgTree[item] || {};
            return {
                id: item,
                deptName: dept.deptName,
            };
        });
        callback(null, list);
    };

    Organization.getLocalDept = function (deptId) {
        return Cache.orgTree[deptId] || {};
    };

    Organization.searchStaff = function (params, callback) {
        callback = callback || $.noop;
        const deferred = $.Deferred();

        const keyword = params.keyword.replace('%', item => encodeURI(item));
        // type 0: 根据姓名搜索,默认0 1:根据工号搜索 2:根据手机号搜索,暂不支持 3:根据邮箱搜索,暂不支持
        // 查询工号从 server 获取（本地无访客/员工全量数据）
        let fromServer = false;
        if (params.type === 1 || params.type === 0) {
            fromServer = true;
        }
        request('/staffs/search', 'post', {
            keywords: [keyword],
            type: params.type,
        }, (errorCode, result) => {
            if (errorCode) {
                callback(errorCode);
                deferred.reject(errorCode);
                return;
            }
            result.forEach((item) => {
                item.userType = item.user_type;
                item.isExecutive = item.is_executive;
                item.avatar = item.portrait_url;
            });
            callback(null, result);
            deferred.resolve(result);
        }, fromServer);
        return deferred.promise();
    };

    Organization.search = function (keyword, callback) {
        const params = {
            keyword,
            type: 0,
        };
        return Organization.searchStaff(params, callback);
    };

    Organization.searchByStaffNo = function (keyword, callback) {
        // 39565 - 【添加好友】添加好友输入一串空格显示不正确
        // 输入空格不应该出现很多可以添加的联系人
        if (keyword === null || keyword.trim() === '') {
            callback(null, []);
            return;
        }
        const params = {
            keyword: keyword.trim(),
            type: 1,
        };
        Organization.searchStaff(params, callback);
    };

    Organization.searchDuty = function (keyword, callback) {
        /**
         * 35733 - 【搜索】搜索链接时，报了错误码，已显示搜索结果
         * 应该截取前 32 个字符，跟百度搜索一样
         */
        keyword = keyword.replace('%', item => encodeURI(item)).slice(0, 32);
        Http.post('/misc/duty/search', {
            keywords: [keyword],
        }).done((result) => {
            callback(null, result);
        }).fail(callback);
    };

    Organization.searchOrgs = function (keyword, callback) {
        keyword = keyword.replace('%', item => encodeURI(item));
        Http.post('/departments/search', {
            keywords: [keyword],
        }).done((result) => {
            callback(null, result);
        }).fail(callback);
    };

    Organization.searchCompanies = function (keyword, callback) {
        keyword = keyword.replace('%', item => encodeURI(item));
        Http.post('/companies/search', {
            keywords: [keyword],
        }).done((result) => {
            result.forEach((item) => {
                item.type = common.OrgType.COMPANY;
                const companyDetail = Cache.company[item.id];
                // 非独立子公司要显示公司详细 path
                if (companyDetail.type === 0 && companyDetail.level !== 1) {
                    item.path = Cache.orgTree[item.id].pathList;
                }
            });
            callback(null, result);
        }).fail(callback);
    };

    Organization.getMembers = function (deptId, callback) {
    // Http.get('/departments/' + deptId + '/staffs').done(function (result) {
    //     var memberIds = branchesGetMemberId(result.data);
    //     getUsers(memberIds, callback);
    // }).fail(callback);
        Organization.getAllBranch(deptId, { type: 'staff' }, (errorCode, result) => {
            if (errorCode) {
                return callback(errorCode);
            }
            return callback(null, result.staffs);
        });
    };

    RongIM.dataModel.Organization = Organization;
};
