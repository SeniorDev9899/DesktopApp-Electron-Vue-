const sync = function sync(callback) {
    if (callback) {
        callback();
    }
};

const syncById = function syncById(groupIdList, callback) {
    if (callback) {
        callback();
    }
};

export default {
    all(isStaff, callback) {
        if (callback) {
            callback();
        }
    },
    allOrgs: sync,
    company: sync,
    department: sync,
    organization: sync,
    staff: sync,
    staffById() {
        // web staff 详情每次都重新获取不需要更新
    },
    userBatchById: syncById,
    groupById: syncById,
    groupBatchById: syncById,
    groupMemberById: syncById,
};
