<template>
<div class="rong-conversation-setting rong-group-setting" @click.stop="">
    <div class="rong-conversation-setting-hd">
        <h2 class="rong-conversation-setting-title rong-tools-group-notice-title">{{locale.title}}</h2>
    </div>
    <div class="rong-conversation-setting-bd rong-group-notice-bd">
        <div class="rong-group-notice">
            <div class="rong-group-notice-show" v-if="isShow('notice')">
                <div class="rong-group-notice-title">
                    <avatar :user="user" style="cursor: default;"
                        class="rong-avatar-small rong-group-notice-sender"></avatar>
                    <div class="rong-group-notice-info">
                        <div class="rong-group-notice-info-name">{{getGroupUsername(user)}}</div>
                        <div class="rong-group-notice-info-time">{{locale.sentTime}} {{time}}</div>
                    </div>
                </div>
                <div class="rong-group-notice-content">
                   <textarea v-model="content" disabled class="rong-group-notice-content-scroll rong-group-notice-editor" v-rong-scroll-bar-y></textarea>
                </div>
            </div>

            <div v-if="isShow('empty')" class="rong-group-notice-empty">{{locale.empty}}</div>

            <textarea v-if="isShow('edit-box')" v-model="content" v-focus class="rong-group-notice-editor" :placeholder="locale.inputText" maxlength="5000">
            </textarea>
        </div>

        <ul class="rong-group-notice-btns" v-if="!isBanned">
            <li class="rong-group-notice-btn" v-if="isShow('clear')">
                <button class="rong-button" @click.prevent="clear">{{locale.btns.clear}}</button>
            </li>
            <li class="rong-group-notice-btn" v-if="isShow('edit')">
                <button v-if="isShow('empty')" class="rong-button rong-group-notice-select-btn" @click.prevent="edit">{{locale.edit}}</button>
                <button v-else class="rong-button rong-group-notice-select-btn" @click.prevent="edit">{{locale.edit}}</button>
            </li>
            <li class="rong-group-notice-btn" v-if="isShow('cancel')">
                <button class="rong-button" @click.prevent="cancel">{{locale.btns.cancel}}</button>
            </li>
            <li class="rong-group-notice-btn" v-if="isShow('publish')">
                <button v-if="publishDisabled" disabled="disabled" class="rong-button rong-group-notice-select-btn" @click.prevent="publish">{{locale.btns.publish}}</button>
                <button v-else class="rong-button rong-group-notice-select-btn" @click.prevent="publish">{{locale.btns.publish}}</button>
            </li>
        </ul>
    </div>
</div>
</template>
<script src='./group-notice.js'></script>
