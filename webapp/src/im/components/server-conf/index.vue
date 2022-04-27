<template>
    <div class="rong-server-conf rong-entry">
        <div class="rong-entry-hd rong-dragable"></div>
        <div class="rong-entry-bd rong-clearfix">
            <div class="rong-entry-aside">
                <div class="rong-product">
                    <span class="rong-product-name">{{productName}}</span>
                </div>
            </div>
            <div class="rong-entry-main">
                <div class="rong-entry-main-hd">
                    <p :style="{textAlign:'center', fontWeight:'600'}">{{ currentView === 'server-conf-add' ? locale.addServerAdress: locale.serverAdressConf }}</p>
                </div>
                <component
                  :is="currentView"
                  @current-view="currentViewChanged"
                  :currentItem="currentItem"
                  @updateOldItem="updateOldItem"
                  :oldItem="oldItem"
                ></component>
            </div>
        </div>
    </div>
</template>
<script src='./index.js'></script>
