<template>
    <div class="rong-pin-detail">
        <div class="rong-main-hd">
            <h2 class="rong-main-title">
                {{ locale.components.pinDetail.title }}
            </h2>
        </div>
        <div class="rong-pin-detail-bd" v-rong-scroll-bar-y>
            <div
                class="rong-pin-content"
                :class="{ 'rong-pin-content-confirm': isShowConfirmBtn }"
            >
                <div class="rong-pin-item-hd">
                    <avatar
                        @clickavatar="userProfile(pinDetail.creator_uid)"
                        :user="user"
                        class="rong-avatar-small"
                    ></avatar>
                    <div class="rong-pin-item-username">
                        <a :title="getUsername(user)">{{
                            getUsername(user)
                        }}</a>
                    </div>
                    <div class="rong-pin-item-time-box">
                        <i
                            v-if="isShowDelayedIcon()"
                            class="rong-pin-item-delayed"
                        ></i>
                        <span class="rong-pin-item-datetime">{{
                            pinDate()
                        }}</span>
                        <!-- <i v-if="pinDetail.attachment_count" class="rong-pin-attachment"></i> -->
                    </div>
                </div>

                <p
                    :class="{
                        'rong-pin-item-hasatta': pinDetail.attachment_count
                    }"
                    class="rong-pin-item-bd"
                    v-html="getPinContent(pinDetail.content)"
                    id="pin-content"
                ></p>
                <div
                    v-if="pinDetail.attachment_count"
                    class="rong-pin-attach-list"
                >
                    <div
                        v-for="(attach, index) in attachmentList"
                        :key="index"
                        class="rong-pin-attach-box"
                    >
                        <div class="rong-pin-file-box">
                            <i
                                class="rong-pin-file"
                                :class="getFileIconClass(attach.name)"
                            ></i>
                        </div>
                        <div class="rong-pin-attach-doc">
                            <p :title="attach.name" class="rong-pin-doc-title">
                                {{ attach.name }}
                            </p>
                            <p class="rong-pin-doc-size">
                                {{ formatFileSize(attach.size) }}
                            </p>
                        </div>
                        <a
                            v-if="
                                !attach.isDownloading &&
                                    attach.downloadProgress === 0
                            "
                            :href="attach.url"
                            :title="attach.name"
                            @click.prevent="download(attach.url)"
                        ></a>

                        <!--38858 - 【文件】下载PIN中的文件暂停每次都需要重新进行下载
                            [期望]应该可以暂停下载保留当前下载进度，再次点击下载时可以继续进行下载
                         -->
                        <a
                            class="rong-pin-download-resume"
                            v-if="attach.isCanceled"
                            @click.prevent="download(attach.url, true, attach)"
                            href=""
                        ></a>

                        <a
                            class="rong-pin-un-download"
                            v-if="attach.isDownloading"
                            @click.prevent="cancelDownload(attach.url, attach)"
                            href=""
                        ></a>

                        <a
                            class="rong-pin-download-ready"
                            v-if="
                                !attach.isDownloading &&
                                    attach.downloadProgress === 100
                            "
                            href=""
                            @click.prevent="openFolder(attach)"
                        ></a>

                        <span
                            v-if="attach.isCanceled"
                            class="rong-pin-attach-progress-bk"
                        ></span>
                        <span
                            v-if="attach.isCanceled"
                            class="rong-pin-attach-progress"
                            :style="{ width: attach.downloadProgress + '%' }"
                        ></span>

                        <span
                            v-if="attach.isDownloading"
                            class="rong-pin-attach-progress-bk"
                        ></span>
                        <span
                            v-if="attach.isDownloading"
                            class="rong-pin-attach-progress"
                            :style="{ width: attach.downloadProgress + '%' }"
                        ></span>
                    </div>
                </div>

                <div
                    class="rong-pin-users"
                    :class="{ 'rong-pin-expand': confirmExpand }"
                >
                    <div class="rong-pin-users-hd rong-clearfix">
                        <a
                            :class="
                                'rong-pin-detail-' + locale.name.toLowerCase()
                            "
                            href=""
                            @click.prevent="clickShowConfirmDetail"
                            >{{ locale.components.pinDetail.confirmDetail }}</a
                        >
                        <span>{{ getConfirmDetail() }}</span>
                    </div>
                    <div v-show="confirmExpand" class="rong-pin-users-bd">
                        <div class="rong-pin-user">
                            <h3>
                                {{
                                    localeFormat(
                                        locale.components.pinDetail.unConfirmed,
                                        getUnConfirmReceivers.length
                                    )
                                }}
                            </h3>
                            <div class="rong-members">
                                <ul class="rong-clearfix">
                                    <li
                                        v-for="(receiver,
                                        index) in getUnConfirmReceivers"
                                        :key="index"
                                    >
                                        <a>
                                            <avatar
                                                @clickavatar="
                                                    userProfile(
                                                        receiver.receiver_uid
                                                    )
                                                "
                                                :user="receiver.user"
                                                class="rong-avatar-small"
                                            ></avatar>
                                            <div
                                                class="rong-members-username"
                                                :title="
                                                    getUsername(receiver.user)
                                                "
                                            >
                                                {{ getUsername(receiver.user) }}
                                            </div>
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <div class="rong-pin-user">
                            <h3>
                                {{
                                    localeFormat(
                                        locale.components.pinDetail.confirmed,
                                        getConfirmReceivers.length
                                    )
                                }}
                            </h3>
                            <div class="rong-members">
                                <ul class="rong-clearfix">
                                    <li
                                        v-for="(receiver,
                                        index) in getConfirmReceivers"
                                        :key="index"
                                    >
                                        <a>
                                            <avatar
                                                @clickavatar="
                                                    userProfile(
                                                        receiver.receiver_uid
                                                    )
                                                "
                                                :user="receiver.user"
                                                class="rong-avatar-small"
                                            ></avatar>
                                            <div
                                                class="rong-members-username"
                                                :title="
                                                    getUsername(receiver.user)
                                                "
                                            >
                                                {{ getUsername(receiver.user) }}
                                            </div>
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div
                        class="rong-pin-detail-received rong-clearfix"
                        v-if="isSender"
                    >
                        <a
                            :class="[
                                receivedExpand
                                    ? 'rong-pin-received-expand'
                                    : '',
                                'rong-pin-receiver-' + locale.name.toLowerCase()
                            ]"
                            href=""
                            @click.prevent="clickShowReceiveDetail"
                            >{{ locale.components.pinDetail.receiver }}</a
                        >
                    </div>
                    <div v-show="receivedExpand" class="rong-pin-users-bd">
                        <div class="rong-members">
                            <ul class="rong-clearfix">
                                <li>
                                    <div class="rong-avatar rong-avatar-small">
                                        <button
                                            @click.prevent="addReceivers"
                                            class="rong-pin-reveived-add"
                                            type="button"
                                            title="增加接收人"
                                        >
                                            +
                                        </button>
                                    </div>
                                </li>
                                <li
                                    v-for="(receiver, index) in getReceiverList"
                                    :key="index"
                                >
                                    <a>
                                        <avatar
                                            @clickavatar="
                                                userProfile(
                                                    receiver.receiver_uid
                                                )
                                            "
                                            :user="receiver.user"
                                            class="rong-avatar-small"
                                        ></avatar>
                                        <div
                                            class="rong-members-username"
                                            :title="getUsername(receiver.user)"
                                        >
                                            {{ getUsername(receiver.user) }}
                                        </div>
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div
                    class="rong-pin-reply"
                    :class="{ 'rong-pin-reply-bottom': isShowCommentTopLine }"
                >
                    <div
                        class="rong-pin-reply-bd"
                        v-for="(comment, index) in getCommentList"
                        :key="index"
                    >
                        <avatar
                            @clickavatar="userProfile(comment.publisher_uid)"
                            :user="comment.user || {}"
                            class="rong-avatar-small"
                        ></avatar>
                        <div class="rong-pin-reply-text">
                            <div class="rong-pin-item-username">
                                {{ getUserName(comment.user) }}
                            </div>
                            <span class="rong-pin-item-datetime">{{
                                dateFormat(comment.create_dt)
                            }}</span>
                            <p
                                v-html="getPinContent(comment.content) || ' '"
                            ></p>
                        </div>
                    </div>
                </div>

                <button
                    @click.prevent="pinConfirm()"
                    class="rong-pin-confirm-btn"
                    v-if="isShowConfirmBtn"
                >
                    {{ locale.btns.confirmReply }}
                </button>
            </div>

            <div v-if="isShowInput" class="rong-pin-reply-form">
                <form action="">
                    <div class="rong-pin-reply-box">
                        <textarea
                            id="replyInput"
                            v-model.trim="entryComment"
                            class="rong-field"
                            cols="20"
                            rows="1"
                            :placeholder="locale.components.pinDetail.input"
                            @keyup.enter="enterComment($event)"
                        ></textarea>
                    </div>
                    <button
                        @click.prevent="sendComment"
                        :disabled="disableSend"
                        class="rong-button rong-submit"
                        type="submit"
                    >
                        {{ locale.btns.send }}
                    </button>
                </form>
            </div>
        </div>
    </div>
</template>
<script src="./pin-detail.js"></script>
