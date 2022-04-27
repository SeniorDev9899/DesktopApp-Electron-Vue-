<template>
    <div class="rong-conversation-one-message rong-approval">
        <ul @click="openUrl">
            <li class="rong-approval-title">{{locale.title}}</li>
            <li class="rong-approval-content">{{content.content}}</li>
            <li class="rong-approval-time">
                {{locale.startTime}}：{{dateFormat(content.startTime, 'YY/M/D HH:mm')}} <br/>
                {{locale.endTime}}：{{dateFormat(content.endTime, 'YY/M/D HH:mm')}}
            </li>
            <li :class="['rong-approval-' + getStatus(content.status)]">{{statusText}}</li>
            <!-- <li class="rong-approval-remind">请及时审批</li> -->
        </ul>
        <!-- 已同意 已拒绝 审批中 审批通过 -->
    </div>
</template>
<script src='./approval.js'></script>
