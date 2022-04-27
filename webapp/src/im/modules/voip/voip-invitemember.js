import avatar from '../../components/avatar.vue';

/* eslint-disable */
export default function (RongIM) {

var common = RongIM.common;
var utils = RongIM.utils;
var getMembers = RongIM.dataModel.Group.getAllMembers;

RongIM.dialog.voipInviteMember = function(targetId, memberIdList, mediaType){
    var im = RongIM.instance;
    var defer = $.Deferred();
    var options = {
        name: 'voip-invitemember',
        template: 'modules/voip/call-kit/voip-invitemember.html',
        data: function () {
            return {
                show: true,
                members: [],
                keyword: '',
                tip: '',
                defaultSelected: [],
                selected: []
            };
        },
        components: {
            avatar,
        },
        mounted: function(){
            this.getGroupMembers();
        },
        watch: {
            selected: function (val, oldVal) {
                var maxMember = 7;
                var warnTip = this.locale.videoMaxError;
                if (mediaType === common.CallType.MEDIA_AUDIO) {
                    maxMember = 20;
                    warnTip = this.locale.audioMaxError;
                }
                if (val.length > maxMember) {
                    limitCount(this, this.localeFormat(warnTip, maxMember));
                    this.$nextTick(function () {
                        this.selected = oldVal;
                        // this.selected = val.slice(0, maxMember);
                    });
                }
            }
        },
        computed: {
            filterList: function () {
                return getFilterList(this);
            },
            checkedAll: {
                get: function () {
                    return getCheckedAll(this);
                },
                set: function (value) {
                    setCheckedAll(this, value);
                }
            },
            indeterminate: function () {
                return (typeof this.checkedAll) !== 'boolean';
            }
        },
        methods: getMethods(im, targetId, memberIdList, mediaType, defer)
    };
    common.mountDialog(options);

    return defer.promise();
};

function limitCount(context, tip) {
    clearTimeout(limitCount.timer);
    context.tip = tip;
    limitCount.timer = setTimeout(function () {
        context.tip = '';
    }, 1500);
}

function getFilterList(context) {
    var keyword = context.keyword;
    if(utils.isEmpty(keyword)) {
        return context.members.concat().reverse();
    }
    return context.members.filter(function (item) {
        var list = [item.name, item.alias];
        return utils.searchName(list, keyword);
    });
}

function getCheckedAll(context) {
    var selected = [];
    var selectedIdList = context.selected.map(function (item) {
        return item.id;
    });
    context.filterList.forEach(function (item) {
        var existed = selectedIdList.indexOf(item.id) >= 0;
        existed && selected.push(item);
    });
    var length = selected.length;
    if (length > 0) {
        var isAll = length === context.filterList.length;
        return isAll ? true : null;
    }
    return false;
}

function setCheckedAll(context, value) {
    var switchUser;
    if (value === true || value === null) {
        switchUser = common.without(context.filterList, context.selected);
        context.selected = [].concat(context.selected, switchUser);
    } else {
        switchUser = common.without(context.filterList, context.defaultSelected);
        context.selected = common.without(context.selected, switchUser);
    }
}

function getMethods(im, groupId, memberIdList, mediaType, defer){
    return {
        getUsername: common.getUsername,
        isDefault: function (item) {
            var idList = this.defaultSelected.map(function (item) {
                return item.id;
            });
            return idList.indexOf(item.id) >= 0;
        },
        getGroupMembers: function () {
            // 至少要包含自己
            if (!memberIdList || memberIdList.length === 0) {
                memberIdList = [im.auth.id];
            }
            var params = {
                groupId: groupId,
                memberIdList: memberIdList
            };
            getGroupMembers(this, params);
        },
        remove: function (index) {
            this.selected.splice(index, 1);
        },
        clear: function(){
            this.keyword = null;
        },
        inviteMembers: function () {
            var selected = this.selected;
            var context = this;

            // 视频最多 7 人，音频最多 20 人，后续加入的为观察者
            var maxMember = 7;
            var warnTip = context.locale.videoMaxWarn;
            if (mediaType === common.CallType.MEDIA_AUDIO) {
                maxMember = 20;
                warnTip = context.locale.audioMaxWarn
            }

            if (selected.length > maxMember) {
                common.messagebox({
                    type: 'confirm',
                    message: context.localeFormat(warnTip, maxMember),
                    submitText: '确定',
                    callback: function () {
                        utils.console.info('TODO 删除好友');
                        var inviteMembers = common.without(selected, context.defaultSelected);
                        inviteMembers.forEach(function (user, index) {
                            if (index + context.defaultSelected.length > 6) {
                                user.obeserver = true;
                            }
                        });
                        if (inviteMembers.length > 0) {
                            defer.resolve(inviteMembers);
                        } else{
                            defer.reject();
                        }
                        this.close();
                    }
                });
             /*   limitCount(this);//todo 邀请逻辑
                return;*/
            }else {
                var inviteMembers = common.without(selected, this.defaultSelected);
                if (inviteMembers.length > 0) {
                    defer.resolve(inviteMembers);
                } else{
                    defer.reject();
                }
                this.close();
            }

        },
        closeDialog: function () {
            defer.reject();
            this.close();
        }
    };
}

function getGroupMembers(context, params) {
    getMembers(params.groupId, function(errorCode, members) {
        if(errorCode) {
            return common.handleError(errorCode);
        }
        context.members = members;

        context.defaultSelected = context.members.filter(function (item) {
            return params.memberIdList.indexOf(item.id) !== -1;
        });

        context.selected = context.defaultSelected;
    });
}

}
