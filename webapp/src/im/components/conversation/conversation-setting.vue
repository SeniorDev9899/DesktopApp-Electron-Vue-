<template>
<div class="rong-conversation-setting" @click.stop="">
    <div class="rong-conversation-setting-hd">
        <h2 class="rong-conversation-setting-title">{{locale.title}}</h2>
    </div>
    <div class="rong-conversation-setting-bd">
        <div class="rong-members">
            <ul v-if="!isFileHelper" class="rong-clearfix">
                <li v-if="user">
                    <a href="" @click.prevent="userProfile(user.id)">
                        <avatar :user="user" class="rong-avatar-small"></avatar>
                        <div class="rong-members-username">{{getUsername(user)}}</div>
                    </a>
                </li>
                <li v-show="!executiveLimit(user) && !isFileHelper">
                   <a href="" class="rong-conversation-add" :title="locale.btns.add" @click.prevent="addMembers"></a>
                </li>
            </ul>
            <div v-else class="rong-setting-filehelper">
                <div class="rong-setting-helper-image"></div>
                <!-- <div v-if="user.avatar" class="rong-setting-helper-image" :style="'background-image: url(' + user.avatar + ')'"></div>
                <div v-else class="rong-setting-helper-image" :class="['rong-avatar-theme-' + getThemeIndex(user.id)]">{{user.name | slice}}</div> -->
                <p>{{fileHelperLocale.title}}</p>
                <p class="rong-setting-helper-tip">{{fileHelperLocale.desc}}</p>
            </div>
        </div>

        <ul class="rong-conversation-switch" :class="{'rong-setting-no-border': isFileHelper}">
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
    </div>
</div>
</template>
<script src='./conversation-setting.js'></script>
