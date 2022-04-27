<template>
    <div class="rong-syncdata" :style="{opacity: successOpacity}">
        <div class="rong-sycndata-loading">
            <div class="rong-pie-wraper">
                <svg v-if="!showFail" width="100%" height="100%" version="1.1" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <linearGradient id="orange_red" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:rgb(193,229,255);
                        stop-opacity:1"/>
                        <stop offset="100%" style="stop-color:rgb(0,153,255);
                        stop-opacity:1"/>
                        </linearGradient>
                    </defs>
                    <circle cx="95" cy="95" r="91" stroke="#BBBBBB" stroke-width="4" fill="none"/>
                    <path stroke="#0099FF" stroke-width="4" transform="translate(95,95)" fill="none" v-bind:d="pathLeft" />
                    <path v-if="per < 1" stroke="url(#orange_red)" stroke-width="4"
                        transform="translate(95,95)" fill="none" v-bind:d="pathRight"/>
                    <path v-else stroke="#0099FF" stroke-width="4" transform="translate(95,95)" fill="none" v-bind:d="pathRight" />
                    <circle v-if="per < 1" transform="translate(95,95)" v-bind:cx="touch.x" v-bind:cy="touch.y" r="5" fill="#0099FF"/>
                </svg>
                <div class="rong-syncdata-fail" v-if="showFail"></div>
                <template v-else>
                    <div class="rong-syncdata-process" v-if="per < 1">
                        <span>{{getProcess}}</span>
                    </div>
                    <div class="rong-syncdata-success" v-else></div>
                </template>
            </div>
            <div class="rong-syncdata-refresh">
                <p>{{showTips}}</p>
                <button v-if="showFail" @click="retryHandle">{{locale.btns.refresh}}</button>
            </div>
        </div>
    </div>
</template>
<script src='./syncdata-loading.js'></script>
