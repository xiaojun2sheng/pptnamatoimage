<template>
  <div class="batch-container">
    <div class="config-panel">
      <a-form :model="formState" layout="vertical">
        <a-form-item label="数据导入">
          <a-textarea
            v-model:value="formState.dataInput"
            placeholder="请输入JSON格式数据，例如：
[
  {&quot;姓名&quot;: &quot;张三&quot;, &quot;部门&quot;: &quot;技术部&quot;},
  {&quot;姓名&quot;: &quot;李四&quot;, &quot;部门&quot;: &quot;产品部&quot;}
]"
            :rows="6"
          />
        </a-form-item>

        <a-form-item>
          <a-button type="primary" @click="generateImages" :loading="generating" :disabled="!isConfigValid">
            生成图片
          </a-button>
        </a-form-item>
      </a-form>
    </div>

    <div class="preview-panel">
      <div class="preview-section">
        <h2>预览</h2>
        <div ref="previewRef">
          <shared-preview
            :background-image="config.backgroundImage"
            :background-scale="config.backgroundScale"
            :params="previewParams"
            :show-controls="false"
            @update:background-scale="config.backgroundScale = $event"
          />
        </div>
      </div>

      <div class="result-list" v-if="generatedImages.length > 0">
        <h3>生成结果</h3>
        <div class="image-grid">
          <div v-for="(image, index) in generatedImages" :key="index" class="image-item">
            <div class="image-preview" @click="showPreview(image)">
              <img :src="image.url" :alt="image.name" />
            </div>
            <div class="image-info">
              <span>{{ image.name }}</span>
              <a-button type="link" @click="downloadImage(image)">下载</a-button>
            </div>
          </div>
        </div>
        <div class="batch-actions">
          <a-button type="primary" @click="downloadAll">批量下载</a-button>
        </div>
      </div>
    </div>

    <!-- 大图预览 -->
    <a-modal
      v-model:visible="previewVisible"
      :footer="null"
      width="80%"
      :destroyOnClose="true"
      @cancel="previewVisible = false"
    >
      <div class="preview-modal-content">
        <img :src="previewImage?.url" :alt="previewImage?.name" />
        <div class="preview-info">
          <h3>{{ previewImage?.name }}</h3>
          <a-button type="primary" @click="downloadImage(previewImage)">下载图片</a-button>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { message } from 'ant-design-vue'
import html2canvas from 'html2canvas'
import { saveAs } from 'file-saver'
import SharedPreview from './SharedPreview.vue'

const previewRef = ref(null)
const bgImg = ref(null)
const generating = ref(false)
const generatedImages = ref([])
const previewVisible = ref(false)
const previewImage = ref(null)

const config = reactive({
  backgroundImage: '',
  backgroundScale: 100,
  params: []
})

const formState = reactive({
  dataInput: ''
})

const isConfigValid = computed(() => {
  return config.backgroundImage && formState.dataInput
})

// 用于预览显示的参数
const previewParams = computed(() => {
  try {
    const data = JSON.parse(formState.dataInput)
    if (!Array.isArray(data) || data.length === 0) {
      return config.params.map(param => ({
        ...param,
        value: param.name // 如果没有数据，显示参数名
      }))
    }
    // 使用第一条数据进行预览
    return config.params.map(param => {
      let value
      if (Object.keys(data[0]).length > 0) {
        // 优先使用参数名称作为键名来获取值
        value = data[0][param.name]
        // 如果通过参数名没有找到值，则使用参数名称作为预览值
        if (value === undefined) {
          value = param.name
        }
      }
      return {
        ...param,
        value: value || param.name
      }
    })
  } catch (error) {
    return config.params.map(param => ({
      ...param,
      value: param.name
    }))
  }
})

const updateConfig = () => {
  const savedConfig = localStorage.getItem('pptConfig')
  if (savedConfig) {
    try {
      const parsedConfig = JSON.parse(savedConfig)
      config.backgroundImage = parsedConfig.backgroundImage || ''
      config.backgroundScale = parsedConfig.backgroundScale || 100
      config.params = Array.isArray(parsedConfig.params) ? parsedConfig.params : []
    } catch (error) {
      message.error('配置格式错误，请重新保存配置')
    }
  }
}

// 页面可见时和storage变化时都刷新配置
const handleVisibility = () => {
  if (document.visibilityState === 'visible') {
    updateConfig()
  }
}

onMounted(() => {
  updateConfig()
  window.addEventListener('storage', updateConfig)
  document.addEventListener('visibilitychange', handleVisibility)
})

onUnmounted(() => {
  window.removeEventListener('storage', updateConfig)
  document.removeEventListener('visibilitychange', handleVisibility)
})

const showPreview = (image) => {
  previewImage.value = image
  previewVisible.value = true
}

const generateImages = async () => {
  if (!config.backgroundImage) {
    message.error('请先在预览页面完成配置！')
    return
  }
  try {
    const data = JSON.parse(formState.dataInput)
    if (!Array.isArray(data)) throw new Error('数据格式错误')
    generating.value = true
    generatedImages.value = []

    // 创建临时容器
    const tempContainer = document.createElement('div')
    tempContainer.style.position = 'absolute'
    tempContainer.style.left = '-9999px'
    tempContainer.style.top = '-9999px'
    document.body.appendChild(tempContainer)

    for (const item of data) {
      // 创建与预览完全相同的DOM结构
      const wrapper = document.createElement('div')
      wrapper.style.width = '800px' // 固定宽度，与预览组件相同
      wrapper.style.aspectRatio = '16/9'
      wrapper.style.position = 'relative'
      wrapper.style.overflow = 'hidden'

      const background = document.createElement('div')
      background.style.width = '100%'
      background.style.height = '100%'
      background.style.position = 'relative'
      background.style.backgroundImage = `url(${config.backgroundImage})`
      background.style.backgroundSize = 'contain'
      background.style.backgroundPosition = 'center'
      background.style.backgroundRepeat = 'no-repeat'
      background.style.backgroundColor = '#fff'
      background.style.display = 'flex'
      background.style.alignItems = 'center'
      background.style.justifyContent = 'center'

      wrapper.appendChild(background)

      // 添加文本元素
      config.params.forEach((param, idx) => {
        // 获取对应的数据值
        let value
        if (Object.keys(item).length > 0) {
          // 使用参数名称作为键名来获取对应的值
          value = item[param.name]
          // 如果通过参数名没有找到值，则按顺序获取
          if (value === undefined) {
            value = Object.values(item)[idx]
          }
        }
        
        if (value) {
          const textContent = document.createElement('div')
          textContent.style.position = 'absolute'
          textContent.style.left = `${param.position.x}%`
          textContent.style.top = `${param.position.y}%`
          textContent.style.transform = `rotate(${param.rotation}deg)`
          textContent.style.color = param.color
          textContent.style.fontSize = `${param.fontSize}px`
          textContent.style.fontWeight = param.fontWeight || 'normal'
          textContent.style.fontFamily = window.getComputedStyle(document.body).fontFamily
          textContent.style.display = 'flex'
          textContent.style.alignItems = 'center'
          textContent.style.justifyContent = 'center'
          textContent.style.transformOrigin = 'center center'
          textContent.style.whiteSpace = 'nowrap'
          textContent.textContent = value

          background.appendChild(textContent)
        }
      })

      tempContainer.appendChild(wrapper)

      // 等待图片加载
      await new Promise(resolve => {
        const img = new Image()
        img.onload = resolve
        img.src = config.backgroundImage
      })

      // 使用html2canvas生成图片
      const canvas = await html2canvas(wrapper, {
        backgroundColor: null,
        scale: 2, // 提高清晰度
        logging: false,
        useCORS: true,
        allowTaint: true
      })

      const imageUrl = canvas.toDataURL('image/png')
      generatedImages.value.push({
        name: Object.values(item)[0] || '未命名',
        url: imageUrl
      })

      // 清理临时元素
      wrapper.remove()
    }

    // 移除临时容器
    tempContainer.remove()
    message.success('图片生成成功！')
  } catch (error) {
    console.error(error)
    message.error('数据格式错误，请检查输入！')
  } finally {
    generating.value = false
  }
}

const downloadImage = (image) => {
  if (!image) return
  saveAs(image.url, `${image.name}.png`)
}

const downloadAll = () => {
  generatedImages.value.forEach(image => {
    downloadImage(image)
  })
}

// 暴露方法给父组件
defineExpose({
  updateConfig
})
</script>

<style scoped>
.batch-container {
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

.preview-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.preview-section {
  background: #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
  min-height: 300px;
  position: relative;
  border: 2px dashed #d9d9d9;
}

.result-list {
  background: #fff;
  padding: 24px;
  border-radius: 8px;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.image-item {
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.image-preview {
  cursor: pointer;
  transition: transform 0.2s;
}

.image-preview:hover {
  transform: scale(1.05);
}

.image-item img {
  width: 100%;
  height: 150px;
  object-fit: cover;
}

.image-info {
  padding: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.batch-actions {
  margin-top: 16px;
  text-align: right;
}

.preview-modal-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.preview-modal-content img {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
}

.preview-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
</style> 