<template>
    <div class="rong-conversation-one-message rong-conversation-image">
        <div class="rong-thumbnail" @click.prevent="showImage">
            <div v-if="!message.noSupportView">
                <img class="rong-thumbnail-small" v-if="isGif" :src="imageUri" alt="" @load="updateThumbnailHeight($event)">
                <img class="rong-thumbnail-small" v-else-if="base64" :src="base64" alt="" @load="updateThumbnailHeight($event)">
                <img class="rong-thumbnail-large" v-if="!isGif && imageUri" @load="largeImageLoaded($event)" :src="imageUri" alt="">
            </div>
            <div class="unsupport-view-image"  v-else>
                <img class="rong-thumbnail-small">
            </div>
            <i class="rong-thumbnail-top"></i>
            <i class="rong-thumbnail-bottom"></i>
            <div class="rong-progress">
                <div class="rong-progress-bd" v-show="isUploading">
                    <svg width="24px" height="24px" version="1.1" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" stroke="white" stroke-width="2" fill="none" style="opacity: 0.5"/>
                        <path stroke="white" stroke-width="2" transform="translate(12,12)" fill="none" v-bind:d="path" />
                    </svg>
                </div>
            </div>
        </div>
    </div>
</template>
<script src='./image.js'></script>
