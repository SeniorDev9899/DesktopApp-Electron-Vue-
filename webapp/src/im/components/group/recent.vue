<template>
    <div class="rong-group-tab-item" v-watermark>
        <div class="rong-group-search-field">
            <input type="text" v-model.trim="keyword" @keyup.esc="clear" class="rong-field rong-field-search" :placeholder="locale.btns.search">
            <i class="rong-search-icon"></i>
            <button v-if="keyword" class="rong-group-search-clear" type="button" :title="locale.btns.clear" @click="clear"></button>
        </div>

        <div class="rong-group-check" v-if="searchResult.length > 0">
            <label class="rong-checkbox"><input type="checkbox" v-model="checkedAll" :indeterminate="indeterminate"><i></i> <span>{{locale.btns.checkedAll}}</span></label>
        </div>

        <ul v-if="searchResult.length > 0" class="rong-group-userlist-bd rong-group-recent rong-group-recent-list-bd" v-rong-scroll-bar-y>
            <li v-for="(item, index) in searchResult" :key="index" :class="{'rong-disabled': executiveLimit(item) || isbanned(item) || !isValidGroup(item)}">
                <label class="rong-checkbox"><input :id="item.id" type="checkbox" v-model="checked" :value="item.id" :disabled="isDisabled(item)"><i></i></label>
                <div v-if="isGroup(item)" class="rong-profile">
                    <label :for="item.id" class="rong-profile-aside rong-avatar-small">
                        <avatar :group="item"></avatar>
                    </label>
                    <div class="rong-profile-main">
                        <label :for="item.id" v-html="getUsername(item)"></label>
                        <span v-if="showGroupType(item)" class="rong-tag">{{getGroupType(item.type)}}</span>
                    </div>
                </div>
                <div v-else class="rong-profile">
                    <label :for="item.id" class="rong-profile-aside rong-avatar-small">
                        <avatar :user="item"></avatar>
                    </label>
                    <div class="rong-profile-main">
                        <label :for="item.id" v-html="getUsername(item)"></label>
                    </div>
                </div>
            </li>
        </ul>
        <div v-if="searchResult.length === 0 && keyword" class="rong-recent-empty" v-html="localeFormat(locale.tips.searchEmpty, '<em>&quot;' + keyword + '&quot;</em>')"></div>
    </div>
</template>
<script src='./recent.js'></script>
