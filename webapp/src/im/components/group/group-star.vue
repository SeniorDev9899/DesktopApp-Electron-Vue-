<template>
    <div class="rong-group-tab-item" v-watermark>
        <div class="rong-group-search-field">
            <input type="text" v-model.trim="keyword" @keyup.esc="clear" class="rong-field rong-field-search" :placeholder="locale.btns.search">
            <i class="rong-search-icon"></i>
            <button v-if="keyword" class="rong-group-search-clear" type="button" :title="locale.btns.clear" @click="clear"></button>
        </div>

        <div class="rong-group-check" v-if="pageList.length > 0">
            <label class="rong-checkbox"><input type="checkbox" v-model="checkedAll" :indeterminate="indeterminate"><i></i> <span>{{locale.btns.checkedAll}}</span></label>
        </div>
        <ul ref="list" class="rong-group-userlist-bd rong-group-recent rong-group-star-list-bd" v-rong-scroll-to-bottom="loadMore" v-rong-scroll-bar-y>
            <li v-for="(item, index) in pageList" :key="index" :class="{'rong-disabled': showNotSelect(item)}">
                <label class="rong-checkbox"><input :id="item.id" type="checkbox" v-model="checked" :value="item.id" :disabled="isDisabled(item)"><i></i></label>
                <div class="rong-profile">
                    <label :for="item.id" class="rong-profile-aside rong-avatar-small">
                        <avatar :user="item"></avatar>
                    </label>
                    <div class="rong-profile-main">
                        <label :for="item.id" v-html="getUsername(item)"></label>
                    </div>
                </div>
            </li>
        </ul>
        <div v-if="pageList.length === 0 && keyword" class="rong-recent-empty" v-html="localeFormat(locale.tips.searchEmpty, '<em>&quot;' + keyword + '&quot;</em>')"></div>
    </div>
</template>
<script src='./group-star.js'></script>
