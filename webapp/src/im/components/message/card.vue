<template>
    <div class="rong-conversation-one-message">
        <div class="rong-profile">
            <avatar class="rong-profile-aside" @clickavatar="userProfile(content.userId)" :user="content"></avatar>
            <div class="rong-profile-main">
                <div v-if="isMultiSelected">
                    {{getUsername(content)}}
                </div>
                <a v-else class="rong-profile-name" @click.prevent="userProfile(content.userId)" href="#user">{{getUsername(content)}}</a>
            </div>
        </div>
        <div class="rong-cardmessage-ft">{{locale.businessCard}}</div>
    </div>
</template>
<script src='./card.js'></script>
