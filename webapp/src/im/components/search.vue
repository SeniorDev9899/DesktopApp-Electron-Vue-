<template>
    <div class="rong-search rong-dragable">
        <div class="rong-search-hd">
            <div class="rong-search-add">
                <button class="rong-button" type="button" @click.stop="showMenu()">+</button>
                <div class="rong-search-dropdown" v-show="isShowMenu">
                    <a href="" @click.prevent="createGroup()">{{locale.btns.groupChat}}</a>
                    <a v-if="enabledFriend" href="" @click.prevent="addFriend()">{{locale.btns.addFriend}}</a>
                    <a v-if="enabledPIN" href="" @click.prevent="addPin()">{{locale.btns.newPin}}</a>
                </div>
            </div>
            <div class="rong-search-main">
                <input type="text" v-model="keyword" @keyup.esc="clear" @keyup.enter="enter" @focus="inputFocus" @blur="inputBlur" class="rong-field rong-field-search" :placeholder="locale.btns.search" ref="searchBox">
                <i class="rong-search-icon"></i>
                <button v-if="keyword" class="rong-search-clear" type="button" :title="locale.btns.clear" @click="clear"></button>
            </div>
        </div>
        <div class="rong-search-record" v-if="showSearchRecord && recordList != 0">
            <em class="rong-search-record-triangle"><em></em></em>
            <ul class="rong-search-record-list">
                <li class="rong-search-item" v-for="(record, index) in recordList"
                    @click="searchRecord(record)" :key="index">
                    <em class="rong-record-icon"></em>
                    <em class="rong-record-name">{{record}}</em>
                </li>
            </ul>
        </div>
        <transition name="rong-search">
            <div v-if="keyword" class="rong-search-result rong-search-contacts">
                <div v-show="loadBusy" class="rong-loading-bottom"><span>{{locale.tips.loading}}</span></div>
                <div ref="list" class="rong-search-content" v-rong-scroll-bar-y :class="['rong-search-selected-' + currentView]" v-rong-scroll-to-bottom="loadMore">
                <!--  <div v-if="isEmpty" class="rong-search-empty">没有搜索到<em>"{{keyword}}"</em>相关结果</div> -->
                    <div v-if="isBusy && isEmpty" class="rong-search-empty">{{locale.tips.searching}}</div>
                    <div v-else-if="isEmpty" class="rong-search-empty" v-html="localeFormat(locale.tips.searchEmpty, '<em>&quot;' + keyword + '&quot;</em>')"></div>

                    <div v-if="showContacts" class="rong-search-members">
                        <div class="rong-search-members-hd">
                            <template v-if="contacts.length > 3">
                                <a v-if="currentView === 'contacts'" href="#collapse" @click.prevent="currentView = ''">{{locale.btns.collapse}}</a>
                                <a v-else href="#more" @click.prevent="currentView = 'contacts'">{{locale.btns.more}}</a>
                            </template>
                            <h2>{{locale.contact.contact}}（{{totalStaff > 2000 ? totalStaff : contacts.length}}）</h2>
                        </div>
                        <ul ref="showList" class="rong-group-userlist-bd" v-scrollTop>
                            <li v-for="(item, index) in contactsList" :key="index">
                                <div class="rong-result-item rong-clearfix rong-clickable" @click="nextAction(1, item.id, item)">
                                    <avatar class="rong-result-item-aside" :user="item"></avatar>
                                    <div class="rong-result-item-main" :class="{'rong-search-only-name' : !checkPath(item)}">
                                        <div class="rong-search-name"><span v-html="getHighlightUsername(item)"></span></div>
                                        <div class="rong-search-pathname" :title="item.pathName">
                                            <span>{{item.pathNameEllipsis}}</span>
                                            <span class="rong-search-pathname-suffix">{{item.pathNameSuffix}}</span>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        </ul>
                    </div>
                    <div v-if="showDutys" class="rong-search-members rong-search-dutys">
                        <div class="rong-search-members-hd">
                            <template v-if="dutys.length > 3">
                                <a v-if="currentView === 'dutys'" href="#collapse" @click.prevent="currentView = ''">{{locale.btns.collapse}}</a>
                                <a v-else href="#more" @click.prevent="currentView = 'dutys'">{{locale.btns.more}}</a>
                            </template>
                            <h2>{{locale.user.dutyName}}（{{dutys.length}}）</h2>
                        </div>
                        <ul ref="showList" class="rong-group-userlist-bd" v-scrollTop>
                            <li v-for="(duty, index) in dutysList" :key="index" @click.prevent="viewDutysDetail(duty)">
                                <div class="rong-result-item rong-clearfix rong-clickable">
                                    <div class="rong-result-item-aside rong-search-avatar">
                                        <div class="rong-duty-icon"></div>
                                    </div>
                                    <div class="rong-result-item-main rong-search-only-name">
                                        <div class="rong-search-name">
                                            <span v-html="getHighlight(duty)"></span>
                                            ({{memberCount(duty)}})
                                        </div>
                                    </div>
                                </div>
                            </li>
                        </ul>
                    </div>
                    <div v-if="showOrgs" class="rong-search-members rong-search-orgs">
                        <div class="rong-search-members-hd">
                            <template v-if="orgs.length > 3">
                                <a v-if="currentView === 'orgs'" href="#collapse" @click.prevent="currentView = ''">{{locale.btns.collapse}}</a>
                                <a v-else href="#more" @click.prevent="currentView = 'orgs'">{{locale.btns.more}}</a>
                            </template>
                            <h2>{{locale.components.contactList.contactOrg}}（{{orgs.length}}）</h2>
                        </div>
                        <ul ref="showList" class="rong-group-userlist-bd" v-scrollTop>
                            <li v-for="(org, index) in orgsList" :key="index" @click.prevent="viewOrgsDetail(org)">
                                <div class="rong-result-item rong-clearfix rong-clickable">
                                    <template v-if="isCompany(org)">
                                        <div class="rong-result-item-aside rong-search-avatar">
                                            <div v-if="org.logo_url" class="rong-company-icon" :style="{'background-image': 'url(' + org.logo_url + ')'}"></div>
                                            <div v-else class="rong-company-icon"></div>
                                        </div>
                                        <div class="rong-result-item-main" :class="{'rong-search-only-name': !checkPath(org)}">
                                            <div class="rong-search-name">
                                                <span v-html="getHighlight(org)"></span>
                                                ({{memberCount(org)}})
                                            </div>
                                            <div class="rong-search-pathname" :title="getPathName(org)">
                                                <span>{{getPathNameEllipsis(org)}}</span>
                                                <span class="rong-search-pathname-suffix">{{getPathNameSuffix(org)}}</span>
                                            </div>
                                        </div>
                                    </template>
                                    <template v-else>
                                        <div class="rong-result-item-aside rong-search-avatar">
                                            <div class="rong-org-icon"></div>
                                        </div>
                                        <div class="rong-result-item-main" :class="{'rong-search-only-name' : !checkPath(org)}">
                                            <div class="rong-search-name">
                                                <span v-html="getHighlight(org)"></span>
                                                ({{memberCount(org)}})
                                            </div>
                                            <div class="rong-search-pathname" :title="getPathName(org)">
                                                <span>{{getPathNameEllipsis(org)}}</span>
                                                <span class="rong-search-pathname-suffix">{{getPathNameSuffix(org)}}</span>
                                            </div>
                                        </div>
                                    </template>
                                </div>
                            </li>
                        </ul>
                    </div>
                    <div v-if="showDutysDetail" class="rong-search-history-detail">
                        <div class="rong-search-members-hd">
                            <a href="#back" @click.prevent="showDutysDetail = false">{{locale.btns.back}}</a>
                        <h2 :title="dutysDetail.name+'（'+memberCount(dutysDetail)+'）'">{{locale.user.dutyName}}<span class="rong-search-title">{{dutysDetail.name}}（{{memberCount(dutysDetail)}}）</span></h2>
                        </div>
                        <ul ref="showList" class="rong-group-userlist-bd" v-scrollTop>
                            <li v-for="(item, index) in dutyDetailList" :key="index">
                                <div class="rong-result-item rong-clearfix rong-clickable" @click="nextAction(1, item.id, item)">
                                    <avatar class="rong-result-item-aside" :user="item"></avatar>
                                    <div class="rong-result-item-main" :class="{'rong-search-only-name' : !checkPath(item)}">
                                        <div class="rong-search-name">
                                            <span v-html="getHighlightUsername(item)"></span>
                                        </div>
                                        <div class="rong-search-pathname" :title="getPathName(item)">
                                            <span>{{getPathNameEllipsis(item)}}</span>
                                            <span class="rong-search-pathname-suffix">{{getPathNameSuffix(item)}}</span>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        </ul>
                    </div>

                    <div v-if="showOrgsDetail" class="rong-search-history-detail">
                        <div class="rong-search-members-hd">
                            <a href="#back" @click.prevent="showOrgsDetail = false">{{locale.btns.back}}</a>
                        <h2 :title="orgsDetail.name+'（'+memberCount(orgsDetail)+'）'">{{orgsDetail.name}}（{{memberCount(orgsDetail)}}）</h2>
                        </div>
                        <ul ref="showList" class="rong-group-userlist-bd" v-scrollTop>
                            <!-- <li v-for="i in 400">{{i}}</li> -->
                            <li v-for="org in orgDetailList" :key="org.id">
                                <template v-if="isStaffs(org)">
                                    <a class="rong-result-item rong-clearfix" href="#more" @click="nextAction(1, org.id, org)">
                                        <avatar class="rong-result-item-aside" :user="org"></avatar>
                                        <div class="rong-result-item-main" :class="{'rong-search-only-name' : !checkPath(org)}">
                                            <div class="rong-search-name">
                                                <span v-html="getHighlightUsername(org)"></span>
                                            </div>
                                            <div class="rong-search-pathname" :title="getPathName(org)">
                                                <span>{{getPathNameEllipsis(org)}}</span>
                                                <span class="rong-search-pathname-suffix">{{getPathNameSuffix(org)}}</span>
                                            </div>
                                        </div>
                                    </a>
                                </template>
                                <template v-else-if="isDept(org)">
                                    <div class="rong-result-item rong-clearfix rong-clickable">
                                        <div class="rong-result-item-aside rong-search-avatar">
                                            <div class="rong-org-icon"></div>
                                        </div>
                                        <div class="rong-result-item-main" :class="{'rong-search-only-name' : !checkPath(org)}">
                                            <div class="rong-search-name">
                                                <span>{{org.name}}</span>
                                                ({{memberCount(org)}})
                                            </div>
                                            <div class="rong-search-pathname" :title="getPathName(org)">
                                                <span>{{getPathNameEllipsis(org)}}</span>
                                                <span class="rong-search-pathname-suffix">{{getPathNameSuffix(org)}}</span>
                                            </div>
                                        </div>
                                    </div>
                                </template>
                                <template v-else-if="isCompany(org)">
                                    <div class="rong-result-item rong-clearfix rong-clickable">
                                        <div class="rong-result-item-aside rong-search-avatar">
                                            <div v-if="org.logo_url" class="rong-company-icon" :style="{'background-image': 'url(' + org.logo_url + ')'}"></div>
                                            <div v-else class="rong-company-icon"></div>
                                        </div>
                                        <div class="rong-result-item-main" :class="{'rong-search-only-name': !checkPath(org)}">
                                            <div class="rong-search-name">
                                                <span>{{org.name}}</span>
                                                ({{memberCount(org)}})
                                            </div>
                                            <div class="rong-search-pathname" :title="getPathName(org)">
                                                <span>{{getPathNameEllipsis(org)}}</span>
                                                <span class="rong-search-pathname-suffix">{{getPathNameSuffix(org)}}</span>
                                            </div>
                                        </div>
                                    </div>
                                </template>
                            </li>
                            <div v-if="orgsDetail.isPart && orgsDetail.list.length === orgDetailList.length" class="rong-no-more">{{locale.tips.noMoreInfo}}</div>
                        </ul>
                    </div>

                    <div v-if="showGroups" class="rong-search-members rong-search-groups">
                        <div class="rong-search-members-hd">
                            <template v-if="groups.length > 3">
                                <a v-if="currentView === 'groups'" href="#collapse" @click.prevent="currentView = ''">{{locale.btns.collapse}}</a>
                                <a v-else href="#more" @click.prevent="currentView = 'groups'">{{locale.btns.more}}</a>
                            </template>
                            <h2>{{locale.contact.group}}（{{groups.length}}）</h2>
                        </div>
                        <ul ref="showList" class="rong-group-userlist-bd" v-scrollTop>
                            <li v-for="(group, index) in groupsList" :key="index">
                                <div class="rong-result-item rong-clearfix rong-clickable" @click="showConversation(3, group.id)">
                                    <avatar class="rong-result-item-aside rong-group-avatar" :group="group"></avatar>
                                    <div class="rong-result-item-main">
                                        <div class="rong-search-name">
                                            <span v-html="getHighlightGroupName(group)"></span>
                                            <span v-if="showGroupType(group)" class="rong-tag">{{getGroupType(group.type)}}</span>
                                            ({{group.member_count}})
                                        </div>
                                        <div v-if="getMatchedMembers(group)" class="rong-search-summary" v-html="locale.tips.contain + getMatchedMembers(group)"></div>
                                    </div>
                                </div>
                            </li>
                        </ul>
                    </div>

                    <div v-if="showPubs" class="rong-search-members rong-search-pubs">
                        <div class="rong-search-members-hd">
                            <template v-if="pubs.length > 3">
                                <a v-if="currentView === 'pubs'" href="#collapse" @click.prevent="currentView = ''">{{locale.btns.collapse}}</a>
                                <a v-else href="#more" @click.prevent="currentView = 'pubs'">{{locale.btns.more}}</a>
                            </template>
                            <h2>{{locale.contact.app}}（{{pubs.length}}）</h2>
                        </div>
                        <ul ref="showList" class="rong-group-userlist-bd" v-scrollTop>
                            <li v-for="(item, index) in pubsList" :key="index">
                                <div class="rong-result-item rong-clearfix rong-clickable" @click="nextAction(7, item.id, item)">
                                    <avatar class="rong-result-item-aside" :user="item"></avatar>
                                    <div class="rong-result-item-main rong-search-only-name">
                                        <div class="rong-search-name">
                                            <span v-html="getHighlightUsername(item)"></span>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        </ul>
                    </div>

                    <div v-if="showHistory" class="rong-search-members rong-search-history">
                        <div class="rong-search-members-hd">
                            <template v-if="history.length > 3">
                                <a v-if="currentView === 'history'" href="#collapse" @click.prevent="currentView = ''">{{locale.btns.collapse}}</a>
                                <a v-else href="#more" @click.prevent="currentView = 'history'">{{locale.btns.more}}</a>
                            </template>
                            <h2>{{locale.chatHistory}}（{{history.length}}）</h2>
                        </div>
                        <ul ref="showList" class="rong-group-userlist-bd" v-scrollTop>
                            <li v-for="(item, index) in historyList" :key="index">
                                <div class="rong-result-item rong-clearfix">
                                    <avatar class="rong-result-item-aside" v-if="item.group" :group="item.group"></avatar>
                                    <avatar class="rong-result-item-aside" v-if="item.user" :user="item.user"></avatar>
                                    <div class="rong-result-item-main">
                                        <a href="#history-detail" @click.prevent="showDeatil(item)">
                                            <div class="rong-search-name">
                                                <template v-if="item.user">{{getUsername(item.user)}}</template>
                                                <template v-else>{{getGroupName(item.group)}}</template>
                                            </div>
                                            <div v-if="item.matchCount == 1" >
                                                <div class="rong-search-summary" v-html="matchHighlight(item.latestMessage)"></div>
                                            </div>
                                            <div class="rong-search-summary" v-else>
                                            {{localeFormat(locale.resultHistory, item.matchCount)}}</div>
                                        </a>
                                    </div>
                                </div>
                            </li>
                        </ul>
                    </div>
                    <div v-if="showHistoryDetail" class="rong-search-history-detail">
                        <div class="rong-search-members-hd">
                            <a href="#back" @click.prevent="showHistoryDetail = false">{{locale.btns.back}}</a>
                        <h2 v-html="localeFormat(locale.resultHistoryDetail, historyDetailList.length, '<em>' + keyword + '</em>')"></h2>
                        </div>
                        <ul ref="showList" class="rong-group-userlist-bd" v-scrollTop>
                            <li v-for="(item, index) in historyDetailList" :key="index">
                                <a class="rong-result-item rong-clearfix" href="#more" @click.prevent="gotoMessage(item)">
                                    <avatar class="rong-result-item-aside" :user="item.user"></avatar>
                                    <div class="rong-result-item-main">
                                        <template>{{getUsername(item.user)}}</template>
                                        <div class="rong-search-summary" v-html="matchHighlight(item)"></div>
                                    </div>
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </transition>
    </div>
</template>
<script src='./search.js'></script>
