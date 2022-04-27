<template>
<div class="rong-conversation-setting rong-group-setting" :class="{'rong-group-has-quit': showQuit, 'rong-group-not-scroll': isNotSupportScroll}" @click.stop="">
    <div class="rong-conversation-setting-hd">
        <h2 class="rong-conversation-setting-title">{{locale.title}}</h2>
    </div>
    <div class="rong-conversation-setting-bd rong-conversation-group-setting-bd" v-if="group" ref="list" v-rong-scroll-to-bottom="loadMore">
        <div class="rong-conversation-setting-scroll">
            <ul class="rong-group-info">
                <li>
                    <label>{{locale.groupName}}</label>
                    <input v-if="nameEditable" type="text" class="rong-field" v-model.trim="groupNameField" maxlength="16" v-focus @keyup.enter="saveName" @keyup.esc="removeEditable" @blur="saveName">
                    <template v-else>
                        <em>{{getGroupName()}}</em>
                        <a href="" class="rong-group-edit" :title="locale.btns.edit" @click.prevent="setEditable" v-show="showEdit"></a>
                    </template>
                </li>
                <li>
                    <label>{{locale.admin}}</label>
                    <a class="rong-group-username" href="" v-if="group" @click.prevent="userProfile(group.admin_id)">{{group.creator_name}}</a>
                     <a href="" class="rong-group-edit rong-group-image rong-group-transfer" :title="locale.btns.transfer" @click.prevent="transfer" v-show="showEdit"></a>
                </li>
                <li v-if="showQRCode">
                    <label class="rong-qrcode">{{locale.qrcode}}</label>
                    <a href="" class="rong-group-qrcode-image" @click.prevent="openQRCode"></a>
                    <a href="" class="rong-group-edit rong-group-image rong-group-to-qrcode" :title="locale.qrcode" @click.prevent="openQRCode"></a>
                </li>
            </ul>

            <ul class="rong-conversation-switch">
                <li class="rong-clearfix">
                    <label class="rong-item-label">{{locale.mute}}</label>
                    <label class="rong-switch"><input type="checkbox" v-model="isMute"><i></i></label>
                </li>
                <li class="rong-clearfix">
                    <label class="rong-item-label">{{locale.top}}</label>
                    <label class="rong-switch"><input type="checkbox" v-model="isTop"><i></i></label>
                </li>
                <li v-if="showSave" class="rong-clearfix">
                    <label class="rong-item-label">{{locale.saveContact}}</label>
                    <label class="rong-switch"><input type="checkbox" v-model="isSaved"><i></i></label>
                </li>
                <li v-if="isCustomGroup && group.is_creator" class="rong-clearfix">
                    <label class="rong-item-label">{{locale.onlyOwnerManage}}</label>
                    <label class="rong-switch"><input type="checkbox" v-model="isOwnerManage"><i></i></label>
                    <label class="rong-group-button-memo">{{locale.onlyOwnerManageMemo}}</label>
                </li>
                <li v-if="isManager" class="rong-clearfix">
                    <label class="rong-item-label">{{locale.joinPermit}}</label>
                    <label class="rong-switch"><input type="checkbox" v-model="isAprrove"><i></i></label>
                    <label class="rong-group-button-memo">{{locale.joinPermitMemo}}</label>
                </li>
                <li class="rong-clearfix">
                    <label class="rong-item-label">{{locale.groupAlias}}</label>
                    <div class="rong-group-nickname-box">
                        <input v-if="aliasEditable"  type="text" class="rong-field rong-group-nickname-field" v-model.trim="aliasField" maxlength="10" v-focus @keyup.enter="modifyMemberAlias()" @keyup.esc="setAliasEditable(false)" @blur="modifyMemberAlias()">
                        <label v-else class="rong-group-nickname-show">
                            <em v-if="alias" :title="alias">{{alias}}</em>
                            <em v-else>{{locale.unSetting}}</em>
                            <a href="" class="rong-group-edit" :title="locale.btns.edit" @click.prevent="setAliasEditable(true)"></a>
                        </label>
                    </div>
                    <label class="rong-group-button-memo">{{locale.groupAliasSetting}}</label>
                </li>
                <li v-if="isManager" class="rong-clearfix">
                    <label class="rong-item-label">{{locale.banned}}</label>
                    <button class="rong-group-ban-button" @click="banned">{{locale.setting}}</button>
                    <label class="rong-group-button-memo">{{locale.bannedMemo}}</label>
                </li>
            </ul>

            <div class="rong-group-hd">
                <div class="rong-group-title">
                    <em>{{locale.member}}</em>
                    <span>({{group.member_count}})</span>
                </div>
                <div class="rong-group-search" :class="{'rong-search-selected': isSearch}">
                    <button class="rong-group-search-button rong-group-search-hd" @click="setIsSearch"><i></i>{{locale.btns.search}}</button>
                    <a class="rong-group-search-cancel" href="#cancel" @click.prevent="clearSearch">{{locale.btns.cancel}}</a>
                    <div class="rong-group-search-bd" @transitionend="searchFocus">
                        <div class="rong-group-search-field">
                            <input type="text" class="rong-field" ref="searchName" v-model.trim="searchName" @keyup.esc="clearSearch">
                            <button class="rong-group-search-clear" type="button" :title="locale.btns.clear" @click="searchName=''"></button>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="filterMembers && filterMembers.length > 0" class="rong-members">
                <ul class="rong-clearfix">
                    <li v-if="showAdd">
                       <a href="" class="rong-conversation-add" :title="locale.btns.add" @click.prevent="addMember"></a>
                    </li>
                    <li v-if="showRemove">
                       <a href="" class="rong-conversation-remove" :title="locale.btns.remove" @click.prevent="removeMembers"></a>
                    </li>
                    <li v-for="user in filterMembers" :key="user.id" :id="user.id">
                        <a href="" @click.prevent="userProfile(user.id)">
                            <avatar :user="user" class="rong-avatar-small"></avatar>
                            <div class="rong-members-username" :title="user.alias">
                                <em class="rong-group-member-icon" v-if="checkManage(user)"></em>
                                <em v-html="user.htmlAlias"></em>
                            </div>
                        </a>
                    </li>
                </ul>
            </div>
            <div v-else-if="searchName" class="rong-empty" v-html="localeFormat(locale.tips.searchEmpty, '<em>&quot;' + searchName + '&quot;</em>')"></div>
        </div>
    </div>
    <div class="rong-group-setting-buttons">
        <button v-if="showQuit" class="rong-button rong-group-quit" type="button" @click="delAndQuit">{{locale.btns.removeQuit}}</button><button v-if="showEdit" class="rong-button rong-group-dismiss" type="button" @click="dismissGroup">{{locale.dismiss}}</button>
    </div>
</div>
</template>
<script src='./group-setting.js'></script>
