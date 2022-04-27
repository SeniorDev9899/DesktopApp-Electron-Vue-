<template>
    <div class="rong-conversation-public-menu">
        <ul class="rong-public-menu-list">
            <li class="rong-officialaccount-menu-item" v-for="(menu, index) in menuInfo.menu_content"
                @click.stop="menuClick(menu)" :key="index"
                :class="{'rong-public-menu-parent' : menu.type === 0 }">
                <span>{{menu.name}}</span>
                <ul class="rong-sub-menu-list" v-show="menu.show">
                    <li v-for="(item, index) in menu.children" :key="index"
                         @click.stop="menuClick(item)">{{item.name}}</li>
                </ul>
            </li>
        </ul>
        <div class="rong-richfit-toolbar-toggle" @click="inputMenuChanged">
            <button class="rong-toolbar-toggle-input"></button>
        </div>
    </div>
</template>
<script src='./public-menu.js'></script>
