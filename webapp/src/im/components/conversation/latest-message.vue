<template>
    <span class="rong-latest-message" v-if="isSupport"
        :class="['rong-latest-message-' + platform]" v-html="content"></span>
    <span v-else-if="isInvalid"></span>
    <span v-else>{{locale.message.unknown}}</span>
</template>
<script src='./latest-message.js'></script>
