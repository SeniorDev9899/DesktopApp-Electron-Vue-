<template>
    <div class="rong-group-tab-item rong-org" v-watermark :class="{'rong-group-org-keyword': hasKeyword}">
        <div class="rong-group-search-field rong-dialog-search" v-if="!showDutyDetail && !showDeptDetail">
            <customSelect class="rong-group-search-select" v-model="currentView"
            :list="[{name:locale.contact.contact,value:'contacts'},{name:locale.user.dutyName,value:'duty'},{name: locale.components.contactList.contactOrg, value:'dept'}]"
            :nameKey="'name'"
            :valueKey="'value'"></customSelect>
            <input v-if="currentView == 'contacts'" type="text" v-model.trim="keyword" @keyup.esc="clear" class="rong-field rong-field-search" :class="{'rong-field-small-search': keyword}" :placeholder="locale.btns.searchPerson">
            <input v-else-if="currentView == 'duty'" type="text" v-model.trim="keyword" @keyup.esc="clear" class="rong-field rong-field-search" :placeholder="locale.btns.searchDuty">
            <input v-else-if="currentView == 'dept'" type="text" v-model.trim="keyword" @keyup.esc="clear" class="rong-field rong-field-search" :placeholder="locale.btns.searchOrg">
            <i class="rong-search-icon"></i>
            <button v-if="keyword" class="rong-group-search-clear" type="button" :title="locale.btns.clear" @click="clear"></button>
        </div>
        <div id="rong-group-crumb" class="rong-crumb rong-dialog-crumb" :class="{'rong-search-label': showDeptDetail}" v-if="!hasKeyword || (currentView == 'dept' && showDeptDetail)" v-auto-scrollright="breadcrumb">
            <template v-if="searchResult.id">
                <a href="#dept" @click.prevent="changeDept({id:''})">{{locale.contact.orgContact}}</a> /
                <template v-for="(item, index) in breadcrumb">
                    <a href="#dept" :key="index" @click.prevent="changeDept(item)">{{item.name}}</a> /
                </template>
                <em>{{searchResult.deptName}}</em>
            </template>
            <em v-else>{{locale.contact.orgContact}}</em>
            <a v-if="showDeptDetail" class="rong-search-back" href="#" @click.prevent="showDeptDetail = false">{{locale.btns.back}}</a>
        </div>

        <div class="rong-org-all" v-if="!hasKeyword" key="org-all">
            <div class="rong-group-check" v-if="hasResult && !onlyStaff">
                <label class="rong-checkbox"><input type="checkbox" v-model="checkedAll" :indeterminate="indeterminate"><i></i> <span>{{locale.btns.checkedAll}}</span></label>
            </div>
            <div v-show="loadingNextPage" class="rong-loading-bottom"><span>{{locale.tips.loading}}</span></div>
            <ul ref="list" class="rong-group-userlist-bd" v-if="searchResult" v-auto-userlist-height="breadcrumb" :data-height="computeHeight(270)" data-crumb-selector="#rong-group-crumb" :data-staff="onlyStaff" v-rong-scroll-to-bottom="loadMore">
                <template v-for="(item, index) in pageList">
                    <li v-if="item.type == 0" :key="index" :class="{'rong-disabled': limitCondition(item)}">
                        <label class="rong-checkbox"><input :id="item.id" type="checkbox" v-model="checkedMembers" :value="item.id" :disabled="isDisabled(item)"><i></i></label>
                        <div class="rong-profile">
                            <label :for="item.id" class="rong-profile-aside rong-avatar-small">
                                <avatar :user="item"></avatar>
                            </label>
                            <div class="rong-profile-main">
                                <label :for="item.id" v-html="getUsername(item)"></label>
                            </div>
                        </div>
                        <a href="#user" class="rong-user-view-icon" @click.prevent="userProfile(item.id)"></a>
                    </li>
                    <li v-else-if="item.type == 1" :key="index">
                        <div v-if="item.member_count > 0">
                            <label class="rong-checkbox" v-if="!onlyStaff"><input :id="item.id" type="checkbox" :checked="item.checked" :indeterminate="item.indeterminate" @change="checkChange($event, item)"><i></i></label>
                            <div class="rong-profile">
                                <label :for="item.id" class="rong-avatar rong-profile-aside rong-dept-icon"></label>
                                <div class="rong-profile-main">
                                    <div class="rong-profile-name">
                                        <label :for="item.id" :title="item.deptName">{{item.name}}</label>
                                    </div>
                                    <div class="rong-profile-count">
                                        <label :for="item.id">{{memberCount(item)}}</label>
                                    </div>
                                </div>
                            </div>
                            <a v-if="hasMembers(item)" class="rong-group-children" href="#dept" @click.prevent="changeDept(item)">{{locale.btns.inferior}}</a>
                        </div>
                    </li>
                    <li v-else-if="item.type == 2" :key="index">
                        <div v-if="item.member_count > 0">
                            <label class="rong-checkbox" v-if="!onlyStaff"><input :id="item.id" type="checkbox" :checked="item.checked" :indeterminate="item.indeterminate" @change="checkChange($event, item)"><i></i></label>
                            <div class="rong-profile">
                                <imageLoader class="rong-company-icon-loader" :url="item.logoUrl">
                                    <label slot="success" :for="item.id" class="rong-avatar rong-profile-aside rong-company-icon" :style="{'background-image': 'url(' + item.logoUrl + ')'}"></label>
                                    <label slot="default" :for="item.id" class="rong-avatar rong-profile-aside rong-company-icon"></label>
                                </imageLoader>
                                <!-- <label v-if="company.logoUrl" :for="company.id" class="rong-avatar rong-profile-aside rong-company-icon" :style="{'background-image': 'url(' + company.logoUrl + ')'}"></label>
                                <label v-else :for="company.id" class="rong-avatar rong-profile-aside rong-company-icon"></label> -->
                                <div class="rong-profile-main">
                                    <div class="rong-profile-name">
                                        <label :for="item.id" :title="item.name">{{item.name}}</label>
                                    </div>
                                    <div class="rong-profile-count">
                                        <label :for="item.id">{{item.member_count}}</label>
                                    </div>
                                </div>
                            </div>
                            <a v-if="hasMembers(item)" class="rong-group-children" href="#company" @click.prevent="changeDept(item)">{{locale.btns.inferior}}</a>
                        </div>
                    </li>
                </template>
                <div v-if="searchResult.isPart && pageList.length === allList.length" class="rong-no-more">{{locale.tips.noMoreInfo}}</div>
            </ul>
        </div>

        <div v-else class="rong-search-content" :class="['rong-search-selected-' + currentView]">
            <div v-if="searching" class="rong-search-empty">{{locale.tips.searching}}</div>
            <div class="rong-search-contacts" v-if="currentView == 'contacts' ">
                <div class="rong-group-check" v-if="!onlyStaff">
                    <label v-show="pageList.length>0" class="rong-checkbox"><input type="checkbox" v-model="checkedAll" :indeterminate="indeterminate"><i></i> <span>{{locale.btns.checkedAll}}</span></label>
                </div>
                <div v-show="loadingNextPage" class="rong-loading-bottom"><span>{{locale.tips.loading}}</span></div>
                <ul ref="list" class="rong-group-userlist-bd" :style="{height: searchHeight + 'px'}" v-rong-scroll-to-bottom="loadMore">
                    <div v-if="pageList.length === 0 && !busy.contacts" class="rong-recent-empty" v-html="localeFormat(locale.tips.searchEmpty, '<em>&quot;' + keyword + '&quot;</em>')"></div>
                    <li v-for="(item, index) in pageList" :key="index" :class="{'rong-disabled': limitCondition(item)}">
                        <label v-show="!executiveLimit(item)" class="rong-checkbox"><input :id="item.id" type="checkbox" v-model="checkedMembers" :value="item.id" :disabled="isDisabled(item)"><i></i></label>
                        <div class="rong-profile">
                            <label :for="item.id" class="rong-profile-aside rong-avatar-small">
                                <avatar :user="item"></avatar>
                            </label>
                            <div class="rong-profile-main">
                                <label :for="item.id" v-html="getUsername(item)"></label>
                                <div class="rong-dept-path" :title="item.pathName">
                                    <div class="rong-search-pathname">
                                        <span>{{item.pathNameEllipsis}}</span>
                                        <span class="rong-search-pathname-suffix">{{item.pathNameSuffix}}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <a href="#user" class="rong-user-view-icon" @click.prevent="userProfile(item.id)"></a>
                    </li>
                </ul>
            </div>

            <div class="rong-duty" v-else-if="currentView == 'duty' ">
                <div v-if="!showDutyDetail">
                    <ul class="rong-group-userlist-bd rong-user-dutylist">
                        <div v-if="dutyList.length === 0 && !busy.duty" class="rong-recent-empty" v-html="localeFormat(locale.tips.searchEmpty, '<em>&quot;' + keyword + '&quot;</em>')"></div>
                        <li v-for="(item, index) in dutyList" :key="index">
                            <label class="rong-checkbox" v-if="!onlyStaff"><input :id="item.name" type="checkbox" v-model="checkedDuty" :value="item.name"><i></i></label>
                            <div class="rong-profile">
                                <div class="rong-profile-aside rong-duty-icon"></div>
                                <div class="rong-profile-main">
                                    <div class="rong-profile-name">
                                        <label v-html="highlight(item)"></label>
                                        ({{memberCount(item)}})
                                    </div>
                                </div>
                            </div>
                            <a href="#duty" class="rong-group-children" @click.prevent="getDutyDetail(item)">{{locale.btns.expand}}</a>
                        </li>
                    </ul>
                </div>
                <div v-else>
                <div class="rong-search-label">
                        {{locale.user.dutyName}}：<span>{{searchDutyDetail.duty.name}}</span>
                        <a class="rong-search-back" href="#" @click.prevent="showDutyDetail = false">{{locale.btns.back}}</a>
                    </div>
                    <div class="rong-group-check" v-if="!onlyStaff">
                        <label v-show="searchDutyDetail.list.length > 0" class="rong-checkbox"><input type="checkbox" v-model="checkedAllDuty" :indeterminate="indeterminateDuty"><i></i> <span>{{locale.btns.checkedAll}}</span></label>
                    </div>
                    <ul ref="dutyDetailList" class="rong-group-userlist-bd rong-user-labeldetail" :style="{height: searchHeight + 'px'}" v-rong-scroll-to-bottom="loadMoreDutyDetail">
                        <li v-for="(item, index) in dutyDetailList" :key="index" :class="{'rong-disabled': limitCondition(item)}">
                            <label v-show="!executiveLimit(item)" class="rong-checkbox"><input :id="item.id" type="checkbox" v-model="checkedMembers" :value="item.id" :disabled="isDisabled(item)"><i></i></label>
                            <div class="rong-profile">
                                <label :for="item.id" class="rong-profile-aside rong-avatar-small">
                                    <avatar :user="item"></avatar>
                                </label>
                                <div class="rong-profile-main">
                                    <label :for="item.id" v-html="getUsername(item)"></label>
                                    <div class="rong-dept-path" :title="getPathName(item)">
                                        <div class="rong-search-pathname">
                                            <span>{{getPathNameEllipsis(item)}}</span>
                                            <span class="rong-search-pathname-suffix">{{getPathNameSuffix(item)}}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <a href="#user" class="rong-user-view-icon" @click.prevent="userProfile(item.id)"></a>
                        </li>
                    </ul>
                </div>
            </div>

            <div class="rong-dept" v-else-if="currentView == 'dept'">
                <div v-if="!showDeptDetail">
                    <ul ref="orgList" class="rong-group-userlist-bd rong-user-orglist" v-rong-scroll-to-bottom="loadMoreOrg">
                        <div v-if="searchOrg.list.length === 0 && !busy.dept" class="rong-recent-empty" v-html="localeFormat(locale.tips.searchEmpty, '<em>&quot;' + keyword + '&quot;</em>')"></div>
                        <li v-for="(dept, index) in orgList" :key="index">
                            <template v-if="dept.type == 1">
                                <label class="rong-checkbox" v-if="!onlyStaff"><input :id="dept.id" type="checkbox" :checked="dept.checked" :indeterminate="dept.indeterminate" @change="checkChange($event, dept)"><i></i></label>
                                <div class="rong-profile">
                                    <div class="rong-profile-aside rong-org-icon"></div>
                                    <div class="rong-profile-main">
                                        <div class="rong-profile-name">
                                            <label v-html="highlight(dept)"></label>
                                            ({{memberCount(dept)}})
                                        </div>
                                        <div class="rong-dept-path" :title="getPathName(dept)">
                                            <div class="rong-search-pathname">
                                                <span>{{getPathNameEllipsis(dept)}}</span>
                                                <span class="rong-search-pathname-suffix">{{getPathNameSuffix(dept)}}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <a href="#dept" class="rong-group-children" @click.prevent="getDeptDetail(dept)">{{locale.btns.inferior}}</a>
                            </template>
                            <template v-else-if="dept.type == 2">
                                <label class="rong-checkbox" v-if="!onlyStaff"><input :id="dept.id" type="checkbox" :checked="dept.checked" :indeterminate="dept.indeterminate" @change="checkChange($event, dept)"><i></i></label>
                                <div class="rong-profile">
                                    <label v-if="dept.logoUrl" :for="dept.id" class="rong-avatar rong-profile-aside rong-company-icon" :style="{'background-image': 'url(' + dept.logoUrl + ')'}"></label>
                                    <label v-else :for="dept.id" class="rong-avatar rong-profile-aside rong-company-icon"></label>
                                    <div class="rong-profile-main">
                                        <div class="rong-profile-name">
                                            <label :for="dept.id" :title="dept.name" v-html="highlight(dept)"></label>
                                            ({{dept.count}})
                                        </div>
                                        <div class="rong-dept-path" :title="getPathName(dept)">
                                            <div class="rong-search-pathname">
                                                <span>{{getPathNameEllipsis(dept)}}</span>
                                                <span class="rong-search-pathname-suffix">{{getPathNameSuffix(dept)}}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <a v-if="hasMembers(dept)" class="rong-group-children" href="#company" @click.prevent="getCoDetail(dept)">{{locale.btns.inferior}}</a>
                            </template>
                        </li>
                    </ul>
                </div>
                <div class="rong-dept-detail" v-else>
                    <div class="rong-group-check" v-if="hasResult && !onlyStaff">
                        <label class="rong-checkbox"><input type="checkbox" v-model="checkedAll" :indeterminate="indeterminate"><i></i> <span>{{locale.btns.checkedAll}}</span></label>
                    </div>
                    <div v-show="loadingNextPage" class="rong-loading-bottom"><span>{{locale.tips.loading}}</span></div>
                    <ul ref="deptList" class="rong-group-userlist-bd rong-search-dept" v-if="searchResult"  v-auto-userlist-height="breadcrumb" :data-height="computeHeight(320)" :data-staff="onlyStaff" data-crumb-selector="#rong-group-crumb" v-rong-scroll-to-bottom="loadMoreDept">
                        <template v-for="(item, index) in pageList">
                            <li v-if="item.type == 0" :key="index">
                                <label v-show="!executiveLimit(item)" class="rong-checkbox"><input :id="item.id" type="checkbox" v-model="checkedMembers" :value="item.id" :disabled="isDisabled(item)"><i></i></label>
                                <div class="rong-profile">
                                    <label :for="item.id" class="rong-profile-aside rong-avatar-small">
                                        <avatar :user="item"></avatar>
                                    </label>
                                    <div class="rong-profile-main">
                                        <label :for="item.id" v-html="getUsername(item)"></label>
                                    </div>
                                </div>
                                <a href="#user" class="rong-user-view-icon" @click.prevent="userProfile(item.id)"></a>
                            </li>
                            <li v-else-if="item.type == 1" :key="index">
                                <div v-if="item.member_count > 0">
                                    <label class="rong-checkbox" v-if="!onlyStaff"><input :id="item.id" type="checkbox" :checked="item.checked" :indeterminate="item.indeterminate" @change="checkChange($event, item)"><i></i></label>
                                    <div class="rong-profile">
                                        <label :for="item.id" class="rong-avatar rong-profile-aside rong-dept-icon"></label>
                                        <div class="rong-profile-main">
                                            <div class="rong-profile-name">
                                                <label :for="item.id" :title="item.deptName">{{item.name}}</label>
                                            </div>
                                            <div class="rong-profile-count">
                                                <label :for="item.id">{{memberCount(item)}}</label>
                                            </div>
                                        </div>
                                    </div>
                                    <a v-if="hasMembers(item)" class="rong-group-children" href="#dept" @click.prevent="changeDept(item)">{{locale.btns.inferior}}</a>
                                </div>
                            </li>
                            <li v-else-if="item.type == 2" :key="index">
                                <div v-if="item.member_count > 0">
                                    <label class="rong-checkbox" v-if="!onlyStaff"><input :id="item.id" type="checkbox" :checked="item.checked" :indeterminate="item.indeterminate" @change="checkChange($event, item)"><i></i></label>
                                    <div class="rong-profile">
                                        <imageLoader class="rong-company-icon-loader" :url="item.logoUrl">
                                            <label slot="success" :for="item.id" class="rong-avatar rong-profile-aside rong-company-icon" :style="{'background-image': 'url(' + item.logoUrl + ')'}"></label>
                                            <label slot="default" :for="item.id" class="rong-avatar rong-profile-aside rong-company-icon"></label>
                                        </imageLoader>
                                        <div class="rong-profile-main">
                                            <div class="rong-profile-name">
                                                <label :for="item.id" :title="item.name">{{item.name}}</label>
                                            </div>
                                            <div class="rong-profile-count">
                                                <label :for="item.id">{{item.member_count}}</label>
                                            </div>
                                        </div>
                                    </div>
                                    <a v-if="hasMembers(item)" class="rong-group-children" href="#company" @click.prevent="changeDept(item)">{{locale.btns.inferior}}</a>
                                </div>
                            </li>
                        </template>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</template>
<script src='./org.js'></script>
