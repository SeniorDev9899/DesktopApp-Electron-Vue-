<template>
    <div class="rong-entry" :class="{'rong-login-fadein': isFirst}">
        <div class="rong-entry-hd rong-dragable"></div>
        <div class="rong-entry-bd rong-clearfix">
            <div class="rong-entry-aside">
                <div class="rong-product">
                    <span class="rong-product-name" @dblclick="(e) => productNameClcik(e)">{{productName}}</span>
                </div>
            </div>
            <div class="rong-entry-main">
                <div class="rong-entry-main-hd" :class="['rong-entry-selected-' + selected]">
                    <a v-if="enabledQrcodeLogin" class="rong-item-qrcode" href="#qrcode" @click.prevent="selected = 'qrcode' ">{{locale.scanLogin}}</a>
                    <a class="rong-item-password" href="#password" @click.prevent="selected = 'password' ">{{locale.pwdLogin}}</a>
                </div>
                <div v-if="selected === 'qrcode' " class="rong-entry-qrcode">
                    <div class="rong-entry-qrcode-bd">
                        <div class="rong-entry-logo">
                            <div class="rong-entry-logo-bd"></div>
                        </div>
                        <div ref="qrcode"></div>
                        <div v-if="qrcodeTimeout" class="rong-qrcode-invalid">
                            <span @click.prevent="qrcodeRefresh">{{locale.QRCodeExpired}}<br>{{locale.refreshTip}}</span>
                        </div>
                        <div v-else-if="qrcodeAccountLocked" class="rong-qrcode-invalid">
                            <p class="rong-qrcode-locked">{{qrcodeLockedError}}</p>
                        </div>
                    </div>
                    <div class="rong-entry-qrcode-ft">
                        {{locale.scanTip}} <a class="rong-entry-refresh" href="#refresh" @click.prevent="qrcodeRefresh">{{locale.refresh}}</a>
                    </div>
                </div>
                <form v-else-if="selected === 'password' " action="" @submit.prevent="passwordLogin">
                    <div style="width: 0; height: 0; overflow: hidden;">
                        <input type="text" name="disable-chrome-auto-fill"/>
                        <input type="password" name="disable-chrome-auto-fill"/>
                    </div>
                    <ul class="rong-entry-main-bd">
                        <li>
                            <input v-model="phone" name="phone" class="rong-field"
                                type="text" :placeholder="locale.account" v-auto-focus>
                            <div v-if="errors.phone" class="rong-form-error">{{errors.phone}}</div>
                        </li>
                        <li>
                            <input v-model="password" name="password" class="rong-field"
                                data-rule-required="true" :data-message-required="locale.noPwdTip"
                                type="password" :placeholder="locale.inputPwd" v-auto-focus>
                            <div v-if="errors.password" class="rong-form-error rong-form-password-error">{{errors.password}}</div>
                        </li>
                        <li class="rong-clearfix">
                            <label class="rong-login-remeber"><input type="checkbox" name="isRememberMe" v-model="isRememberMe"> {{locale.autoLogin}}</label>
                            <!-- <a class="rong-login-forget" href="#/forget-password">{{locale.forgetPwd}}</a> -->
                            <!-- 服务器地址配置 -->
                            <span
                              class="rong-login-server_conf"
                              @click="() => $router.push('/server-conf')"
                              v-if="useServerConfFlag"
                            >{{ locale.serverAdressConf }}</span>
                        </li>
                        <li>
                            <button type="submit" class="rong-button" :disabled="disabled">{{busy ? locale.btns.logining : locale.btns.login}}</button>
                        </li>
                    </ul>
                    <input type="hidden" v-model="zip">
                </form>
                <div class="rong-entry-main-ft">
                    <a v-if="enabledSignup" href="#/signup">{{locale.newRegisty}}</a>
                    <a v-if="forgetPassword" class="rong-login-forget" href="#/forget-password">{{locale.forgetPwd}}</a>
                </div>
            </div>
        </div>
    </div>
</template>
<script src='./login.js'></script>
