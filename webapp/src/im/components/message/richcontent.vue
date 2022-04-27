<template>
    <div class="rong-conversation-one-message rong-richcontent-message" v-if="collect==undefined">
        <a :href="contentUrl" target="_blank">
            <div class="rong-richcontent-title">{{content.title}}</div>
            <div class="rong-richcontent-content">
                <div class="rong-richcontent-content-text" :title="content.content">
                    {{content.content}}
                </div>
            </div>
            <!-- <img v-if="content.imageUri" class="rong-richcontent-image" :src="content.imageUri" alt=""> -->
            <!-- <img v-else class="rong-richcontent-image-default" alt=""> -->
            <!-- <div v-if="content.showUrl"  slot="success" class="rong-richcontent-image" :style="{'background-image': 'url(' + content.showUrl + ')'}"></div>
            <div v-else class="rong-richcontent-image-default"></div> -->
            <imageLoader :url="showUrl">
                <div slot="success" class="rong-richcontent-image" :style="{'background-image': 'url(\'' + showUrl + '\')'}"></div>
                <div class="rong-richcontent-image-default"></div>
            </imageLoader>
        </a>
    </div>
    <div v-else style="position: relative;">
        <div v-if="!sendCollect">
            <a :href="content.url" target="sendCollect==undefined?_blank ''" v-if="+content.sourceType!==3">
                <imageLoader :url="showUrl">
                    <div slot="success" class="rong-richcontent-collect-image" :style="{'background-image': 'url(\'' + showUrl + '\')'}"></div>
                    <div class="rong-richcontent-image-collect-link"></div>
                </imageLoader>
                <div class="rong-richcontent-collect-title" style="position: absolute;left: 48px;top:0;">{{content.title}}</div>
            </a>
            <a @click="preview(content.url)" v-else style="cursor: pointer;">
                <imageLoader :url="showUrl">
                    <div slot="success" class="rong-richcontent-collect-image" :style="{'background-image': 'url(\'' + showUrl + '\')'}"></div>
                    <div class="rong-richcontent-image-collect-link"></div>
                </imageLoader>
                <div class="rong-richcontent-collect-title" style="position: absolute;left: 48px;top:0;">{{content.title}}</div>
            </a>
        </div>
        <div v-else>
            <imageLoader :url="showUrl">
                <div slot="success" class="rong-richcontent-collect-image" :style="{'background-image': 'url(\'' + showUrl + '\')'}"></div>
                <div class="rong-richcontent-image-collect-link"></div>
            </imageLoader>
            <div class="rong-richcontent-collect-title" style="position: absolute;left: 48px;top:0;">{{content.title}}</div>
        </div>
    </div>
</template>
<script src='./richcontent.js'></script>
