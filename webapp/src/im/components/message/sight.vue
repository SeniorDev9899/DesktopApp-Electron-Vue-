<template>
    <div class="rong-conversation-one-message rong-sight">
        <div class="rong-thumbnail"  @click.prevent="play">
            <img class="rong-thumbnail-small" :src="base64"  v-if="!message.noSupportView">
            <div class="unsupport-view-image"  v-else>
                <img class="rong-thumbnail-small">
            </div>
            <i class="rong-thumbnail-top"></i>
            <i class="rong-thumbnail-bottom"></i>
            <div class="rong-sight-status">
                <!-- <a class="rong-sight-play" v-show="!downloading"></a>
                <svg class="rong-sight-download" v-show="downloading" width="36px" height="36px" version="1.1" xmlns="http://www.w3.org/2000/svg"> -->
                <div v-if="!message.noSupportView">
                    <a class="rong-sight-play" v-show="!uploading"></a>
                    <svg class="rong-sight-download" v-show="uploading" width="36px" height="36px" version="1.1" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="18" cy="18" r="18" stroke="white" stroke-width="1" fill="none" style="opacity: 0.5"/>
                        <path stroke="white" transform="translate(18,18)" fill="white" v-bind:d="path" />
                    </svg>
                    <span class="rong-sight-time" v-show="!uploading">{{seconds}}</span>
                </div>
            </div>
        </div>

    </div>
</template>
<script src='./sight.js'></script>
