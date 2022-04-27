<template>
  <div class="rong-component">
    <div class="rong-search rong-dragable">
        <div class="rong-search-hd">
            <div class="rong-search-main">
                <input type="text" v-model.trim="keyword" @keyup.esc="clear" @keyup="search" class="rong-field rong-field-search" :placeholder="locale.btns.search">
                <i class="rong-search-icon"></i>
                <button v-if="keyword" class="rong-search-clear" type="button" :title="locale.btns.clear" @click="clear"></button>
            </div>
        </div>
    </div>
    <div class="rong-list-main">
      <ul class="rong-list-content rong-contact" v-if="collectList">
        <li v-if="showAll">
          <div class="rong-collect-item-hd rong-collect-all">
            <em
              class="rong-selected"
              v-if="$route.path === '/collect/all'"
            >{{locale.components.collect.all}}</em>
            <router-link v-else to="/collect/all">{{locale.components.collect.all}}</router-link>
          </div>
        </li>
        <li v-if="showText">
          <div class="rong-collect-item-hd rong-collect-text">
            <em
              class="rong-selected"
              v-if="$route.path === '/collect/text'"
            >{{locale.components.collect.text}}</em>
            <router-link v-else to="/collect/text">{{locale.components.collect.text}}</router-link>
          </div>
        </li>
        <li v-if="showVoice">
          <div class="rong-collect-item-hd rong-collect-voice">
            <em
              class="rong-selected"
              v-if="$route.path === '/collect/voice'"
            >{{locale.components.collect.voice}}</em>
            <router-link v-else to="/collect/voice">{{locale.components.collect.voice}}</router-link>
          </div>
        </li>
        <li v-if="showPosition">
          <div class="rong-collect-item-hd rong-collect-position">
            <em
              class="rong-selected"
              v-if="$route.path === '/collect/position'"
            >{{locale.components.collect.position}}</em>
            <router-link v-else to="/collect/position">{{locale.components.collect.position}}</router-link>
          </div>
        </li>
        <li v-if="showVideo">
          <div class="rong-collect-item-hd rong-collect-video">
            <em
              class="rong-selected"
              v-if="$route.path === '/collect/video'"
            >{{locale.components.collect.video}}</em>
            <router-link v-else to="/collect/video">{{locale.components.collect.video}}</router-link>
          </div>
        </li>
        <li v-if="showFile">
          <div class="rong-collect-item-hd rong-collect-file">
            <em
              class="rong-selected"
              v-if="$route.path === '/collect/file'"
            >{{locale.components.collect.file}}</em>
            <router-link v-else to="/collect/file">{{locale.components.collect.file}}</router-link>
          </div>
        </li>
        <li v-if="showLink">
          <div class="rong-collect-item-hd rong-collect-link">
            <em
              class="rong-selected"
              v-if="$route.path === '/collect/link'"
            >{{locale.components.collect.link}}</em>
            <router-link v-else to="/collect/link">{{locale.components.collect.link}}</router-link>
          </div>
        </li>
      </ul>
      <div v-else class="rong-loading">
        <span>{{locale.tips.loading}}</span>
      </div>
    </div>
  </div>
</template>
<script src='./collect.js'></script>
