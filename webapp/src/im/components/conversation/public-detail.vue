<template>
    <div class="rong-conversation-setting rong-conversation-public" @click.stop="" v-show="isShow">
        <div class="rong-conversation-setting-hd">
            <h2 class="rong-conversation-setting-title">{{ locale.title }}</h2>
        </div>
        <div class="rong-conversation-setting-bd">
            <div class="rong-members">
                <div class="rong-setting-public">
                    <a v-if="user" class="rong-public-image">
                        <avatar :user="user" class="rong-avatar-small"></avatar>
                    </a>
                    <p>{{ publicName }}</p>
                    <p class="rong-setting-public-tip">{{ publicDescription }}</p>
                </div>
            </div>

            <ul class="rong-conversation-switch rong-setting-no-border">
                <li class="rong-clearfix">
                    <label class="rong-item-label">{{locale.mute}}</label>
                    <label class="rong-switch">
                        <input type="checkbox" v-model="isMute"><i></i>
                    </label>
                </li>
                <li class="rong-clearfix">
                    <label class="rong-item-label">{{locale.top}}</label>
                    <label class="rong-switch">
                        <input type="checkbox" v-model="isTop"><i></i>
                    </label>
                </li>
            </ul>
            <div class="rong-public-button">
                <button class="rong-button" @click="enterPublic">{{locale.enter}}</button>
            </div>
        </div>
    </div>
</template>
<script src='./public-detail.js'></script>
