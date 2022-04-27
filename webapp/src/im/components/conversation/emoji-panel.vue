<template>
    <div class="rong-emoji-panel" @mouseover="show">
        <ul>
            <li v-for="(emoji, index) in list" :key="index">
                <span v-if="isShowEmojiSymbol" class="rong-emoji-item rong-emoji-mac-item" :title="emoji.symbol" @click="selectEmoji(emoji)">
                    <span class="rong-emoji-item-content">{{emoji.emoji}}</span>
                </span>
                <span v-else class="rong-emoji-item" :title="emoji.symbol" v-html="emoji.node.outerHTML" @click="selectEmoji(emoji)"></span>
            </li>
        </ul>
    </div>
</template>
<script src='./emoji-panel.js'></script>
