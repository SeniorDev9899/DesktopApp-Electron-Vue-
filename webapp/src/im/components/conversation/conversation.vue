<template>
<div v-if="isConversationView" class="rong-component" :class="{'conversation-view-group': isGroup}">
    <statusView :code="status"></statusView>

    <div class="rong-conversation-hd rong-dragable"
        @drop = "dropItem()"
    >
        <div class="rong-profile">
            <avatar v-if="conversation.user" :user="conversation.user" class="rong-profile-aside rong-avatar-small" :online-status="userStatus" @clickavatar="userProfile(conversation.user)"></avatar>
            <avatar v-else-if="conversation.group" :group="conversation.group" class="rong-profile-aside rong-avatar-group rong-avatar-small"></avatar>

            <div class="rong-profile-main">
                <div class="rong-profile-name rong-conversation-profile-name">
                    <span v-if="isPublicMsg" class="rong-public-name" v-html="getHtmlUsername(conversation.user, 18)"></span>
                    <a v-if="conversation.user && !isPublicMsg" :disabled="!validUser || sysUser" href="#user" @click.prevent="userProfile(conversation.user)" v-html="getHtmlUsername(conversation.user, 18)"></a>
                    <template v-else-if="conversation.group">
                        <span class="rong-disable-select" v-html="getHtmlGroupName(conversation.group)"></span>
                        <span class="rong-tag">{{getGroupType(conversation.group.type)}}</span>
                    </template>
                </div>
                <div v-if="conversation.user && !sysUser && !isFileHelper && !isPublicMsg" class="rong-profile-status">{{getStatusText()}}</div>
                <div v-else-if="conversation.group" class="rong-profile-count rong-disable-select">{{memberCount(conversation.group)}}
                    <span v-if="getGroupCompany(conversation.group.organization)">({{getGroupCompany(conversation.group.organization)}})</span>
                </div>
            </div>
        </div>

        <div class="rong-tools" :class="['rong-selected-' + panel]">
            <button v-if="isGroup" @click.prevent.stop="panel = 'group-notice'"
                class="rong-tools-group-notice rong-group-image rong-tools-notice" :disabled="!validGroup" :title="locale.groupNotice"></button>

            <a v-if="!isPublicMsg" href="#conversation_history" @click.prevent.stop="panel = 'history' " class="rong-tools-history" :title="locale.history"></a>
            <button v-if="isPrivate" @click.prevent.stop="panel = 'conversation-setting' "
                class="rong-tools-conversation" href="#conversation_setting" :disabled="!validUser || sysUser" :title="locale.setting"></button>

            <button v-if="isGroup" @click.prevent.stop="panel = 'group-setting'"
                class="rong-tools-group tong-tools-setting" :disabled="!validGroup" :title="locale.groupSetting"></button>

            <button v-if="isPublicMsg" @click.prevent.stop="panel = 'public-detail'" class="rong-tools-conversation" :title="locale.setting"></button>
        </div>
    </div>

    <div class="rong-conversation" :class="{'rong-conversation-menu': menuEnabled, 'rong-conversation-public-menu-none': (!menuEnabled && !inputEnabled) || isOtherApp}" :style="style">
        <div v-if="busy" class="rong-loading"><span>{{locale.tips.loading}}</span></div>
        <message-list
           v-else
           ref="list"
           :status="status"
           :conversation="conversation"
           :append-message="newMessage"
           :isBanned="isBanned"
           :inGroup="inGroup"
           :isMultiSelected="isMultiSelected"
           :conversation_type="conversation.conversationType"
           @setInGroup="setInGroup"
           @quote="addQuote"
           @setMultiSelect="setMultiSelect"
           @selectedMessages="setselectedMessages"
        ></message-list>
    </div>
    <div v-if="quote" class="rong-quote-panel" :style="{'bottom': inputHeight + 'px'}">
        <a class="rong-panel-close" href="#close" @click.prevent="removeQuote">关闭</a>
        <div class="rong-quote-container">
            <span class="rong-quote-username">
                <template v-if="isGroup">{{getGroupUsername(quote.user)}}</template>
                <template v-else>{{getUsername(quote.user)}}</template>
            </span>
            <div class="rong-quote-content" v-if="quote.objName == 'RC:TxtMsg'" v-html="getTextContent(quote.content.content)"></div>
            <div class="rong-quote-content" v-else-if="quote.objName == 'RC:ImgMsg'">
                <img :src=" 'data:image/png;base64,' + quote.content.content">
            </div>
            <div class="rong-quote-content" v-else-if="quote.objName == 'RC:GIFMsg'">
                <img :src=" 'data:image/gif;base64,' + quote.content.content">
            </div>
            <div class="rong-quote-content" v-else-if="quote.objName == 'RC:ImgTextMsg'">[{{locale.components.quoteMessage.link}}] {{quote.content.title}}</div>
            <div class="rong-quote-content" v-else-if="quote.objName == 'RC:FileMsg'">[{{locale.components.quoteMessage.file}}] {{quote.content.name}}</div>
        </div>
    </div>
    <public-menu v-show="menuEnabled" :menuInfo="menuInfo" @inputMenuChanged="inputMenuChanged"></public-menu>
    <message-input v-show="inputEnabled && !isOtherApp" ref="editor"
        :targetId="targetId" :autoFocus="autoFocus" :inGroup="inGroup" :disabled="disabledMessageInput" :isBanned="isBanned" :isInvalidGroup="isInvalidGroup && isGroup" :isRobot="isFileHelper" :atMembers="members" :isMultiSelected="isMultiSelected" :selectedMessages="selectedMessages" :conversation="conversation"
        @removeQuote="removeQuote"
        @sendAudio="sendVoip(false)"
        @sendVideo="sendVoip(true)"
        @sendMessage="sendTextMessage"
        @sendCopyMessage="sendCopyMessage"
        @append="append"
        @prepareinput="prepareinput"
        @setInGroup="setInGroup"
        @setMultiSelect="setMultiSelect"
        @inputMenuChanged="inputMenuChanged"></message-input>
    <transition name="rong-setting-slide">
        <component :is="panel" @hidepanel="hidePanel" @set-property="setProperty" :conversation="conversation" :user="conversation.user" :group="conversation.group" :members="members"></component>
    </transition>
</div>
</template>
<script src='./conversation.js'></script>
