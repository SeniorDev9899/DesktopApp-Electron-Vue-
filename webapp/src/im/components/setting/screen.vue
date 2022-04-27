<template>
    <ul class="rong-system">
        <li>
            <label class="rong-system-text">{{locale.autoLock}}</label>
            <label class="rong-switch">
                <input type="checkbox" v-model="autoLock">
                <i></i>
            </label>
        </li>
        <li class="rong-setting-screen-pwd" v-show="autoLock">
            <label class="rong-system-text">{{locale.setUnlockPwd}}</label>
            <input ref="unlockPwd" type="text" class="rong-field" onpaste="return false;" @input="input($event)" @keydown.enter="submit" v-model="unlockPwd">
            <div v-if="!unlockPwd" class="rong-form-error">{{locale.placeholder}}</div>
            <div v-else-if="error" class="rong-form-error">{{locale.error}}</div>
        </li>
        <li class="rong-setting-screen-note" v-show="autoLock">
            <span>{{locale.note}}</span>
        </li>
        <li class="rong-screen-submit" v-show="autoLock">
            <button class="rong-button rong-submit" type="submit" @click="submit">{{locale.btns.confirm}}</button>
        </li>
    </ul>
</template>
<script src='./screen.js'></script>
