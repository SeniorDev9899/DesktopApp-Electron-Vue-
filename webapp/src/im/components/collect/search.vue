<template>
    <div class="rong-search rong-dragable">
        <div class="rong-search-hd">
            <div class="rong-search-main">
                <input type="text" v-model.trim="keyword" @keyup.esc="clear" @keyup="search" class="rong-field rong-field-search" :placeholder="locale.btns.search" ref="searchBox">
                <i class="rong-search-icon"></i>
                <button v-if="keyword" class="rong-search-clear" type="button" :title="locale.btns.clear" @click="clear"></button>
            </div>
        </div>
    </div>
</template>
<script src='./search.js'></script>
