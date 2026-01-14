<template>
  <div class="toolbar">
    <el-space :size="12" wrap>
      <el-button type="primary" @click="$emit('create-note')" :icon="Edit">
        添加便签
      </el-button>
      <el-button type="success" @click="$emit('create-section')" :icon="Grid">
        添加区域
      </el-button>
      <el-button 
        type="info" 
        @click="$emit('save')" 
        :disabled="saving"
        :loading="saving"
        :icon="Upload"
      >
        {{ saving ? '保存中...' : '保存到云端' }}
      </el-button>
      <el-tag v-if="lastSaved" type="success" effect="plain" size="large">
        <el-icon><CircleCheck /></el-icon>
        最后保存: {{ lastSaved }}
      </el-tag>
    </el-space>
  </div>
</template>

<script>
import { Edit, Grid, Upload, CircleCheck } from '@element-plus/icons-vue';

export default {
  name: 'WhiteboardToolbar',
  props: {
    saving: {
      type: Boolean,
      default: false
    },
    lastSaved: {
      type: String,
      default: ''
    }
  },
  emits: ['create-note', 'create-section', 'save'],
  setup() {
    return {
      Edit,
      Grid,
      Upload,
      CircleCheck
    };
  }
};
</script>

<style scoped>
.toolbar {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 16px;
}
</style>
