import isEmpty from '../utils/isEmpty';

export default function sortByMydeptAndMajorCompany(list, majorCompanyId) {
    list.sort((a, b) => {
        if (isEmpty(a.myDept) && !isEmpty(b.myDept)) {
            return 1;
        }
        if (!isEmpty(a.myDept) && isEmpty(b.myDept)) {
            return -1;
        }
        if (!isEmpty(a.myDept) && !isEmpty(b.myDept)) {
            return a.order - b.order;
        }
        return a.order - b.order;
    });
    let index = 0;
    list.forEach((item, i) => {
        if (item.id === majorCompanyId) {
            index = i;
        }
    });
    const majorCompany = list.splice(index, 1);
    list.unshift(majorCompany[0]);
}
