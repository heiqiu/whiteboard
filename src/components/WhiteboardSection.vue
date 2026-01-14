<template>
  <div 
    class="section" 
    :style="sectionStyle"
    :data-section-id="section.id"
    :data-section="JSON.stringify(section)"
    @mousedown="$emit('drag-start', $event, section)"
  >
    <!-- 区域头部 -->
    <div class="section-header">
      <span @dblclick="handleEditTitle" class="section-title">
        {{ section.title }}
      </span>
      <el-button 
        type="danger" 
        size="small"
        :icon="Close"
        @click.stop="handleDelete"
        circle
      />
    </div>

    <!-- 区域内的便签 -->
    <slot></slot>

    <!-- 调整大小手柄 -->
    <div 
      class="resize-handle bottom-right" 
      @mousedown.stop="$emit('resize-start', $event, section)"
    ></div>
  </div>
</template>

<script>
import { Close } from '@element-plus/icons-vue';

export default {
  name: 'WhiteboardSection',
  props: {
    section: {
      type: Object,
      required: true
    }
  },
  emits: ['delete', 'edit-title', 'drag-start', 'resize-start'],
  setup() {
    return {
      Close
    };
  },
  computed: {
    sectionStyle() {
      return {
        top: this.section.top + 'px',
        left: this.section.left + 'px',
        width: this.section.width + 'px',
        height: this.section.height + 'px'
      };
    }
  },
  methods: {
    handleEditTitle() {
      // 触发编辑标题事件,由父组件处理
      this.$emit('edit-title', this.section.id, this.section.title);
    },
    handleDelete() {
      // 触发删除事件,由父组件处理
      this.$emit('delete', this.section.id);
    }
  }
};
</script>

<style scoped>
.section {
  position: absolute;
  border: 2px dashed #ccc;
  background-color: rgba(240, 240, 240, 0.3);
  border-radius: 8px;
  cursor: move;
  transition: border-color 0.3s;
}

.section:hover {
  border-color: #999;
}

.section-header {
  position: absolute;
  top: -25px;
  left: 0;
  background-color: #ccc;
  padding: 4px 8px;
  border-radius: 4px 4px 0 0;
  font-size: 14px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 150px;
}

.section-title {
  cursor: pointer;
  user-select: none;
}

.section-title:hover {
  text-decoration: underline;
}

.resize-handle {
  position: absolute;
  width: 10px;
  height: 10px;
  background-color: #666;
  border-radius: 2px;
  transition: background-color 0.3s;
}

.resize-handle:hover {
  background-color: #333;
}

.resize-handle.bottom-right {
  bottom: -5px;
  right: -5px;
  cursor: se-resize;
}
</style>
