<template>
    <div class="rong-contact-main">
        <div class="rong-contact-hd rong-dragable">
            <h2 class="rong-contact-title">{{locale.title}}</h2>
        </div>
        <div v-if="!showEmptyFriend && isLoadDone" class="rong-contact-content" v-rong-scroll-bar-y>
            <ul class="rong-contact-list rong-friend-list">
                <li class="rong-profile" v-for="(item, index) in list" :key="index">
                    <avatar class="rong-profile-aside rong-avatar-middle" @clickavatar="userProfile(item.id || item.uid)" :user="item.user"></avatar>
                    <div class="rong-profile-main">
                        <button v-show="showAccept(item)" class="rong-button rong-submit rong-friend-add" type="button" @click.prevent="acceptFriend(item)">{{locale.accept}}</button>
                        <button v-show="showRequest(item)" class="rong-button rong-friend-add" disabled>{{locale.sent}}</button>
                        <button v-show="showOverDate(item)" class="rong-button rong-friend-add" disabled>{{locale.expired}}</button>
                        <button v-show="showAdded(item)" class="rong-button rong-friend-add" disabled>{{locale.added}}</button>
                        <a class="rong-profile-name" @click.prevent="userProfile(item.id || item.uid)" href="#user">{{getUsername(item)}}</a>
                    </div>
                </li>
            </ul>
        </div>
        <div v-else-if="isLoadDone" class="rong-empty-contact">
            <div class="rong-empty-contact-hd rong-dragable"></div>
            <div class="rong-empty-contact-bd rong-empty-friend-request-bd"><p>{{locale.emptyMessage.newFriend}}</p></div>
        </div>
    </div>
</template>
<script src='./request-friend.js'></script>
