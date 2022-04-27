<template>
    <div class="rong-contact-main">
        <div class="rong-contact-hd rong-dragable">
            <h2 class="rong-contact-title">{{locale.title}}</h2>
        </div>
        <div v-if="!showEmptyStar && isLoadDone" ref="list" class="rong-contact-content" v-rong-scroll-to-bottom="loadMore" v-rong-scroll-bar-y v-watermark>
            <ul class="rong-contact-list">
                <li class="rong-profile" v-for="(item, index) in pageList" :key="index">
                    <avatar class="rong-profile-aside rong-avatar-middle" @clickavatar="userProfile(item.id)" :user="item"></avatar>
                    <div class="rong-profile-main">
                        <a class="rong-profile-name" @click.prevent="userProfile(item.id)" href="#user">{{getUsername(item)}}</a>
                    </div>
                </li>
            </ul>
        </div>
        <div v-else-if="isLoadDone" class="rong-empty-contact">
            <div class="rong-empty-contact-hd rong-dragable"></div>
            <div class="rong-empty-contact-bd rong-empty-star-bd"><p>{{locale.emptyMessage.star}}</p></div>
        </div>
    </div>
</template>
<script src='./star.js'></script>
