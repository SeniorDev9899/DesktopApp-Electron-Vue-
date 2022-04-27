<template>
    <div class="rong-contact-main rong-approve-list">
        <div class="rong-contact-hd rong-dragable">
            <h2 class="rong-contact-title">{{locale.title}}</h2>
            <span class="rong-contact-approve-clear" :class="{ 'rong-approve-unclear' : !hasApprove }" @click="showClearMenu()"></span>
        </div>
        <div v-if="approveList.length !== 0 && isLoadDone" class="rong-contact-content" v-rong-scroll-bar-y>
            <ul class="rong-contact-list">
                <li class="rong-profile rong-approve-profile" v-for="(data, index) in approveList" :key="index"
                    @contextmenu.prevent="showContextmenu($event, { approve: data })">
                    <avatar class="rong-avatar-middle rong-profile-aside" @clickavatar="userProfile(data.receiver_id)" :user="data.user"></avatar>
                    <div class="rong-profile-main">
                        <div><span>{{data.receiver_name}}</span> {{locale.components.approve.applyto}}<span>{{data.name}}</span></div>
                        <div class="rong-approve-requester"><span>{{locale.components.approve.inviter}} : </span><span>{{data.inviter_name}}</span></div>
                        <div class="rong-approve-status">
                            <button class="rong-approve-status-btn" v-if="data.receiver_status === 0" @click.prevent="approve(data)">{{getApproveStatus(data)}}</button>
                            <span class="rong-approve-status-title" v-else>{{getApproveStatus(data)}}</span>
                        </div>
                    </div>
                </li>
            </ul>
        </div>
        <div v-else-if="isLoadDone" class="rong-empty-contact">
            <div class="rong-empty-contact-hd rong-dragable"></div>
            <div class="rong-empty-contact-bd rong-empty-approve-bd"><p>{{locale.emptyMessage.approve}}</p></div>
        </div>

        <contextmenu v-if="context"
            @close="closeContextmenu();"
            :context="context"></contextmenu>
    </div>
</template>
<script src='./approve.js'></script>
