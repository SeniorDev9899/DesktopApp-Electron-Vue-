<template>
    <div class="rong-avatar-edit">
        <ul class="rong-avatar-edit-aside">
            <li><span><a>{{locale.btns.selectFile}}<input v-if="showField" type="file" @change="exchangeNewAvatar($event)" accept="image/gif,image/jpeg,image/jpg,image/png" :title="locale.selectPic"></a></span></li>
            <!-- <li><span>本地上传</span></li> -->
            <!-- <li><a href="#camera">摄像头</a></li> -->
        </ul>
        <div class="rong-avatar-edit-main">
            <div class="rong-avatar-edit-tab-item">
                <div class="rong-avatar-edit-bd">
                    <img ref="img" v-if="src" :src="src" crossOrigin="anonymous" alt="" @load="loadedImg($event)" @error="loadError()" @mousedown="dragImg($event)"
                        :style="{'transform': 'translateX(-50%) translateY(-50%) scale(' + scale + ')' + 'rotate(' + rotate + 'deg)'}">
                    <avatar v-else :user="user" class="rong-avatar-edit-default"></avatar>
                <!--   <a class="rong-avatar-edit-uploader" href="">
                        本地上传
                        <input type="file" @change="exchangeNewAvatar($event)" accept="image/gif,image/jpeg,image/jpg,image/png" title="请选择图片">
                    </a> -->
                </div>
                <div v-if="src" class="rong-avatar-zoom">
                    <div class="rong-avatar-zoom-inner">
                        <button type="button" class="rong-avatar-zoomout" :title="locale.btns.zoomOut" @click="zoomOut">-</button>
                        <div class="rong-avatar-track">
                            <div class="rong-avatar-track-bd">
                                <button type="button" class="rong-avatar-thumb" @mousedown="dragTrackButton($event)" :style="{left: percent + '%'}"></button>
                            </div>
                        </div>
                        <button type="button" class="rong-avatar-zoomin" :title="locale.btns.zoomIn"  @click="zoomIn">+</button>
                    </div>
                </div>
            </div>
            <div class="rong-avatar-buttons">
                <button type="button" class="rong-button" @click="close">{{locale.btns.cancel}}</button>
                <button type="button" class="rong-button rong-submit" @click.stop="saveNewAvatar">{{locale.btns.save}}</button>
            </div>
        </div>
    </div>
</template>
<script src='./edit-avatar.js'></script>
