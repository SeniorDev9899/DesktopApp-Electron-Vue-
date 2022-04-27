<template>
    <ul class="rong-system">
        <li class="rong-system-version">
            <label class="rong-system-text">{{locale.versionInfo}}</label>
            <!-- 39331 - 【设置】英文语言模式下，功能介绍及版本更新没有变成英文显示 -->
            <em>{{locale.productName}} v{{product.version}} (Build:{{product.versionCode}})</em>
        </li>
        <li v-if="showVersion">
            <label class="rong-system-text">{{locale.components.appversion.title}}</label>
            <button class="rong-system-version-btn" @click="showVersions()">{{locale.components.appversion.show}}</button>
        </li>
    </ul>
</template>
<script src='./about.js'></script>
