<template>
<div>
    <div class="rong-edit-app-none" v-if="allApps.length == 0">
        <span class="rong-tip">{{locale.noApp}}</span>
    </div>
    <div class="rong-edit-otherapp" v-else>
        <div class="rong-selected-apps">
            <div class="rong-apps-hd">{{locale.frequently}}<span class="sort-btn" @click="sortAppClick">{{locale.sortText}}</span></div>
            <div class="rong-selected-apps-bd">
                <div class="rong-app-info" v-for="item in selectedApps" :key="item.id">
                    <div class="rong-app-icon" :style="{'background-image': 'url(' + item.logo_url + ')'}">
                        <i class="rong-app-remove" @click="remove(item)">×</i>
                    </div>
                    <span class="rong-app-name">{{item.name}}</span>
                </div>
                <div class="rong-app-none" v-if="selectedApps.length === 0">{{locale.noApp}}</div>
            </div>
            <div class="rong-selected-apps-ft">
                <button class="rong-button" @click="save">{{locale.btns.done}}</button>
            </div>
        </div>
        <div class="rong-all-apps">
            <div class="rong-apps-hd">{{locale.selectApp}}</div>
            <div class="rong-all-list">
                <!-- base -->
                <div v-if="baseApps.length">
                    <div class="rong-work-edit-apptitle">{{locale.basicApps}}</div>
                    <ul>
                        <li class="rong-app-info" v-for="item in baseApps" :key="item.id">
                            <div class="rong-app-icon" :style="{'background-image': 'url(' + item.logo_url + ')'}"></div>
                            <div class="rong-app-detail">
                                <div class="rong-app-name">{{item.name}}</div>
                                <div class="rong-app-description">{{item.description}}</div>
                            </div>
                            <button class="rong-button rong-selected-btn" v-if="isSelected(item)">{{locale.btns.added}}</button>
                            <button class="rong-button" v-else @click="add(item)">{{locale.btns.add}}</button>
                        </li>
                    </ul>
                </div>
                <!-- other -->
                <div v-if="otherApps.length">
                    <div class="rong-work-edit-apptitle">{{locale.otherApps}}</div>
                    <ul>
                        <li class="rong-app-info" v-for="item in otherApps" :key="item.id">
                            <div class="rong-app-icon" :style="{'background-image': 'url(' + item.logo_url + ')'}"></div>
                            <div class="rong-app-detail">
                                <div class="rong-app-name">{{item.name}}</div>
                                <div class="rong-app-description">{{item.description}}</div>
                            </div>
                            <button class="rong-button rong-selected-btn" v-if="isSelected(item)">{{locale.btns.added}}</button>
                            <button class="rong-button" v-else @click="add(item)">{{locale.btns.add}}</button>
                        </li>
                    </ul>
                </div>
                <!-- other-types -->
                <div v-if="otherAppsTypes.length">
                    <div v-for="item in otherAppsTypes" :key="item.id">
                        <div class="rong-work-edit-apptitle">{{ item.type_name }}</div>
                        <div class="rong-app-info" v-for="itemApp in item.apps" :key="itemApp.id">
                            <div class="rong-app-icon" :style="{'background-image': 'url(' + itemApp.logo_url + ')'}"></div>
                            <div class="rong-app-detail">
                                <div class="rong-app-name">{{itemApp.name}}</div>
                                <div class="rong-app-description">{{itemApp.description}}</div>
                            </div>
                            <button class="rong-button rong-selected-btn" v-if="isSelected(itemApp)">{{locale.btns.added}}</button>
                            <button class="rong-button" v-else @click="add(itemApp)">{{locale.btns.add}}</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <sort-app-dialog ref="sortAppDiaRef" v-if="sortAppshowDia" :appList="selectedApps" @sortChange="sortChange" />
</div>
</template>
<script src='./edit-otherapp.js'></script>
