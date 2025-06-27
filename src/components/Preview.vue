<template>
  <div class="preview-container">
    <div class="config-panel">
      <a-form :model="formState" layout="vertical">
        <a-form-item label="背景图片">
          <a-upload
            v-model:file-list="fileList"
            :before-upload="beforeUpload"
            :show-upload-list="false"
          >
            <a-button type="primary">选择图片</a-button>
          </a-upload>
        </a-form-item>

        <div class="params-config">
          <div class="params-header">
            <h3>参数配置</h3>
            <a-button type="primary" @click="addParam">添加参数</a-button>
          </div>
          
          <div v-for="(param, index) in formState.params" :key="index" class="param-item">
            <div class="param-header">
              <span>参数 {{ index + 1 }}</span>
              <a-button type="link" danger @click="removeParam(index)">删除</a-button>
            </div>
            
            <a-form-item label="参数名称">
              <a-input v-model:value="param.name" placeholder="请输入参数名称" />
            </a-form-item>

            <a-form-item label="参数值">
              <a-input v-model:value="param.value" placeholder="请输入参数值" />
            </a-form-item>

            <a-form-item label="字体大小">
              <a-input-number
                v-model:value="param.fontSize"
                :min="12"
                :max="200"
                style="width: 100%"
              />
            </a-form-item>

            <a-form-item label="字体加粗">
              <a-select
                v-model:value="param.fontWeight"
                style="width: 100%"
              >
                <a-select-option value="normal">正常</a-select-option>
                <a-select-option value="bold">加粗</a-select-option>
                <a-select-option value="600">中等加粗</a-select-option>
                <a-select-option value="800">特粗</a-select-option>
                <a-select-option value="900">最粗</a-select-option>
              </a-select>
            </a-form-item>

            <a-form-item label="字体颜色">
              <div class="color-input">
                <a-input
                  v-model:value="param.color"
                  placeholder="#000000"
                  style="width: 120px"
                />
                <input
                  type="color"
                  v-model="param.color"
                  style="width: 40px; height: 32px; margin-left: 8px"
                />
              </div>
            </a-form-item>
          </div>
        </div>

        <a-form-item>
          <a-button type="primary" @click="saveConfig" :disabled="!isConfigValid">
            保存配置
          </a-button>
        </a-form-item>
      </a-form>
    </div>

    <shared-preview
      :background-image="formState.backgroundImage"
      :background-scale="formState.backgroundScale"
      :params="formState.params"
      @update:background-scale="formState.backgroundScale = $event"
      @update:params="formState.params = $event"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import SharedPreview from './SharedPreview.vue'

const fileList = ref([])
const formState = reactive({
  backgroundImage: '',
  backgroundScale: 100,
  params: []
})

const isConfigValid = computed(() => {
  return formState.backgroundImage && formState.params.length > 0
})

const addParam = () => {
  formState.params.push({
    name: '',
    value: '',
    fontSize: 24,
    fontWeight: 'normal',
    color: '#000000',
    position: { x: 40, y: 40 },
    rotation: 0
  })
}

const removeParam = (index) => {
  formState.params.splice(index, 1)
}

const beforeUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    message.error('只能上传图片文件！')
    return false
  }

  const reader = new FileReader()
  reader.readAsDataURL(file)
  reader.onload = () => {
    formState.backgroundImage = reader.result
    formState.backgroundScale = 100
  }
  return false
}

const saveConfig = () => {
  if (!isConfigValid.value) {
    message.warning('请完成所有必要配置！')
    return
  }

  localStorage.setItem('pptConfig', JSON.stringify({
    backgroundImage: formState.backgroundImage,
    backgroundScale: formState.backgroundScale,
    params: formState.params
  }))
  message.success('配置已保存！')
}

const loadSavedConfig = () => {
  const savedConfig = localStorage.getItem('pptConfig')
  if (savedConfig) {
    try {
      const config = JSON.parse(savedConfig)
      formState.backgroundImage = config.backgroundImage
      formState.backgroundScale = config.backgroundScale
      formState.params = config.params.map(param => ({
        ...param,
        fontWeight: param.fontWeight || 'normal',
        position: {
          x: typeof param.position.x === 'number' ? param.position.x : 40,
          y: typeof param.position.y === 'number' ? param.position.y : 40
        }
      }))
    } catch (error) {
      console.error('Failed to load saved config:', error)
    }
  }
}

onMounted(loadSavedConfig)
</script>

<style scoped>
.preview-container {
  display: flex;
  gap: 24px;
  height: 100%;
}

.config-panel {
  width: 300px;
  padding: 24px;
  background: #f5f5f5;
  border-radius: 8px;
}

.params-config {
  margin-top: 24px;
}

.params-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.param-item {
  background: #fff;
  padding: 16px;
  border-radius: 4px;
  margin-bottom: 16px;
}

.param-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.color-input {
  display: flex;
  align-items: center;
}
</style> 