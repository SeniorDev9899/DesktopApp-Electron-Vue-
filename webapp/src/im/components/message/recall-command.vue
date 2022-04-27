<template>
    <div class="rong-conversation-tip">{{getRecallCommand(message)}}
        <a href="#edit" class="rong-link-button" v-if="canEdit && !isBanned" @click="recallEdit(message)">{{locale.message.recallEdit}}</a>
    </div>
</template>
<script src='./recall-command.js'></script>
