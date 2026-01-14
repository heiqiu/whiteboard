<template>
  <div 
    class="sticky-note"
    :style="{ 
      top: note.top + 'px', 
      left: note.left + 'px',
      backgroundColor: note.color || '#ffeb3b'
    }"
    @mousedown="$emit('drag-start', $event, note)"
  >
    <div class="note-content" @dblclick="handleEdit">
      {{ note.content }}
    </div>
    <div class="note-actions">
      <el-button 
        type="danger" 
        size="small" 
        :icon="Delete"
        @click.stop="$emit('delete', note.id)"
        circle
      />
    </div>
  </div>
</template>

<script>
import { Delete } from '@element-plus/icons-vue';

export default {
  name: 'StickyNote',
  props: {
    note: {
      type: Object,
      required: true
    }
  },
  emits: ['delete', 'edit', 'drag-start'],
  setup() {
    return {
      Delete
    };
  },
  methods: {
    handleEdit() {
      // 触发编辑事件,由父组件处理
      this.$emit('edit', this.note.id, this.note.content);
    }
  }
};
</script>

<style scoped>
.sticky-note {
  position: absolute;
  width: 120px;
  min-height: 100px;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 2px 2px 5px rgba(0,0,0,0.2);
  padding: 10px;
  cursor: move;
  transition: box-shadow 0.3s;
}

.sticky-note:hover {
  box-shadow: 3px 3px 8px rgba(0,0,0,0.3);
}

.note-content {
  width: 100%;
  min-height: 60px;
  word-wrap: break-word;
  font-family: Arial, sans-serif;
  font-size: 14px;
  line-height: 1.4;
  cursor: text;
}

.note-content:hover {
  background-color: rgba(255, 255, 255, 0.3);
}

.note-actions {
  margin-top: 8px;
  text-align: right;
  opacity: 0;
  transition: opacity 0.3s;
}

.sticky-note:hover .note-actions {
  opacity: 1;
}
</style>
