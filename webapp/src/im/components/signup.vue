<template>
    <div class="rong-entry rong-signup">
        <div class="rong-entry-hd rong-dragable"></div>
        <div class="rong-entry-bd rong-clearfix">
            <div class="rong-entry-aside">
                <div class="rong-product">
                    <span class="rong-product-name">{{productName}}</span>
                </div>
            </div>
            <div class="rong-entry-main">
                <div class="rong-entry-main-hd">
                    <h1>{{locale.title}}</h1>
                </div>
                <form action="" @submit.prevent="submit">
                    <div style="width: 0; height: 0; overflow: hidden;">
                        <input type="text" name="disable-chrome-auto-fill"/>
                        <input type="password" name="disable-chrome-auto-fill"/>
                    </div>
                    <ul class="rong-entry-main-bd">
                        <li>
                            <input v-model="nickname" name="nickname" class="rong-field"
                                data-rule-required="true" :data-message-required="locale.nickNameTip"
                                autocomplete="off" maxlength="20"
                                type="text" :placeholder="locale.user.nickName" autofocus>
                            <div v-if="errors.nickname" class="rong-form-error">{{errors.nickname}}</div>
                        </li>
                        <li>
                            <input v-model="phone" name="phone" class="rong-field"
                                autocomplete="off"
                                data-rule-required="true" :data-message-required="locale.mobileEmptyTip"
                                data-rule-mobile="true" :data-message-mobile="locale.mobileErrTip"
                                type="text" :placeholder="locale.user.signTel">
                            <div v-if="errors.phone" class="rong-form-error">{{errors.phone}}</div>
                        </li>
                        <li v-if="enabledSms" class="rong-clearfix" style="margin-top: 20px">
                            <div class="rong-captcha">
                                <input v-model="captcha" name="captcha" class="rong-field"
                                    data-rule-required="true" :data-message-required="locale.captchaTip"
                                    autocomplete="off" type="text" :placeholder="locale.captcha">
                                <div v-if="errors.captcha" class="rong-form-error">{{errors.captcha}}</div>
                            </div>
                            <div class="rong-captcha-button">
                                <button class="rong-button" :disabled="captchaButtonBusy" type="button" @click="sendCaptcha">{{captchaButtonText}}</button>
                            </div>
                        </li>
                        <li>
                            <input name="password" v-model="password" type="password" class="rong-field" maxlength="16"
                                data-rule-password="" :data-message-password="locale.pwdLenTip"
                                data-rule-required="true" :data-message-required="locale.pwdTip"
                                data-rule-rangelength="6,16" :data-message-rangelength="locale.pwdLenTip" data-rule-specialsymbol=" " :data-message-specialsymbol="locale.pwdHasSpace"
                                :placeholder="locale.user.password">
                            <div v-if="errors.password" class="rong-form-error">{{errors.password}}</div>
                        </li>
                        <li>
                            <button type="submit" class="rong-button" :disabled="busy || invalid">{{locale.btns.reg}}<span v-if="busy">...</span></button>
                        </li>
                    </ul>
                </form>
                <div class="rong-entry-main-ft">
                    <a href="#/login">{{locale.btns.login}}</a>
                </div>
            </div>
        </div>
    </div>
</template>
<script src='./signup.js'></script>
