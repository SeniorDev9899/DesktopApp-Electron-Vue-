<template>
  <div class="rong-contact-main rong-collect-main">
    <div class="rong-contact-hd rong-dragable rong-collect-title-container">
      <h2 class="rong-contact-title">{{ title }}</h2>
    </div>
    <div v-show="loadingNextPage" class="rong-loading-bottom">
      <span>{{locale.tips.loading}}</span>
    </div>
    <div
      v-rong-scroll-bar-y
      ref="list"
      class="rong-contact-content rong-collect-content"
      @mousewheel="scrollBottom($event)"
      @wheel="scrollBottom($event)"
    >
      <div v-if="isBusy && collectList.length === 0" class="rong-empty-contact">
        <div class="rong-search-empty">{{locale.tips.loading}}</div>
      </div>
      <div id="temp" v-else-if="collectList.length > 0">
        <div class="rong-contact-list rong-collect-list-inner">
          <div class="rong-profile"
            v-for="(item,index) in collectList"
            @click="showDetail(item)"
            @contextmenu.prevent="showContextmenu($event, {message: item})"
            :key="item.uid"
          >
            <div class="rong-conversation-other">
              <div class="rong-clearfix">
                <div class="rong-left rong-disable-select">
                    {{item.user==undefined?'':item.user.name}}
                </div>
                <div class="rong-right rong-disable-select">{{item.sentTime | dateFormat}}</div>
              </div>
              <div :class="item.messageType === 'LocationMessage' ? 'rong-locationmessage' : ''">
                <component
                  :is="getMessageType(item)"
                  :message="item"
                  :message-list="collectList"
                  :ref="item.messageUId"
                  :collect="true"
                  height="104px"
                  @showDetail="showDetail(item)"
                  @showImage="showImage"
                  @showSight="showSight"
                ></component>
              </div>
              <div class="rong-collect-border" v-if="index!=collectList.length-1"></div>
            </div>
          </div>
        </div>
      </div>
      <div v-else-if="collectList.length === 0 && keyword" class="rong-empty-contact">
        <div
          class="rong-recent-empty"
          v-html="localeFormat(locale.tips.searchEmpty, '<em>&quot;' + keyword + '&quot;</em>')"
        ></div>
      </div>
      <div v-else-if="status === 0" class="rong-empty-contact">
        <div class="rong-empty-contact-hd rong-dragable"></div>
        <div class="rong-empty-contact-bd rong-empty-collect-bd">
          <p>{{locale.components.collect.null}}</p>
        </div>
      </div>
    </div>
    <contextmenu
      v-if="context"
      @close="closeContextmenu"
      ref="contextmenu"
      @save="save"
      @copy="copy"
      @forward="forward"
      @remove="remove"
      :context="context"
    ></contextmenu>
  </div>
</template>
<style lang="scss" scoped>
.rong-profile {
    display: inherit;
}
</style>
<script src='./collect-list.js'></script>
