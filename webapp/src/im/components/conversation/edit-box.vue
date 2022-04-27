<template>
  <textarea
    class="rong-text-area"
    cols="30"
    rows="4"
    :placeholder="locale.inputText"
    :disabled="disabled"
    :value="value"
    @input="updateInput"
    @keyup="keyup"
    @keydown="keydown"
    @blur="saveDraft"
    @click="prepareinput"
    spellcheck="false"
  ></textarea>
</template>
<script src='./edit-box.js'></script>
