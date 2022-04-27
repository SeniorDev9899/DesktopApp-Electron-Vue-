<template>
    <div class="rong-conversation-one-message" @click="invite">
        <div v-if="type == 'audio'">
            <i class="rong-conversation-audio" :class="{'rong-conversation-audio-cancel': !isActive }" ></i>{{content}}
        </div>
        <div v-else>
            <i class="rong-conversation-video"></i>{{content}}
        </div>
        <div v-show="isReceiver && isUnread" class="rong-voip-unread"></div>
    </div>
</template>
<script src='./summary.js'></script>
