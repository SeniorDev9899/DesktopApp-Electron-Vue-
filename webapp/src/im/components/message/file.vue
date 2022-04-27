<template>
    <div class="rong-conversation-one-message rong-file" :class="{'rong-file-uploading': isUploading()}">
        <div class="rong-file-inner">
            <i class="rong-file-icon" :class="getFileIconClass(message)"></i>
            <div class="rong-file-hd">
                <a v-if="isSupportOpenFile()" @click.prevent="openFile" :title="message.content.name" :href="fileUrl">
                    <span class="rong-file-basename" :style="{maxWidth: 'calc(100% - ' + extnameWidth + 'px)'}" v-html="highlight(basename)"></span>
                    <span v-html="highlight(extname)"></span>
                </a>
                <span v-else-if="canceled || !isCanDownload()" >
                    <span class="rong-file-basename" :style="{maxWidth: 'calc(100% - ' + extnameWidth + 'px)'}" v-html="basename"></span>
                    <span v-html="extname"></span>
                </span>
                <a v-else-if="isCanDownload()" :title="message.content.name" @click.prevent="sendCollect === undefined ? download(message) : ''">
                    <span class="rong-file-basename" :style="{maxWidth: 'calc(100% - ' + extnameWidth + 'px)'}" v-html="highlight(basename)"></span>
                    <span v-html="highlight(extname)"></span>
                </a>
            </div>
            <div class="rong-file-size">{{size}}</div>
            <div class="rong-file-state" :class="{'rong-file-state-min': isOverLength}">{{fileState}}</div>
            <div class="rong-file-metadata">
                {{getUsername(message.user)}}
                {{dateFormat(message.sentTime, 'DD/MM/YYYY HH:mm')}}
                {{canceled ? locale.cancelState : size}}
            </div>
            <template v-if="isUploading(message)">
                <div class="rong-file-progress"><span :style="{width: message.progress + '%'}"></span></div>
                <a class="rong-file-cancel" :title="locale.btns.cancel" @click="cancelUpload"></a>
            </template>
            <template v-else-if="isCancelUpload()">
                <div class="rong-file-progress"><span :style="{width: message.progress + '%'}"></span></div>
                <a class="rong-file-resume-upload" :title="locale.btns.resumeUpload" @click="resumeUpload(message)" v-show="!isWeb"></a>
            </template>
            <template v-else-if="isCanDownload()">
                <a v-if="support.downloadProgress" class="rong-file-download" :title="message.content.name" @click.prevent="download(message)"></a>
                <a v-else class="rong-file-download" :download="message.content.name" :href="fileUrl" target="_blank" rel="noopener"></a>
            </template>
            <template v-else-if="downloadStatus === 'CANCELLED' && !isMultiSelected">
                <div class="rong-file-progress"><span :style="{width: downloadProgress + '%'}"></span></div>
                <a class="rong-file-resume-download" :title="locale.btns.resumDownload"  @click="resumeDownload()"></a>
            </template>
            <template v-else-if="downloadStatus === 'DOWNLOADING' && !isMultiSelected">
                <div class="rong-file-progress"><span :style="{width: downloadProgress + '%'}"></span></div>
                <a class="rong-file-cancel" :title="locale.btns.cancel"  @click="pauseDownload"></a>
            </template>
            <a v-else-if="isShowOpenFolder(message) && !isMultiSelected"
                href="#open-folder" class="rong-file-open" :title="locale.openFolder" @click.prevent="openFolder">
            </a>
        </div>
    </div>
</template>
<script src='./file.js'></script>
