<template>
    <div>
        {{locale.message.requestFriendVerification}} <a href="#" class="rong-link-button" @click.prevent="sendRequest">{{locale.message.requestFriendVerificationButton}}</a>
    </div>
</template>
<script src='./request-friend-verification.js'></script>
