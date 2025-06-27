<template>
  <div class="preview-panel">
    <div class="preview-content" ref="previewRef">
      <div
        class="preview-background"
        :style="{
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          transform: `scale(${backgroundScale / 100})`
        }"
      >
        <div class="guide-lines">
          <div class="guide-line horizontal" :style="{ top: `${guideLines.horizontal}` }" v-if="guideLines.horizontal !== null"></div>
          <div class="guide-line vertical" :style="{ left: `${guideLines.vertical}` }" v-if="guideLines.vertical !== null"></div>
        </div>
        
        <div class="background-controls" v-if="showControls">
          <a-button-group>
            <a-button @click="zoomBackground('in')">
              <template #icon><zoom-in-outlined /></template>
            </a-button>
            <a-button @click="zoomBackground('out')">
              <template #icon><zoom-out-outlined /></template>
            </a-button>
            <a-button @click="resetBackground">
              <template #icon><undo-outlined /></template>
            </a-button>
          </a-button-group>
        </div>
        <div
          v-for="(param, index) in params"
          :key="index"
          class="text-content"
          :style="{
            color: param.color,
            fontSize: `${param.fontSize}px`,
            fontWeight: param.fontWeight,
            left: `${param.position.x}%`,
            top: `${param.position.y}%`,
            transform: `rotate(${param.rotation}deg)`,
            position: 'absolute',
            cursor: 'move'
          }"
          @mousedown="startDrag($event, index)"
        >
          <div class="text-value">{{ param.value }}</div>
          <div 
            class="rotate-handle"
            @mousedown.stop="startRotate($event, index)"
            v-if="showControls"
          >
            <div class="rotate-icon">↻</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { ZoomInOutlined, ZoomOutOutlined, UndoOutlined } from '@ant-design/icons-vue'

const props = defineProps({
  backgroundImage: {
    type: String,
    required: true
  },
  backgroundScale: {
    type: Number,
    default: 100
  },
  params: {
    type: Array,
    required: true
  },
  showControls: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:backgroundScale', 'update:params'])

const previewRef = ref(null)
const guideLines = reactive({
  horizontal: null,
  vertical: null
})

const startDrag = (e, index) => {
  if (e.target.classList.contains('rotate-handle')) return
  
  const param = props.params[index]
  const previewRect = previewRef.value.getBoundingClientRect()
  const startX = (e.clientX - previewRect.left) / previewRect.width * 100
  const startY = (e.clientY - previewRect.top) / previewRect.height * 100
  const startLeft = param.position.x
  const startTop = param.position.y

  const handleMouseMove = (e) => {
    // 计算鼠标移动的相对位置（百分比）
    const currentX = (e.clientX - previewRect.left) / previewRect.width * 100
    const currentY = (e.clientY - previewRect.top) / previewRect.height * 100
    
    // 计算位置变化（百分比）
    const deltaX = currentX - startX
    const deltaY = currentY - startY
    
    // 计算新位置（百分比）
    const newX = startLeft + deltaX
    const newY = startTop + deltaY
    
    // 限制在预览区域内（0-100%）
    const updatedParams = [...props.params]
    updatedParams[index] = {
      ...param,
      position: {
        x: Math.max(0, Math.min(newX, 100)),
        y: Math.max(0, Math.min(newY, 100))
      }
    }
    
    emit('update:params', updatedParams)
    checkGuideLines(updatedParams[index], index)
  }

  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
    guideLines.horizontal = null
    guideLines.vertical = null
  }

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

const startRotate = (e, index) => {
  const param = props.params[index]
  const startX = e.clientX
  const startY = e.clientY
  const startRotation = param.rotation

  const handleMouseMove = (e) => {
    const deltaX = e.clientX - startX
    const deltaY = e.clientY - startY
    const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI)
    const newRotation = startRotation + angle
    
    // 每15度对齐
    const updatedParams = [...props.params]
    updatedParams[index] = {
      ...param,
      rotation: Math.round(newRotation / 15) * 15
    }
    
    emit('update:params', updatedParams)
  }

  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

const checkGuideLines = (currentParam, currentIndex) => {
  const snapThreshold = 2 // 吸附阈值（百分比）
  let horizontalGuide = null
  let verticalGuide = null

  props.params.forEach((param, index) => {
    if (index === currentIndex) return

    // 检查水平对齐
    if (Math.abs(currentParam.position.y - param.position.y) < snapThreshold) {
      horizontalGuide = `${param.position.y}%`
      currentParam.position.y = param.position.y
    }

    // 检查垂直对齐
    if (Math.abs(currentParam.position.x - param.position.x) < snapThreshold) {
      verticalGuide = `${param.position.x}%`
      currentParam.position.x = param.position.x
    }
  })

  guideLines.horizontal = horizontalGuide
  guideLines.vertical = verticalGuide
}

const zoomBackground = (type) => {
  if (type === 'in') {
    emit('update:backgroundScale', Math.min(props.backgroundScale + 10, 200))
  } else {
    emit('update:backgroundScale', Math.max(props.backgroundScale - 10, 50))
  }
}

const resetBackground = () => {
  emit('update:backgroundScale', 100)
}
</script>

<style scoped>
.preview-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 800px;
  max-width: 1200px;
  margin: 0 auto;
}

.preview-content {
  background: #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  border: 2px dashed #d9d9d9;
  width: 100%;
  aspect-ratio: 16/9;
}

.preview-background {
  width: 100%;
  height: 100%;
  position: relative;
  background-color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.background-controls {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
  background: rgba(255, 255, 255, 0.8);
  padding: 8px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.text-content {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  cursor: move;
  transform-origin: center center;
  user-select: none;
  transition: box-shadow 0.2s;
  padding: 8px;
  min-width: 50px;
  min-height: 30px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid transparent;
}

.text-content:hover {
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.3);
  border: 1px solid rgba(24, 144, 255, 0.3);
}

.text-value {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rotate-handle {
  position: absolute;
  top: -20px;
  right: -20px;
  width: 20px;
  height: 20px;
  background: #1890ff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;
}

.text-content:hover .rotate-handle {
  opacity: 1;
}

.rotate-icon {
  color: white;
  font-size: 14px;
  transform: rotate(45deg);
}

.rotate-handle:hover {
  background: #40a9ff;
}

.rotate-handle:hover::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 30px;
  height: 30px;
  border: 2px dashed #40a9ff;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.guide-lines {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1000;
}

.guide-line {
  position: absolute;
  background: #1890ff;
  opacity: 0.8;
  box-shadow: 0 0 4px rgba(24, 144, 255, 0.5);
}

.guide-line.horizontal {
  width: 100%;
  height: 2px;
}

.guide-line.vertical {
  width: 2px;
  height: 100%;
}
</style> 