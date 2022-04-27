<template>
    <div class="rong-custom-select" @click.stop="">
        <span class="rong-custom-select-selected" @click="toggleOption()">{{getSelected(value)}} <i></i> </span>
        <ul class="rong-custom-option" v-show="isShowOption">
            <li class="rong-custom-option-item" v-for="(item, index) in list" @click="select(item)"
                :title="getItemName(item)" :key="index">{{getItemName(item)}}</li>
        </ul>
    </div>
</template>
<script src='./custom-select.js'></script>
