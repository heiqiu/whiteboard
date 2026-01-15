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
        :disabled="saving || checkingConflict"
        :loading="saving || checkingConflict"
        :icon="Upload"
      >
        {{ checkingConflict ? '检查冲突...' : (saving ? '保存中...' : '保存到云端') }}
      </el-button>
      <el-tag v-if="lastSaved" type="success" effect="plain" size="large">
        <el-icon><CircleCheck /></el-icon>
        最后保存: {{ lastSaved }}
      </el-tag>
      <el-divider direction="vertical" v-if="localVersion > 0" />
      <el-tag v-if="localVersion > 0" type="primary" effect="plain" size="large">
        <el-icon><Document /></el-icon>
        版本: v{{ localVersion }}
      </el-tag>
      <el-tag v-if="hasConflict" type="warning" effect="dark" size="large">
        <el-icon><Warning /></el-icon>
        有未解决冲突
      </el-tag>
      <el-tag v-if="conflictCount > 0 && !hasConflict" type="info" effect="plain" size="large">
        <el-icon><InfoFilled /></el-icon>
        上次合并: {{ conflictCount }} 个冲突
      </el-tag>
    </el-space>
  </div>
</template>

<script>
import { Edit, Grid, Upload, CircleCheck, Document, Warning, InfoFilled } from '@element-plus/icons-vue';

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
    },
    checkingConflict: {
      type: Boolean,
      default: false
    },
    localVersion: {
      type: Number,
      default: 0
    },
    hasConflict: {
      type: Boolean,
      default: false
    },
    conflictCount: {
      type: Number,
      default: 0
    }
  },
  emits: ['create-note', 'create-section', 'save'],
  setup() {
    return {
      Edit,
      Grid,
      Upload,
      CircleCheck,
      Document,
      Warning,
      InfoFilled
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
