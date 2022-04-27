<template>
<div class="rong-conversation-setting rong-history" :class="['rong-history-selected-' + messageTypeClassName]" @click.stop="">
    <div class="rong-conversation-setting-hd">
        <h2 class="rong-conversation-setting-title">{{locale.title}}</h2>
    </div>

    <div v-if="supportSearch" class="rong-history-tab">
        <a href="#all" class="rong-history-all" @click.prevent="messageType = '' ">{{locale.all}}</a>
        <a href="#file" class="rong-history-file" @click.prevent="messageType = 'FileMessage' ">{{locale.file}}</a>
        <a href="#image" class="rong-history-image" @click.prevent="messageType = 'ImageMessage' ">{{locale.image}}</a>
    </div>

    <div v-if="supportSearch && notOnlyImage" class="rong-history-search rong-common-search-field">
        <input ref="searchInputBox" type="text" v-model.trim="keyword" @keyup.esc="clear" class="rong-field" :placeholder="locale.btns.search">
        <i class="rong-search-icon"></i>
        <button v-if="keyword" class="rong-common-search-clear" type="button" :title="locale.btns.clear" @click="clear"></button>
    </div>

    <div ref="main" class="rong-history-main" :class="{'rong-history-pc': supportSearch}">
        <div v-if="busy" class="rong-loading"><span>{{locale.tips.loading}}</span></div>
        <template v-else>
            <div class="rong-search-empty" v-if="messageList.length < 1">
                <div v-if="keyword" v-html="localeFormat(locale.tips.searchEmpty, '<em>&quot;' + keyword + '&quot;</em>')"></div>
                <div v-else>{{locale.empty}}</div>
            </div>
            <ul v-watermark v-if="notOnlyImage" v-auto-scrolltotop="filterSightThumbList">
                <li v-for="item in filterSightThumbList" :class="['rong-' + getMessageType(item).toLowerCase()]" :key="item.messageId">
                    <div class="rong-history-item-hd">
                        {{getUsername(item.user)}}（{{dateFormat(item.sentTime, 'DD/MM/YYYY HH:mm:ss')}}）
                    </div>
                    <div class="rong-history-item-bd">
                        <component :is="getMessageType(item)" :message="item" :message-list="filterSightThumbList" :keyword="keyword" @showImage="showImage" @showSight="showSight"></component>
                    </div>
                </li>
            </ul>
            <ul v-watermark v-else ref="content" v-auto-scrolltotop="imageList" @mousewheel="scroll($event)" @wheel="scroll($event)">
                <li v-for="(blockFilterList, index) in imageList" :key="index" class="rong-history-image-item">
                    <div class="rong-history-time">{{ blockFilterList.name }}</div>
                    <ul class="rong-history-time-list">
                        <li v-for="item in blockFilterList.data" :class="['rong-' + getMessageType(item).toLowerCase()]" :id="'rong-history-message-' + item.messageId" :key='item.content.imageUri'>
                            <div class="rong-history-image-time">{{dateFormat(item.sentTime, 'DD/MM/YYYY HH:mm:ss')}}</div>
                            <div class="rong-history-item-bd">
                                <component :is="getMessageType(item)" :message="item" :message-list="imgViewerSource" :keyword="keyword" :isHistory="true" @showImage="showImage" @showSight="showSight"></component>
                            </div>
                        </li>
                    </ul>
                </li>
            </ul>
        </template>
    </div>

    <div class="rong-pagination" v-if="notOnlyImage">
        <a class="rong-pagination-prev" :class="{'rong-pagination-disabled': currentPage==1}" href="#prev" :title="locale.btns.prevPage" @click.prevent="prev()"></a>
        <span class="rong-pagination-num">{{currentPage}}<template v-if="keyword">/{{pageCount}}</template></span>
        <a class="rong-pagination-next" :class="{'rong-pagination-disabled': currentPage==pageCount}" href="#next" :title="locale.btns.nextPage" @click.prevent="next()"></a>
    </div>
</div>
</template>
<script src='./history.js'></script>
