<template>
    <div class="rong-component" :style="{width: width + 'px'}">
        <div class="rong-resize rong-resize-x" :class="['rong-resize-' + getResizeDirection()]"></div>
        <search></search>
        <div class="rong-list-main rong-list-contact">
            <ul class="rong-list-content rong-contact" v-rong-scroll-bar-y>
                <li v-if="companyList.length > 0 && isStaff">
                    <ul>
                        <li v-for="(company, index) in companyList" :key="index" :class="{'rong-contact-expand': company.expand}">
                            <div class="rong-contact-item-hd rong-contact-toggle" @click="toggleList(company)">
                                <imageLoader :url="company.logoUrl">
                                    <i slot="success" class="rong-company-icon" :style="{'background-image': 'url(' + company.logoUrl + ')'}"></i>
                                    <i class="rong-contact-logo"></i>
                                </imageLoader>
                                <em :title="company.name">{{company.name}}</em>
                            </div>
                            <ul class="rong-contact-child">
                                <li><router-link :to="'/contact/org/' + company.id">{{locale.contactOrg}}</router-link></li>
                                <template v-if="company.myDept">
                                    <li v-for="(info, index) in company.myDept.deptList" :key="index"><router-link :to="'/contact/mydept/' + info.companyId + '/' + info.deptId + '/' + info.deptType + ''">{{getMyDeptName(info, company, company.myDept.deptList)}}</router-link></li>
                                </template>
                                <!-- <li v-for="subcompany in company.subcompanyList"><router-link :to="'/contact/org/' + subcompany.id + '/2'">{{subcompany.name}}</router-link></li> -->
                            </ul>
                        </li>
                    </ul>
                </li>
                <li v-if="enabledStar">
                    <div class="rong-contact-item-hd rong-contact-star">
                        <em class="rong-selected" v-if="$route.name === 'star'">{{locale.contactStar}}</em>
                        <router-link v-else to="/contact/star">{{locale.contactStar}}</router-link>
                    </div>
                </li>
                <li v-if="enabledFriend">
                    <div class="rong-contact-item-hd rong-contact-request" :class="{'rong-contact-new': requestUnReadCount}">
                        <em class="rong-selected" v-if="$route.path === '/contact/request-friend'">{{locale.newFriend}}</em>
                        <router-link v-else to="/contact/request-friend">{{locale.newFriend}}</router-link>
                    </div>
                </li>
                <li v-if="enabledFriend">
                    <div class="rong-contact-item-hd rong-contact-friends">
                        <em class="rong-selected" v-if="$route.path === '/contact/friends'">{{locale.contactFriend}}</em>
                        <router-link v-else to="/contact/friends">{{locale.contactFriend}}</router-link>
                    </div>
                </li>
                <li>
                    <div class="rong-contact-item-hd rong-contact-approve" :class="{'rong-contact-new': approveUnReadCount}">
                        <em class="rong-selected" v-if="$route.name === 'approve'">{{locale.contactApprove}}</em>
                        <router-link v-else to="/contact/approve">{{locale.contactApprove}}</router-link>
                    </div>
                </li>
                <li>
                    <div class="rong-contact-item-hd rong-contact-group">
                        <em class="rong-selected" v-if="$route.name === 'group'">{{locale.contactGroup}}</em>
                        <router-link v-else to="/contact/group">{{locale.contactGroup}}</router-link>
                    </div>
                </li>
                <!--
                <li>
                    <div class="rong-contact-item-hd rong-contact-public">
                        <a href="">公众号</a>
                    </div>
                </li>
                -->
            </ul>
        </div>
    </div>
</template>
<script src='./list.js'></script>
