<template>
    <div class="rong-avatar" @click="validUser && $emit('clickavatar')" :class="{ 'rong-avatar-disabled': !validUser }">
         <template v-if="userData && JSON.stringify(userData) !=='{}'">
            <template v-if="isFileHelper">
                <div class="rong-avatar-img">
                    <div class="rong-avatar-img rong-avatar-filehelper"></div>
                </div>
            </template>
            <template v-else>
                <div v-if="userData.avatar" class="rong-avatar-img">
                    <div v-if="avatarLoadSuccess" class="rong-avatar-img" :style="{'background-image': 'url(\'' + getAvatar(userData.avatar) + '\')'}">
                    </div>
                    <div v-if="!avatarLoadSuccess && avatarLoaded" class="rong-avatar-img-back"></div>
                </div>
                <div v-else class="rong-avatar-item" :class="['rong-avatar-theme-' + getThemeIndex(userData.id)]">{{userData.name | slice}}</div>
                <i v-if="onlineStatus && validUser" class="rong-avatar-status" :class="['rong-avatar-' + onlineStatus]"></i>
            </template>
        </template>
        <template v-else-if="group">
            <div v-if="group.avatar" class="rong-avatar-img rong-avatar-group-back">
                <div v-if="groupAvatarLoadSuccess" class="rong-avatar-img" :style="{'background-image': 'url(\'' + getAvatar(group.avatar) + '\')'}"></div>
                <div v-else class="rong-avatar-img-back"></div>
            </div>
            <div v-else-if="group.firstNine && group.firstNine.length > 0" class="rong-avatar-group rong-avatar-sprite" :class="['rong-avatar-' + memberAvatars.length]">
                <div class="rong-avatar-group-bd">
                    <template v-for="(src, index) in memberAvatars">
                        <span v-if="src" class="rong-avatar-sprite-item rong-avatar-img" :key="index">
                            <span v-if="groupMemberavatarLoadSuccess[index]" class="rong-avatar-img" :style="{'background-image': 'url(\'' + getAvatar(src) + '\')'}"></span>
                            <span v-else class="rong-avatar-img-back"></span>
                        </span>
                        <span v-else :class="['rong-avatar-sprite-item rong-avatar-theme-' + getThemeIndex(memberIdList[index])]"
                            :load-sucess="groupMemberavatarLoadSuccess[index]" :key="index">
                            <em :class="{ 'rong-avatar-sprite-one': isOneMember }">{{memberNames[index] | slice}}</em>
                        </span>
                        <br :key="index">
                    </template>
                </div>
            </div>
            <div v-else class="rong-avatar-img-back"></div>
        </template>
        <template v-else>
            <div class="rong-avatar-img">
                <div class="rong-avatar-img-back"></div>
            </div>
        </template>
    </div>
</template>
<script src='./avatar.js'>
