<template>
    <div class="rong-component">
        <form action="" @submit.prevent="submit">
            <ul class="rong-entry-main-bd">
                <li>
                    <input v-model="phone" name="phone" class="rong-field"
                        autocomplete="off"
                        data-rule-required="true" :data-message-required="locale.phoneEmpty"
                        data-rule-mobile="true" :data-message-mobile="locale.phoneInvalid"
                        type="text" :placeholder="locale.phone">
                    <div v-if="errors.phone" class="rong-form-error">{{errors.phone}}</div>
                </li>
                <li class="rong-clearfix">
                    <div class="rong-captcha">
                        <input v-model="captcha" name="captcha" class="rong-field"
                            data-rule-required="true" :data-message-required="locale.captchaEmpty"
                            type="text" :placeholder="locale.captcha">
                        <div v-if="errors.captcha" class="rong-form-error">{{errors.captcha}}</div>
                    </div>
                    <div class="rong-captcha-button">
                        <button class="rong-button" :disabled="captchaButtonBusy || !enabledSms" type="button" @click="sendCaptcha">{{captchaButtonText}}</button>
                    </div>
                </li>
                <li>
                    <button type="submit" class="rong-button">{{locale.next}}<span v-if="busy">...</span></button>
                </li>
            </ul>
        </form>
        <div class="rong-entry-main-ft">
            <a href="#/login">{{locale.btns.login}}</a>
        </div>
    </div>
</template>
<script src='./step-phone.js'></script>
