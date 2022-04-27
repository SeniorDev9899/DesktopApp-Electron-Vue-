<template>
    <div class="rong-conversation-one-message">
        <a v-if="!isMultiSelected" :href="url" target="_blank">
            <div class="rong-locationmessage-text">
                <div class="rong-locationmessage-hd">{{location.poi}}</div>
                <!-- <div class="rong-locationmessage-bd"></div> -->
            </div>
            <img v-if="base64" class="rong-locationmessage-thumbnail" :src="base64" alt="">
        </a>
        <div v-else>
            <div class="rong-locationmessage-text">
                <div class="rong-locationmessage-hd">{{location.poi}}</div>
                <!-- <div class="rong-locationmessage-bd"></div> -->
            </div>
            <img v-if="base64" class="rong-locationmessage-thumbnail" :src="base64" alt="">
        </div>
    </div>
</template>
<script src='./location.js'></script>
