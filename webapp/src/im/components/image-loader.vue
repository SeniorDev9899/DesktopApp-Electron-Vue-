<template>
    <span class="rong-image-loader">
        <template v-if="success" class="rong-image-loader-success">
            <slot name="success"></slot>
        </template>
        <template v-else class="rong-image-loader-default">
            <slot></slot>
        </template>
    </span>
</template>
<script src='./image-loader.js'></script>
