<template>
    <div class="rong-component" :style="{width: width + 'px'}">
        <div class="rong-resize rong-resize-x" :class="['rong-resize-' + getResizeDirection()]"></div>
        <search></search>
        <div class="rong-list-main">
            <div class="rong-list-pin">
                <div :class="{'rong-list-new-pin':receiverUnReadCount.unComment || receiverUnReadCount.unConfirm, 'rong-pin-receive-confirm': receiverUnReadCount.unConfirm}">
                    <em v-if="receiverUnReadCount">{{receiverCount}}</em>
                    <router-link class="rong-list-pin-received" to="/pin/received">{{locale.pin.receive}}</router-link>
                </div>
                <div :class="{'rong-list-new-pin':sendUnReadCount}">
                    <em v-if="sendUnReadCount"></em>
                    <router-link class="rong-list-pin-sent" to="/pin/sent">{{locale.pin.send}}</router-link>
                </div>
            </div>
        </div>
    </div>
</template>
<script src='./nav.js'></script>
