<template>
    <div class="rong-audio" :class="{'rong-audio-playing': isPlaying}">
        <div class="rong-conversation-one-message rong-audio-bd" :style="{width: widthStyle}" @click="play">
            <i class="rong-audio-icon"></i>
            <span class="rong-audio-length">{{duration}}"</span>
            <div v-show="isUnread && isReceiver" class="rong-audio-unread"></div>
        </div>
    </div>
</template>
<script src='./voice.js'></script>
