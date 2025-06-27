<template>
  <div class="editor-container">
    <div class="toolbar-container"></div>
    <div class="editor-content">
      <div class="edit-container">
        <div class="editor"></div>
      </div>
    </div>
    <div class="button-container">
      <a-button type="primary" @click="togglePreview">预览</a-button>
    </div>

    <!-- 预览弹框 -->
    <a-modal
      v-model:visible="showPreview"
      title="预览"
      width="90%"
      style="top: 20px"
      :footer="null"
      @cancel="closePreview"
    >
      <div class="preview-wrapper">
        <div class="preview-tools">
          <div class="preview-tools-left">
            <a-space>
              <a-button @click="zoomOut" icon="minus">缩小</a-button>
              <span>{{ Math.round(scale * 100) }}%</span>
              <a-button @click="zoomIn" icon="plus">放大</a-button>
              <a-button @click="resetZoom">重置</a-button>
            </a-space>
          </div>
          <div class="preview-tools-right">
            <a-button type="primary" @click="generateImage">生成图片</a-button>
          </div>
        </div>
        <div class="preview-scroll-container">
          <div 
            class="preview-content" 
            ref="previewRef" 
            v-html="htmlContent"
            :style="{ transform: `scale(${scale})` }"
          ></div>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, shallowRef, onBeforeUnmount, onMounted } from 'vue'
import { createEditor, createToolbar } from '@wangeditor/editor'
import '@wangeditor/editor/dist/css/style.css'
import html2canvas from 'html2canvas'
import { message } from 'ant-design-vue'

// 编辑器实例，必须用 shallowRef
const editorRef = shallowRef()
const previewRef = ref(null)
const showPreview = ref(false)
const htmlContent = ref('')
const scale = ref(1)

// 组件销毁时，也及时销毁编辑器
onBeforeUnmount(() => {
  if (editorRef.value) {
    editorRef.value.destroy()
  }
})

// 缩放控制
const zoomIn = () => {
  scale.value = Math.min(2, scale.value + 0.1)
}

const zoomOut = () => {
  scale.value = Math.max(0.5, scale.value - 0.1)
}

const resetZoom = () => {
  scale.value = 1
}

const closePreview = () => {
  showPreview.value = false
  scale.value = 1
}

onMounted(() => {
  // 工具栏配置
  const toolbarConfig = {
    toolbarKeys: [
      'headerSelect',
      'bold',
      'italic',
      'underline',
      'through',
      'color',
      'bgColor',
      'fontSize',
      'fontFamily',
      'lineHeight',
      'bulletedList',
      'numberedList',
      'indent',
      'justifyLeft',
      'justifyCenter',
      'justifyRight',
      'uploadImage',
    ],
  }

  // 编辑器配置
  const editorConfig = {
    placeholder: '请输入内容...',
    MENU_CONF: {
      uploadImage: {
        // 自定义图片上传
        customUpload(file, insertFn) {
          // 将图片转换为base64
          const reader = new FileReader()
          reader.readAsDataURL(file)
          reader.onload = () => {
            const base64 = reader.result
            // 插入图片到编辑器
            insertFn(base64)
          }
          reader.onerror = () => {
            message.error('图片读取失败')
          }
        }
      }
    },
    // 配置粘贴
    PASTE_FILTER_STYLE: false, // 不过滤粘贴内容的样式
    pasteFilterImage: false, // 不过滤粘贴的图片
    // 粘贴图片时的回调函数
    onPasteImage(imageFiles, callback) {
      imageFiles.forEach(file => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = () => {
          const base64 = reader.result
          callback(base64)
        }
      })
    }
  }

  // 创建编辑器实例
  editorRef.value = createEditor({
    selector: '.editor',
    html: '<p>请输入内容...</p>',
    config: editorConfig,
  })

  // 创建工具栏
  createToolbar({
    editor: editorRef.value,
    selector: '.toolbar-container',
    config: toolbarConfig,
    mode: 'default'
  })
})

// 切换预览
const togglePreview = () => {
  showPreview.value = true
  scale.value = 1
  // 获取编辑器内容并处理样式
  const content = editorRef.value.getHtml()
  // 包装内容以确保样式一致性
  htmlContent.value = `<div class="content-wrapper">${content}</div>`
}

// 生成图片
const generateImage = async () => {
  try {
    // 临时重置缩放以确保生成正确大小的图片
    const originalScale = scale.value
    scale.value = 1

    // 确保预览内容已完全渲染和加载完成
    await new Promise(resolve => setTimeout(resolve, 500))

    const element = previewRef.value
    
    // 创建一个临时容器来渲染内容
    const tempContainer = document.createElement('div')
    tempContainer.style.position = 'absolute'
    tempContainer.style.left = '-9999px'
    tempContainer.style.top = '0'
    tempContainer.innerHTML = element.innerHTML
    document.body.appendChild(tempContainer)

    // 应用样式
    tempContainer.style.width = '794px' // A4 纸宽度
    tempContainer.style.background = '#ffffff'
    tempContainer.style.padding = '40px'
    tempContainer.style.boxSizing = 'border-box'

    // 复制所有样式
    const styles = window.getComputedStyle(element)
    Array.from(styles).forEach(key => {
      if (key !== 'position' && key !== 'left' && key !== 'top') {
        tempContainer.style[key] = styles.getPropertyValue(key)
      }
    })

    // 确保所有图片加载完成
    const images = tempContainer.getElementsByTagName('img')
    await Promise.all(
      Array.from(images).map(
        img => new Promise((resolve, reject) => {
          if (img.complete) {
            resolve()
          } else {
            img.onload = resolve
            img.onerror = reject
          }
        })
      )
    )

    const options = {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      allowTaint: true,
      scrollX: 0,
      scrollY: 0,
      width: 794, // A4 纸宽度
      height: tempContainer.offsetHeight,
      onclone: (clonedDoc) => {
        const clonedElement = clonedDoc.querySelector('.content-wrapper')
        if (clonedElement) {
          // 应用基本样式
          clonedElement.style.width = '100%'
          clonedElement.style.margin = '0'
          clonedElement.style.padding = '0'
          clonedElement.style.boxSizing = 'border-box'

          // 处理所有子元素
          const elements = clonedElement.getElementsByTagName('*')
          Array.from(elements).forEach(el => {
            const originalStyles = window.getComputedStyle(el)
            // 保留原始样式
            el.style.cssText = Array.from(originalStyles)
              .map(key => `${key}: ${originalStyles.getPropertyValue(key)}`)
              .join('; ')

            // 特别处理图片
            if (el.tagName === 'IMG') {
              el.style.maxWidth = '100%'
              el.style.height = 'auto'
            }
          })
        }
      }
    }

    // 生成图片
    const canvas = await html2canvas(tempContainer, options)
    
    // 清理临时容器
    document.body.removeChild(tempContainer)

    // 转换为图片并下载
    const dataUrl = canvas.toDataURL('image/png', 1.0)
    const link = document.createElement('a')
    link.download = `article-${Date.now()}.png`
    link.href = dataUrl
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // 恢复原始缩放
    scale.value = originalScale
    message.success('图片生成成功！')
  } catch (error) {
    console.error('图片生成失败:', error)
    message.error('图片生成失败：' + error.message)
  }
}
</script>

<style scoped>
.editor-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.toolbar-container {
  border: 1px solid #ccc;
  border-bottom: none;
}

.editor-content {
  margin-bottom: 20px;
}

.edit-container {
  width: 100%;
}

.editor {
  height: 600px;
  border: 1px solid #ccc;
}

.button-container {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.preview-wrapper {
  display: flex;
  flex-direction: column;
  height: calc(90vh - 110px);
  background: #f5f5f5;
}

.preview-tools {
  padding: 16px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.preview-scroll-container {
  flex: 1;
  overflow: auto;
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.preview-content {
  background: #fff;
  padding: 40px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transform-origin: top center;
  width: 794px; /* A4 纸宽度 */
  box-sizing: border-box;
  margin: 0 auto;
}

:deep(.w-e-text-container) {
  height: 600px !important;
}

:deep(.preview-content) {
  line-height: 1.5;
}

:deep(.preview-content img) {
  max-width: 100%;
  height: auto;
}

:deep(.preview-content *) {
  max-width: 100%;
  box-sizing: border-box;
}

:deep(.content-wrapper) {
  min-height: 100%;
}

/* 自定义滚动条样式 */
.preview-scroll-container::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.preview-scroll-container::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.preview-scroll-container::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.preview-scroll-container::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style> 