<template>
    <div class="rong-component">
        <div class="rong-main-hd rong-dragable">
            <h2 class="rong-main-title">{{locale.components.sendPin.title}}</h2>
        </div>
        <status :code="status()"></status>
        <div v-if="isLoading && pinList.length === 0 && isConnected" class="rong-loading rong-pin-loading"><span>{{locale.tips.loading}}</span></div>
        <div v-else-if="!showEmptyPage" class="rong-pin-list">
            <ul class="rong-main-content clearfix" @scroll="scroll" v-rong-scroll-bar-y>
                <li v-for="(pin, index) in pinList" :key="index" class="rong-pin-item" @click.prevent="showDetail(pin)" @contextmenu.prevent="showContextmenu($event, {pin: pin});isClicking=true;" >
                    <div class="rong-pin-item-hd">
                        <avatar :user="pin.user" @clickavatar="userProfile(pin.creator_uid)" class="rong-avatar-small"></avatar>
                        <div class="rong-pin-item-username">
                            <a @click.prevent="userProfile(pin.creator_uid)" :title="getUsername(pin.user)" href="">{{ getUsername(pin.user) }}</a>
                        </div>
                        <div class="rong-pin-item-time-box">
                            <i v-if="isShowDelayedIcon(pin)" class="rong-pin-item-delayed"></i>
                            <span class="rong-pin-item-datetime">{{dateFormat(pin)}}</span><i v-if="pin.attachment_count" class="rong-pin-attachment">
                                ({{pin.attachment_count}})
                            </i>
                        </div>
                    </div>
                    <p class="rong-pin-item-bd" v-html="getPinContent(pin)"></p>
                    <div class="rong-pin-item-ft">
                        <span v-if="pin.un_confirm_count" class="rong-pin-item-read">{{getUnConfirmStr(pin)}}</span><span v-else class="rong-pin-item-read">{{locale.components.pinDetail.allConfirmed}}</span>
                        <a v-if="!isShowDelayedIcon(pin)" class="rong-pin-reply-count-box" href="" @click="replyPin(pin)">
                            <em v-if="hasUnReadComment(pin)" class="rong-pin-reply-mark"></em>
                            {{getReplyStr(pin)}}
                        </a>
                    </div>
                </li>
            </ul>
        </div>
        <div v-else class="rong-empty-pin">
            <div class="rong-empty-pin-hd rong-dragable"></div>
            <div class="rong-empty-pin-bd"><p>{{locale.emptyMessage.pin}}</p></div>
        </div>

        <div v-if="selectedPin" class="rong-pin-detail-shadow"></div>
        <transition name="rong-setting-slide" v-on:after-enter="afterEnter" v-on:enter-cancelled="enterCancelled">

            <pinDetail v-if="selectedPin" v-on:receiveComment="selectedPin.un_read_comment_count=0" v-on:hidepanel="selectedPin=null" :isSender=true :pinDetail="selectedPin" :isReply="selectedPin.isReply"></pinDetail>

        </transition>

        <contextmenu v-if="context"
            @close="closeContextmenu();isClicking=false;"
            :context="context"></contextmenu>
    </div>
</template>
<script src='./sent.js'></script>
