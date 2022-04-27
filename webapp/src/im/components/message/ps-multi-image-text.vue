<template>
    <div class="rong-conversation-one-message rong-psmultiimagetext">
        <div class="rong-psimagetext-img" :style="{'background-image': 'url('+main.picurl+')'}"
            @click="preview(main)">
            <div class="rong-psmultiimagetext-main-title">{{main.title}}</div>
        </div>
        <div class="rong-psmultiimagetext-sub-item" v-for="(item, index) in subList"
            @click="preview(item)" :key="index">
            <div class="rong-psmultiimagetext-sub-title">
                <div class="rong-multiline-hidden">
                    {{item.title}}
                </div>
            </div>
            <div class="rong-psmultiimagetext-sub-image" :style="{'background-image': 'url('+item.picurl+')'}"></div>
        </div>
    </div>
</template>
<script src='./ps-multi-image-text.js'></script>
