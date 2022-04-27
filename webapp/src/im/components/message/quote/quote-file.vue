<template>
    <div>
        <a href="#download" class="rong-quote-file-name" v-if="support.openFile && downloadStatus == 'DOWNLOADED' " @click.prevent="openFile">
            [{{locale.components.quoteMessage.file}}] <span class="rong-quote-file-basename" :style="{maxWidth: 'calc(100% - '+ extnameWidth + 'px - ' + 37 +'px)'}">{{basename}}</span><span>{{extname}}</span>
        </a>
        <a href="#download" class="rong-quote-file-name" v-else @click.prevent="download(message)">
            [{{locale.components.quoteMessage.file}}] <span class="rong-quote-file-basename" :style="{maxWidth: 'calc(100% - ' + extnameWidth + 'px - ' + 37 +'px)'}">{{basename}}</span><span>{{extname}}</span>
        </a>
        <div v-if="isShowProgress()" class="rong-file-progress"><span :style="{width: downloadProgress + '%'}"></span></div>
    </div>
</template>
<script src='./quote-file.js'></script>
