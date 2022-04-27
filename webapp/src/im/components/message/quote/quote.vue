<template>
    <div class="rong-conversation-one-message rong-message-quote" :class="['rong-quote-' + type.toLowerCase()]" @click="clickAtUser($event)">
        <div class="rong-quote-container">
            <span class="rong-quote-username">
                <template v-if="isGroup">{{getGroupUsername(user)}}</template>
                <template v-else>{{getUsername(user)}}</template>
            </span>
            <div class="rong-quote-content">
                <component :is="type" :message="message" @showImage="showImage"></component>
            </div>
        </div>
        <div class="rong-quote-text" v-html="text"></div>
    </div>
</template>
<script src='./quote.js'></script>
