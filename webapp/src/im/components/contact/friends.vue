<template>
    <div class="rong-contact-main">
        <div class="rong-contact-hd rong-dragable">
            <h2 class="rong-contact-title">{{locale.title}}</h2>
        </div>
        <div class="rong-contact-content" v-rong-scroll-bar-y v-watermark>
            <ul class="rong-contact-list rong-friend-list">
                <li class="rong-profile" v-for="(item, index) in orderFriend" :key="index">
                    <avatar class="rong-profile-aside rong-avatar-middle" @clickavatar="userProfile(item.id || item.uid)" :user="item"></avatar>
                    <div class="rong-profile-main">
                        <a class="rong-profile-name" @click.prevent="userProfile(item.id || item.uid)" href="#user">{{getUsername(item)}}</a>
                    </div>
                    <div v-if="isNavFriend(item)" v-scroll-to-letter="letter" :data-letter="getFirstLetter(item.name)"></div>
                </li>
                <li class="rong-profile">
                    <avatar class="rong-profile-aside rong-avatar-middle" :user="fileHelper" @clickavatar="getFileHelper(fileHelper)"></avatar>
                    <div class="rong-profile-main">
                        <a class="rong-profile-name" href="#user" @click.prevent="getFileHelper(fileHelper)">{{getUsername(fileHelper)}}</a>
                    </div>
                </li>
            </ul>
        </div>
    </div>
</template>
<script src='./friends.js'></script>
