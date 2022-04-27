<template>
    <ul class="rong-system">
        <li v-if="!isMac">
            <label class="rong-system-text">{{locale.sysMsgNotify}}</label>
            <label class="rong-switch">
                <input type="checkbox" v-model="playSound">
                <i></i>
            </label>
        </li>
        <li v-if="isPC">
            <label class="rong-system-text">{{autoStartText}}</label>
            <label class="rong-switch">
                <input type="checkbox" v-model="autoStart">
                <i></i>
            </label>
        </li>
        <li v-if="!isWindows">
            <label class="rong-system-text">{{locale.previewText}}</label>
            <label class="rong-switch">
                <input type="checkbox" v-model="showPreview">
                <i></i>
            </label>
        </li>
        <li v-if="companies.length > 1">
            <label class="rong-system-text">{{locale.majorCompany}}</label>
            <custom-select class="rong-select-majorcompany" v-model="selectedCompanyId"
                :list="companies"
                nameKey="name"
                valueKey="id">
            </custom-select>
        </li>
        <li v-if="isLinux">
            <label class="rong-system-text">{{locale.permanentNot}}</label>
            <label class="rong-switch">
                <input type="checkbox" v-model="permanentNot">
                <i></i>
            </label>
        </li>
        <li>
            <label class="rong-system-text">{{locale.language}}</label>
            <custom-select class="rong-select-language" v-model="language"
                :list="supportLocales"
                nameKey="name"
                valueKey="value">
            </custom-select>
        </li>
        <!--
        <li>
            <label class="rong-system-text">发送消息快捷键</label>
            <ul class="rong-setting-shortcut">
                <li>
                    <label>
                        <input name="shortcut" type="radio" value="0" v-model="shortCut">
                        <span>Enter 发送 , Ctrl+Enter 换行</span>
                    </label>
                </li>
                <li>
                    <label>
                        <input name="shortcut" type="radio" value="1" v-model="shortCut">
                        <span>Enter 换行 , Ctrl+Enter 发送</span>
                    </label>
                </li>
            </ul>
        </li>
        -->
        <li class="rong-setting-shortcut" v-if="!isLinux">
            <div class="rong-shortcut-title">{{locale.shortcuts}}</div>
            <div class="rong-shortcut-content">
                <ul class="rong-shortcut-list">
                    <li v-if="isPC && isWindows || isPC && isLinux">
                        {{locale.searchShortcut}}
                        <span>Ctrl + F</span>
                    </li>
                    <li v-if="isPC && isMac">
                        {{locale.searchShortcut}}
                        <span>Command + F</span>
                    </li>
                    <li v-if="isPC && isWindows || isPC && isLinux">
                        {{locale.screenshotShortcut}}
                        <span>Ctrl + Alt + S</span>
                    </li>
                    <li v-if="isPC && isMac">
                        {{locale.screenshotShortcut}}
                        <span>Command + control + S</span>
                    </li>
                    <li v-if="isWindows || isWindowsWeb || isLinux">
                        {{locale.sendMessageShortcut}}
                        <span>{{locale.sendShortcutWin}}</span>
                    </li>
                    <li v-if="isMac || isMacWeb">
                        {{locale.sendMessageShortcut}}
                        <span>{{locale.sendShortcutMac}}</span>
                    </li>
                </ul>
            </div>
        </li>
    </ul>
</template>
<script src='./system.js'></script>
