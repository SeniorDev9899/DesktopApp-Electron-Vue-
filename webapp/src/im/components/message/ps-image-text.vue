<template>
    <div @click="preview" class="rong-conversation-one-message rong-psimagetext">
        <div class="rong-psimagetext-img" :style="{'background-image': 'url('+content.picurl+')'}"></div>
        <div class="rong-psimagetext-title">{{content.title}}</div>
        <div class="rong-psimagetext-digest" v-if="content.digest">{{content.digest}}</div>
        <div class="rong-psimagetext-preview">{{locale.message.readAll}}</div>
    </div>
</template>
<script src='./ps-image-text.js'></script>
