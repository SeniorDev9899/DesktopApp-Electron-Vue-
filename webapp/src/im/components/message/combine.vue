<template>
    <div class="rong-conversation-one-message rong-rccombine" :style="containerStyle" @click="showCombineMsg">
        <em v-html="content" :style="style"></em>
    </div>
</template>
<script src='./combine.js'></script>
