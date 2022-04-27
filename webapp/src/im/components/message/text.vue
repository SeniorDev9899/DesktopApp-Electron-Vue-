<template>
    <div class="rong-conversation-one-message" :style="containerStyle" @click="clickAtUser($event)">
        <em v-html="content" :style="style"></em>
    </div>
</template>
<script src='./text.js'></script>
