<template>
  <a-layout class="layout">
    <a-layout-header class="header">
      <h1 class="title">PPT姓名生成器</h1>
    </a-layout-header>
    <a-layout-content class="content">
      <a-tabs v-model:activeKey="activeTab" @change="handleTabChange">
        <a-tab-pane key="preview" tab="预览">
          <Preview />
        </a-tab-pane>
        <a-tab-pane key="batch" tab="批量生成">
          <Batch ref="batchRef" />
        </a-tab-pane>
      </a-tabs>
    </a-layout-content>
  </a-layout>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { message } from 'ant-design-vue'
import Preview from '../components/Preview.vue'
import Batch from '../components/Batch.vue'

const activeTab = ref('preview')
const batchRef = ref(null)

const handleTabChange = (key) => {
  if (key === 'batch') {
    const savedConfig = localStorage.getItem('pptConfig')
    if (!savedConfig) {
      message.warning('请先在预览页面完成配置！')
      activeTab.value = 'preview'
      return
    }
    nextTick(() => {
      if (batchRef.value) {
        batchRef.value.updateConfig()
        setTimeout(() => {
          activeTab.value = key
        }, 100)
      }
    })
  } else {
    activeTab.value = key
  }
}
</script>

<style scoped>
.layout {
  min-height: 100vh;
}

.header {
  background: #fff;
  padding: 0 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.title {
  color: #1890ff;
  margin: 0;
  line-height: 64px;
}

.content {
  padding: 24px;
  background: #fff;
  margin: 24px;
  min-height: 280px;
}
</style> 