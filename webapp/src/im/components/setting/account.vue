<template>
    <ul class="rong-account">
        <template v-if="account">
            <li>
                <avatar :user="account" class="rong-avatar-large"></avatar>
            </li>
            <li>
                <!-- 非外部联系人 不可修改姓名 外部联系人 可修改姓名-->
                <div class="rong-user-name-edit-range">
                    <div class="rong-user-name-label" v-if="!usernameEditable" style="display: inline-block">
                        <label :title="account.name">{{username}}</label>
                    </div>
                    <!--外部联系人-->
                    <div class="rong-user-name-edit-btn" v-if="!isStaff" style="display: inline-block">
                        <input v-if="usernameEditable" type="text" @input="inputUserName" class="rong-field" maxlength="16" v-focus v-model="username" @blur="setUsername"  @keyup.enter="setUsername" @keyup.esc="cancelUsername">
                        <template v-else>
                            <a @click.prevent="setUsernameEditable" class="rong-user-alias-edit" :title="locale.btns.edit"></a>
                        </template>
                    </div>
                </div>
            </li>

            <li v-if="account.mobile">
                <label>{{locale.mobile}}</label><span>{{format(account.mobile)}}</span>
            </li>
        </template>
        <li class="rong-account-logout">
            <button class="rong-button rong-submit" type="button" @click="logout">{{locale.btns.logout}}</button>
        </li>
    </ul>
</template>
<script src='./account.js'></script>
