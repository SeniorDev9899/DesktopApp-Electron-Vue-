/* eslint-disable no-param-reassign */
/* eslint-disable no-underscore-dangle */
/* eslint-disable func-names */
export default (RongIM) => {
    let groupApi = null;
    let userApi = null;

    const Contact = {};

    Contact.loadApi = function () {
        groupApi = RongIM.dataModel.Group;
        userApi = RongIM.dataModel.User;
    };

    /*
    消息转发时,选择最近联系人用
    最近联系人包括用户,群组
 */
    Contact.get = function (ids, callback) {
        callback = callback || $.noop;
        let idList = [];
        const groupList = [];
        const userList = [];
        idList = idList.concat(ids);
        idList.forEach((item) => {
            if (item.startsWith('group_')) {
                groupList.push(item.replace('group_', ''));
            } else {
                userList.push(item);
            }
        });
        userApi.getUsers(userList, (errorCode, list) => {
            if (errorCode) {
                callback(errorCode);
                return;
            }
            groupApi.getGroups(groupList, (error, listGroup) => {
                if (error) {
                    callback(error);
                    return;
                }
                let contacts = formateContact(list, false);
                contacts = contacts.concat(formateContact(listGroup, true));
                callback(null, sortContact(ids, contacts));
            });
        });
    };

    function formateContact(contacts, isGroup) {
        return contacts.map(item => ({
            id: isGroup ? `group_${item.id}` : item.id,
            name: item.name,
            avatar: item.avatar,
            firstNine: isGroup ? item.firstNine : [],
            member_id_list: isGroup ? item.member_id_list : [],
            isFriend: isGroup ? true : item.isFriend,
        }));
    }

    function sortContact(idList, contacts) {
        const objContacts = {};
        contacts.forEach((contact) => {
            objContacts[contact.id] = contact;
        });
        const sortList = [];
        for (let i = 0; i < idList.length; i += 1) {
            sortList.push(objContacts[idList[i]]);
        }
        return sortList;
    }

    RongIM.dataModel.Contact = Contact;
};
