<template>
  <teleport to="body">
    <transition name="dialog-fade">
      <div v-if="visible" class="dialog-overlay" @click.self="handleCancel">
        <div class="dialog-container">
          <div class="dialog-header">
            <h3>{{ title }}</h3>
          </div>
          <div class="dialog-body">
            <p class="dialog-message">{{ message }}</p>
            <div class="color-grid">
              <div
                v-for="color in colors"
                :key="color.value"
                class="color-item"
                :class="{ selected: selectedColor === color.value }"
                :style="{ backgroundColor: color.value }"
                :title="color.name"
                @click="selectedColor = color.value"
              >
                <span v-if="selectedColor === color.value" class="check-icon">✓</span>
              </div>
            </div>
          </div>
          <div class="dialog-footer">
            <button class="btn-cancel" @click="handleCancel">
              {{ cancelText }}
            </button>
            <button class="btn-confirm" @click="handleConfirm">
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script>
import { ref, watch } from 'vue';

export default {
  name: 'ColorPickerDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: '选择颜色'
    },
    message: {
      type: String,
      default: '请选择便签颜色:'
    },
    defaultColor: {
      type: String,
      default: '#ffeb3b'
    },
    confirmText: {
      type: String,
      default: '确定'
    },
    cancelText: {
      type: String,
      default: '取消'
    }
  },
  emits: ['confirm', 'cancel', 'update:visible'],
  setup(props, { emit }) {
    const selectedColor = ref(props.defaultColor);

    // 预设颜色
    const colors = [
      { name: '黄色', value: '#ffeb3b' },
      { name: '粉色', value: '#ffcdd2' },
      { name: '紫色', value: '#e1bee7' },
      { name: '蓝色', value: '#bbdefb' },
      { name: '青色', value: '#b2ebf2' },
      { name: '绿色', value: '#c8e6c9' },
      { name: '浅绿', value: '#dcedc8' },
      { name: '橙色', value: '#ffe0b2' },
      { name: '深橙', value: '#ffccbc' },
      { name: '棕色', value: '#d7ccc8' },
      { name: '灰色', value: '#cfd8dc' },
      { name: '白色', value: '#ffffff' }
    ];

    watch(() => props.visible, (newVal) => {
      if (newVal) {
        selectedColor.value = props.defaultColor;
      }
    });

    const handleConfirm = () => {
      emit('confirm', selectedColor.value);
      emit('update:visible', false);
    };

    const handleCancel = () => {
      emit('cancel');
      emit('update:visible', false);
    };

    return {
      selectedColor,
      colors,
      handleConfirm,
      handleCancel
    };
  }
};
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  min-width: 360px;
  max-width: 500px;
  animation: dialog-slide-in 0.3s ease-out;
}

.dialog-header {
  padding: 20px 24px 16px;
  border-bottom: 1px solid #e5e7eb;
}

.dialog-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

.dialog-body {
  padding: 24px;
}

.dialog-message {
  margin: 0 0 16px 0;
  font-size: 14px;
  line-height: 1.6;
  color: #374151;
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
}

.color-item {
  width: 50px;
  height: 50px;
  border-radius: 8px;
  border: 2px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.color-item:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.color-item.selected {
  border-color: #3b82f6;
  border-width: 3px;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

.check-icon {
  font-size: 24px;
  font-weight: bold;
  color: #1f2937;
  text-shadow: 0 0 3px white;
}

.dialog-footer {
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn-cancel,
.btn-confirm {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-cancel {
  background-color: #f3f4f6;
  color: #374151;
}

.btn-cancel:hover {
  background-color: #e5e7eb;
}

.btn-confirm {
  background-color: #3b82f6;
  color: white;
}

.btn-confirm:hover {
  background-color: #2563eb;
}

/* 动画 */
.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 0.3s;
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
}

@keyframes dialog-slide-in {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
