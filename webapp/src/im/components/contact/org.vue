<template>
    <div class="rong-contact-main">
        <div v-show="loadingNextPage" class="rong-loading-bottom"><span>{{locale.tips.loading}}</span></div>
        <div class="rong-contact-hd rong-dragable">
            <h2 class="rong-contact-title">{{company.name}}</h2>
        </div>
        <div ref="list" v-watermark class="rong-contact-content" v-rong-scroll-bar-y v-rong-scroll-to-bottom="loadMore">
            <div class="rong-crumb">
                <template>
                    <template v-for="(item, index) in breadcrumb">
                        <router-link :key="index" :to="getRoute(item)">{{item.name}}</router-link> /
                    </template>
                    <em v-if="breadcrumb.length > 0">{{deptName}}</em>
                    <em v-else>{{company.name}}</em>
                </template>
            </div>

            <ul class="rong-contact-list">
                <li class="rong-profile" v-for="(item, index) in members" :key="index">
                    <avatar class="rong-profile-aside rong-avatar-middle" @clickavatar="userProfile(item.id)" :user="item"></avatar>
                    <div class="rong-profile-main">
                        <a class="rong-profile-name" @click.prevent="userProfile(item.id)" href="#user">{{getUsername(item)}}</a>
                    </div>
                </li>
            </ul>
            <div class="rong-contact-subclass" v-show="depts.length > 0">
                <div class="rong-contact-subclass-hd">{{locale.contact.department}}</div>
                <ul class="rong-contact-list">
                    <li class="rong-profile" v-for="(item, index) in depts" :key="index">
                        <router-link class="rong-avatar rong-profile-aside rong-dept-icon" :to="getRoute(item)"></router-link>
                        <div class="rong-profile-main">
                            <div class="rong-profile-name">
                                <router-link :to="getRoute(item)">{{item.name}}</router-link>
                                <!-- <span v-if="item.type" class="rong-tag">{{getTypeName(item.type)}}</span> -->
                            </div>
                            <div class="rong-profile-count">{{memberCount(item)}}</div>
                        </div>
                    </li>
                </ul>
            </div>
            <div class="rong-contact-subclass" v-show="companies.length > 0">
                <div class="rong-contact-subclass-hd">{{locale.contact.subcompany}}</div>
                <ul class="rong-contact-list">
                    <li class="rong-profile" v-for="item in companies" :key="item.id">
                        <router-link v-if="item.logoUrl" :style="{'background-image': 'url(' + item.logoUrl + ')'}" class="rong-avatar rong-profile-aside rong-company-icon" :to="getRoute(item)"></router-link>
                        <router-link v-else class="rong-avatar rong-profile-aside rong-company-icon" :to="getRoute(item)"></router-link>
                        <div class="rong-profile-main">
                            <div class="rong-profile-name">
                                <router-link :to="getRoute(item)">{{item.name}}</router-link>
                                <!-- <span v-if="item.type" class="rong-tag"></span> -->
                            </div>
                            <div class="rong-profile-count">{{memberCount(item)}}</div>
                        </div>
                    </li>
                </ul>
            </div>
            <div v-if="isPart && allList.length === lastIndex" class="rong-no-more">{{locale.tips.noMoreInfo}}</div>
        </div>
    </div>
</template>
<script src='./org.js'></script>
