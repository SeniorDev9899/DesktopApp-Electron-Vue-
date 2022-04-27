<template>
    <div class="rong-contact-main">
        <div class="rong-contact-hd rong-dragable">
            <h2 class="rong-contact-title">{{locale.title}}</h2>
        </div>
        <div v-if="!showEmptyGroup && isLoadDone" class="rong-contact-content" v-rong-scroll-bar-y v-watermark>
            <ul class="rong-contact-list">
                <!--
                    37856- 【我的群组】我的群组里，已经解散的群不应在我的群组里显示
                    Don't show the banded groups(v-show="group.group_status !== 2)
                -->
                <li class="rong-profile" v-for="(group, index) in groups" :key="index" v-show="group.group_status !== 2">
                    <avatar class="rong-profile-aside rong-avatar-middle" :group="group" @clickavatar="startConversation(group.id)"></avatar>
                    <div class="rong-profile-main">
                        <div class="rong-profile-name">
                            <a @click.prevent="startConversation(group.id)" href="#user">{{getGroupName(group)}}</a>
                            <span class="rong-tag">{{getGroupType(group.type)}}</span>
                        </div>
                        <div class="rong-profile-count">{{ memberCount(group) }}</div>
                    </div>
                </li>
            </ul>
        </div>
        <div v-else-if="isLoadDone" class="rong-empty-contact">
            <div class="rong-empty-contact-hd rong-dragable"></div>
            <div class="rong-empty-contact-bd rong-empty-group-bd"><p>{{locale.emptyMessage.group}}</p></div>
        </div>
    </div>
</template>
<script src='./group.js'></script>
