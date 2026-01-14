# 白板应用 - 项目架构说明

## 📁 项目结构

```
whiteboard-app/
├── src/
│   ├── components/              # Vue 组件
│   │   ├── WhiteboardToolbar.vue    # 工具栏组件
│   │   ├── StickyNote.vue           # 便签组件
│   │   └── WhiteboardSection.vue    # 区域组件
│   │
│   ├── composables/             # 组合式函数 (Composables)
│   │   ├── useWhiteboardData.js     # 白板数据管理
│   │   ├── useDrag.js               # 拖拽功能
│   │   ├── useResize.js             # 调整大小功能
│   │   └── useAutoSave.js           # 自动保存功能
│   │
│   ├── services/                # 服务层
│   │   └── esaApi.js                # ESA EdgeKV API 封装
│   │
│   ├── config/                  # 配置文件
│   │   └── index.js                 # 应用配置和常量
│   │
│   ├── utils/                   # 工具函数
│   │   ├── whiteboard.js            # 白板相关工具
│   │   └── storage.js               # 存储工具
│   │
│   ├── App.vue                  # 主应用组件
│   ├── main.js                  # 应用入口
│   └── index.html
│
├── edge-function-example.js     # ESA 边缘函数示例
├── .env.example                 # 环境变量模板
├── vite.config.js              # Vite 配置
└── package.json
```

## 🏗️ 架构设计原则

### 1. **分层架构**
- **表现层 (Components)**: 负责 UI 渲染和用户交互
- **业务逻辑层 (Composables)**: 封装可复用的业务逻辑
- **服务层 (Services)**: 处理外部 API 调用
- **工具层 (Utils)**: 提供通用工具函数

### 2. **单一职责原则**
每个模块只负责一个功能:
- `WhiteboardToolbar`: 只管理工具栏
- `StickyNote`: 只管理单个便签
- `useDrag`: 只处理拖拽逻辑
- `useAutoSave`: 只处理自动保存

### 3. **组合式设计**
使用 Vue 3 Composition API,通过组合多个 composables 实现复杂功能

### 4. **配置集中管理**
所有配置项统一在 `config/index.js` 中管理,便于维护

## 📦 核心模块详解

### Components (组件层)

#### 1. **WhiteboardToolbar.vue**
工具栏组件,提供操作按钮

**Props:**
- `saving`: 是否正在保存
- `lastSaved`: 最后保存时间

**Events:**
- `create-note`: 创建便签
- `create-section`: 创建区域
- `save`: 手动保存

**职责:**
- 显示操作按钮
- 显示保存状态
- 触发操作事件

---

#### 2. **StickyNote.vue**
便签组件,显示单个便签

**Props:**
- `note`: 便签数据对象

**Events:**
- `delete`: 删除便签
- `edit`: 编辑便签
- `drag-start`: 开始拖拽

**职责:**
- 渲染便签内容
- 处理编辑交互
- 触发删除和拖拽事件

---

#### 3. **WhiteboardSection.vue**
区域组件,显示可容纳便签的区域

**Props:**
- `section`: 区域数据对象

**Events:**
- `delete`: 删除区域
- `edit-title`: 编辑区域标题
- `drag-start`: 开始拖拽
- `resize-start`: 开始调整大小

**Slots:**
- 默认插槽: 显示区域内的便签

**职责:**
- 渲染区域容器
- 显示区域标题
- 提供调整大小手柄
- 容纳内部便签

---

### Composables (组合式函数)

#### 1. **useWhiteboardData.js**
白板数据管理 composable

**功能:**
- 管理便签和区域的状态
- 提供 CRUD 操作方法
- 计算独立便签列表

**导出:**
```javascript
{
  // 响应式状态
  notes,              // 所有便签
  sections,           // 所有区域
  standaloneNotes,    // 独立便签(计算属性)
  nextNoteId,         // 下一个便签 ID
  nextSectionId,      // 下一个区域 ID
  
  // 方法
  getNotesInSection,      // 获取区域内便签
  createNote,             // 创建便签
  createSection,          // 创建区域
  deleteNote,             // 删除便签
  deleteSection,          // 删除区域
  updateNote,             // 更新便签
  updateSection,          // 更新区域
  loadData,               // 加载数据
  initializeDefaultData,  // 初始化默认数据
  getDataSnapshot,        // 获取数据快照
  clearAll               // 清空所有数据
}
```

---

#### 2. **useDrag.js**
拖拽功能 composable

**功能:**
- 处理便签和区域的拖拽
- 计算拖拽位置
- 限制拖拽边界

**参数:**
- `onDragEnd`: 拖拽结束回调函数

**导出:**
```javascript
{
  draggingElement,     // 当前拖拽元素
  dragType,            // 拖拽类型
  startDragNote,       // 开始拖拽便签
  startDragSection     // 开始拖拽区域
}
```

**特性:**
- 自动挂载/卸载事件监听
- 区分便签和区域拖拽
- 区域拖拽时同步移动内部便签

---

#### 3. **useResize.js**
调整大小功能 composable

**功能:**
- 处理区域大小调整
- 应用最小尺寸限制

**参数:**
- `onResizeEnd`: 调整结束回调函数

**导出:**
```javascript
{
  startResize     // 开始调整大小
}
```

---

#### 4. **useAutoSave.js**
自动保存功能 composable

**功能:**
- 防抖延迟保存
- 定期自动保存
- 手动保存

**参数:**
- `saveCallback`: 保存回调函数

**导出:**
```javascript
{
  saving,              // 是否正在保存
  lastSaved,           // 最后保存时间
  triggerAutoSave,     // 触发自动保存(防抖)
  manualSave,          // 手动保存
  startPeriodicSave,   // 启动定期保存
  stopPeriodicSave     // 停止定期保存
}
```

**配置:**
- 防抖延迟: 3秒
- 定期保存间隔: 5分钟

---

### Services (服务层)

#### **esaApi.js**
ESA EdgeKV API 封装服务

**功能:**
- 封装 EdgeKV API 调用
- 提供降级策略(localStorage)
- 处理错误和异常

**方法:**
```javascript
// 初始化
new ESAStorageAPI(config)

// 保存白板数据
saveWhiteboard(data, boardId)

// 加载白板数据
loadWhiteboard(boardId)

// 删除白板数据
deleteWhiteboard(boardId)
```

**特性:**
- EdgeKV 环境检测
- 自动降级到 localStorage
- 统一的错误处理

---

### Config (配置层)

#### **config/index.js**
应用配置和常量

**配置项:**
```javascript
// ESA EdgeKV 配置
ESA_CONFIG = {
  namespace,        // EdgeKV 命名空间
  defaultBoardId    // 默认白板 ID
}

// 自动保存配置
AUTO_SAVE_CONFIG = {
  debounceDelay,    // 防抖延迟
  intervalDelay     // 定期保存间隔
}

// 白板默认配置
WHITEBOARD_CONFIG = {
  defaultNotes,     // 默认便签
  defaultSections,  // 默认区域
  minSectionSize,   // 区域最小尺寸
  noteSize          // 便签尺寸
}

// 初始 ID 值
INITIAL_IDS = {
  note,             // 初始便签 ID
  section           // 初始区域 ID
}
```

---

### Utils (工具层)

#### 1. **whiteboard.js**
白板相关工具函数

**函数:**
- `clamp(position, min, max)`: 限制位置范围
- `randomPosition(max, offset)`: 生成随机位置
- `isNoteInSection(note, section)`: 检查便签是否在区域内
- `calculatePosition(event, container, offset)`: 计算相对位置
- `generateId(prefix, counter)`: 生成唯一 ID
- `getMaxId(items, idField)`: 计算最大 ID

---

#### 2. **storage.js**
存储工具函数

**函数:**
- `serialize(data)`: 序列化数据
- `deserialize(jsonString, defaultValue)`: 反序列化数据
- `createSnapshot(data)`: 创建数据快照
- `validateDataStructure(data, requiredFields)`: 验证数据结构

---

## 🔄 数据流

```
用户操作
    ↓
组件事件 (Components)
    ↓
事件处理器 (App.vue)
    ↓
Composables 更新状态
    ↓
触发自动保存 (useAutoSave)
    ↓
服务层保存数据 (esaApi)
    ↓
EdgeKV / localStorage
```

## 🎯 关键设计模式

### 1. **组合式模式 (Composition Pattern)**
使用多个 composables 组合实现复杂功能

### 2. **单向数据流**
数据从父组件流向子组件,事件从子组件冒泡到父组件

### 3. **策略模式**
ESA API 根据环境选择不同的存储策略(EdgeKV/localStorage)

### 4. **观察者模式**
使用 Vue 响应式系统自动更新 UI

## 🔧 扩展指南

### 添加新功能

1. **创建新的 Composable**
```javascript
// composables/useNewFeature.js
export function useNewFeature() {
  // 实现逻辑
  return {
    // 导出状态和方法
  };
}
```

2. **在 App.vue 中使用**
```javascript
import { useNewFeature } from './composables/useNewFeature.js';

const { feature } = useNewFeature();
```

### 添加新组件

1. **创建组件文件**
```vue
<!-- components/NewComponent.vue -->
<template>
  <!-- 模板 -->
</template>

<script>
export default {
  name: 'NewComponent',
  props: { /* ... */ },
  emits: [ /* ... */ ]
};
</script>
```

2. **在父组件中引入**
```javascript
import NewComponent from './components/NewComponent.vue';
```

## ✅ 优势

1. **清晰的职责划分**: 每个模块职责明确,易于理解
2. **高度可复用**: Composables 可在多个组件中复用
3. **易于测试**: 独立的函数和组件便于单元测试
4. **易于维护**: 模块化结构,修改影响范围小
5. **可扩展性强**: 可以轻松添加新功能而不影响现有代码

## 📚 技术栈

- **Vue 3**: 响应式框架
- **Composition API**: 组合式 API
- **Vite**: 构建工具
- **ESA EdgeKV**: 边缘存储服务

---

**更新时间**: 2026-01-14
**版本**: 2.0 (模块化重构版)
