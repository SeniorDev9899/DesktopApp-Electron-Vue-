<template>
  <Background>
    <div class="setting-box">
      <div class="title">资料设置</div>
      <Avatar
        :user="profileData"
        :upload="true"
        @changeAvatar="changeAvatar"
        class="user-avatar"
      ></Avatar>
      <el-form
        labelPosition="top"
        :model="profileData"
        :rules="profileRules"
        ref="profileForm"
        :disabled="isLoading"
      >
        <el-form-item prop="userName" label="姓名或昵称">
          <el-input
            prefix-icon="el-icon-user"
            clearable
            :maxlength="20"
            v-model="profileData.userName"
          />
        </el-form-item>
        <el-form-item class="btn-item">
          <el-button type="primary" :loading="isLoading" @click="submit"
            >提交</el-button
          >
        </el-form-item>
      </el-form>
      <div class="bottom">
        <div>{{ productName }} {{ version }}</div>
      </div>
    </div>
  </Background>
</template>

<script lang="ts">
import Avatar from '@/compos/Avatar.vue'
import { defineComponent } from 'vue'
import Background from '@/compos/Background.vue'
import useProfileSetting from './hooks/useProfileSetting'
import { appConfig } from '@/appConfig'

export default defineComponent({
  components: {
    Avatar,
    Background
  },
  setup() {
    const useProfile = useProfileSetting()
    const { productName, version } = appConfig
    return {
      ...useProfile,
      productName,
      version
    }
  }
})
</script>

<style lang="scss" scoped>
.setting-box {
  width: 100%;
  height: 100%;
  position: relative;
  .user-avatar {
    width: 80px;
    height: 80px;
    margin: auto;
    margin-top: 60px;
    font-size: 36px;
    line-height: 80px;
  }
  .el-form {
    margin-top: 41px;
    .btn-item {
      margin-top: 40px;
      .el-button {
        width: 100%;
      }
    }
  }
  .bottom {
    position: absolute;
    bottom: 30px;
    width: 100%;
    text-align: center;
    font-size: 12px;
    font-family: PingFangSC-Regular, PingFang SC;
    font-weight: 400;
    color: rgba(92, 105, 112, 1);
    line-height: 17px;
  }
}
</style>
