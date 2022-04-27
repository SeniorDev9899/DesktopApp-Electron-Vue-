<template>
    <div class="rong-setting-form">
        <form action="" @submit.prevent="submit">
            <ul>
                <li>
                    <label>{{locale.oldPwd}}</label>
                    <input name="oldPassword" v-model="oldPassword" type="password" class="rong-field"
                        data-rule-required="true" :data-message-required="locale.tipOldPwd">
                    <div v-if="errors.oldPassword" class="rong-form-error">{{errors.oldPassword}}</div>
                </li>
                <li>
                    <label>{{locale.newPwd}}</label>
                    <!-- <input name="newPassword" v-model="newPassword" type="password" class="rong-field" maxlength="16"
                        :placeholder="locale.tips.pwdTip"
                        data-rule-password="" :data-message-password="locale.tipPwd"
                        data-rule-required="true" :data-message-required="locale.tipNewPwd"
                        data-rule-rangelength="6,16" :data-message-rangelength="locale.tipPwd"> -->
                    <input
                        name="newPassword"
                        v-model="newPassword"
                        type="password"
                        class="rong-field"
                        data-rule-password=""
                        :data-message-password="locale.tipPassword"
                        data-rule-required="true"
                        :data-message-required="locale.tipNewPwd"
                        :maxlength="maxlength"
                    >
                    <div v-if="errors.newPassword" class="rong-form-error">{{errors.newPassword}}</div>
                </li>
                <li>
                    <label>{{locale.confirmPwd}}</label>
                    <input name="confirmPassword" v-model="confirmPassword" type="password" class="rong-field" :maxlength="maxlength"
                        data-rule-required="true" :data-message-required="locale.tipConfirmPwd"
                        data-rule-equalto="[name=newPassword]" :data-message-equalto="locale.tipMatchPwd">
                    <div v-if="errors.confirmPassword" class="rong-form-error">{{errors.confirmPassword}}</div>
                </li>
                <li class="rong-setting-submit">
                    <button class="rong-button rong-submit" type="submit" :disabled="busy || disabled">{{locale.btns.confirm}}</button>
                </li>
            </ul>
        </form>
    </div>
</template>
<script src='./password.js'></script>
