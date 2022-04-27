<template>
    <div>
        <div v-if="!message.noSupportView">
            <img v-if="isGif" class="rong-quote-image-img" @click="showImage" :src="message.content.content.imageUri">
            <img v-else class="rong-quote-image-img" @click="showImage" :src="base64">
        </div>
        <div v-else class="unsupport-view-image">
            <img class="rong-thumbnail-small">
        </div>
    </div>
</template>
<script src='./quote-image.js'></script>
