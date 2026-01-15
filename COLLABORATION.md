# 多人协作白板 - 数据一致性方案

## 🎯 设计目标

解决多人同时编辑白板时的数据一致性和冲突问题。

## 📐 架构方案

### 方案概述：类 Git 工作流

采用**保存前冲突检测 + 智能合并**的策略，类似 Git 的 Pull-Merge-Push 流程：

1. **版本号机制**：每次保存递增版本号，用于冲突检测
2. **保存前检查**：点击保存时检查远程是否有更新
3. **冲突提示**：发现冲突时显示对话框，由用户选择处理方式
4. **智能合并**：基于 ID 的数据合并，远程优先策略
5. **手动控制**：用户决定何时保存，无自动同步

## 🔧 核心组件

### 1. esaApi.js - API 层

新增功能：

```javascript
// 保存白板数据（带版本号）
saveWhiteboard(data, boardId)
  // 返回: { success, message, version }

// 检查版本更新
checkVersion(localVersion, boardId)
  // 返回: { hasUpdate, remoteVersion, remoteData }
```

### 2. useCollaboration.js - 协作管理

提供的功能：

```javascript
const {
  localVersion,      // 本地版本号
  hasConflict,       // 是否有冲突
  conflictData,      // 冲突数据
  
  checkForConflicts, // 检查冲突
  resolveConflicts,  // 解决冲突
  updateLocalVersion,// 更新版本号
  clearConflict      // 清除冲突
} = useCollaboration(boardId);
```

### 3. App.vue - 应用集成

协作集成要点：

- 启动时加载数据
- 点击保存按钮时检查冲突
- 发现冲突时显示对话框
- 用户选择处理方式：自动合并/使用远程/强制本地
- 显示协作状态（版本、冲突数）

## 🔄 工作流程

### 初始化流程

```
用户打开应用
  ↓
加载远程数据 (loadWhiteboard)
  ↓
设置本地版本号 (updateLocalVersion)
  ↓
用户可以开始编辑
```

### 编辑流程

```
用户执行操作（创建、编辑、删除）
  ↓
更新本地数据
  ↓
用户继续编辑或点击保存
```

### 保存流程（类似 Git Push）

```
用户点击保存按钮
  ↓
检查远程版本 (checkForConflicts)
  ↓
发现冲突？
  ├─ 否 → 直接保存到云端 (version++)
  └─ 是 ↓
获取远程数据
  ↓
智能合并数据 (resolveConflicts)
  ↓
显示冲突对话框，用户选择：
  ├─ 自动合并 → 使用合并后的数据
  ├─ 使用远程 → 放弃本地更改
  ├─ 强制本地 → 覆盖远程数据
  └─ 取消 → 不保存
  ↓
保存到云端 (version++)
  ↓
更新本地版本号
```

## 🤝 冲突解决策略

### 当前策略：远程优先 + ID 合并

```javascript
mergeData(localData, remoteData) {
  // 1. 使用 Map 基于 ID 合并
  // 2. 远程数据覆盖本地数据
  // 3. 保留最大的 nextId
  // 4. 统计冲突数量
}
```

### 冲突类型处理

| 冲突类型 | 处理策略 | 说明 |
|---------|---------|------|
| 同一便签被编辑 | 远程优先 | 远程版本覆盖本地 |
| 便签被删除 | 远程优先 | 如果远程删除则删除 |
| ID 冲突 | 保留两者 | 不同 ID 视为不同对象 |
| nextId 冲突 | 取最大值 | 避免 ID 重复 |

## 📊 数据结构

### 白板数据结构

```javascript
{
  notes: [
    {
      id: 1,
      content: "便签内容",
      color: "#ffeb3b",
      top: 50,
      left: 50,
      sectionId: null
    }
  ],
  sections: [
    {
      id: 1,
      title: "区域标题",
      top: 100,
      left: 100,
      width: 300,
      height: 200
    }
  ],
  nextNoteId: 2,
  nextSectionId: 2,
  version: 5,              // 新增：版本号
  timestamp: "2024-01-01T00:00:00Z",
  lastUpdated: "2024-01-01T00:00:00Z"
}
```

### 操作日志结构

```javascript
[
  {
    id: "1704096000000_abc123",
    type: "create_note",
    payload: {
      note: { id: 3, content: "新便签", ... }
    },
    version: 5,
    timestamp: "2024-01-01T00:00:00Z"
  },
  {
    id: "1704096005000_def456",
    type: "update_note",
    payload: {
      noteId: 3,
      updates: { content: "修改后的内容" }
    },
    version: 6,
    timestamp: "2024-01-01T00:00:05Z"
  }
]
```

## 🎨 UI 状态显示

工具栏显示协作状态：

- **版本号**：显示当前数据版本
- **同步状态**：显示是否正在同步
- **最后同步时间**：显示上次同步的时间
- **冲突数量**：检测到冲突时高亮显示

## ⚙️ 配置参数

```javascript
// useCollaboration.js
const SYNC_INTERVAL = 5000; // 同步间隔（毫秒）

// 操作日志保留数量
const MAX_OPERATION_LOG = 100; // 保留最近 100 条
```

## 🚀 优化建议

### 当前实现的优点

✅ 简单可靠，易于维护  
✅ 适合 EdgeKV 的简单架构  
✅ 自动检测和合并冲突  
✅ 操作立即保存，减少数据丢失  

### 未来可优化方向

1. **WebSocket 实时同步**
   - 替代轮询，实现真正的实时协作
   - 需要部署 WebSocket 服务器

2. **CRDT（无冲突复制数据类型）**
   - 实现更智能的冲突解决
   - 支持离线编辑后自动合并

3. **操作变换（OT）**
   - 更精细的操作级冲突解决
   - 支持协同编辑单个便签

4. **差异化同步**
   - 只传输变化的数据
   - 减少网络传输量

5. **用户标识**
   - 显示谁在编辑哪个便签
   - 实现协作感知

6. **锁定机制**
   - 编辑时锁定对象
   - 防止同时编辑冲突

## 📝 使用示例

### 用户操作流程

```
1. 用户 A 打开白板，加载数据（版本 v5）
2. 用户 A 创建了几个便签，但没有保存
3. 用户 B 打开白板，加载数据（版本 v5）
4. 用户 B 也创建了一些便签，点击保存
   - 检查远程版本：v5，无冲突
   - 直接保存，版本更新为 v6
5. 用户 A 继续编辑，然后点击保存
   - 检查远程版本：v6，发现冲突！
   - 显示冲突对话框，列出冲突详情
   - 用户 A 选择“自动合并”
   - 合并后保存，版本更新为 v7
6. 现在两个用户的便签都在白板上！
```

### 冲突处理示例

```javascript
// 情景：用户 A 和 B 同时编辑了 ID=3 的便签

// 用户 A 的本地数据：
note[3] = { id: 3, content: '用户 A 的修改', ... }

// 远程数据（用户 B 已保存）：
note[3] = { id: 3, content: '用户 B 的修改', ... }

// 用户 A 保存时：
// 1. 检测到冲突
// 2. 显示："便签 3 在两端都被修改"
// 3. 用户选择处理方式：
//    - 自动合并 → 使用远程的（用户 B 的修改）
//    - 使用远程 → 放弃本地修改
//    - 强制本地 → 使用用户 A 的修改
```

## 🔐 EdgeKV 限制

根据阿里云 ESA EdgeKV 的特性：

- **全球同步延迟**：2-300 秒
- **Value 大小限制**：1.8 MB
- **最终一致性**：不是强一致性

建议：
- 同步间隔不要太短（5-10 秒合适）
- 数据量大时考虑分片存储
- 关键操作后手动触发保存

## 📚 相关文件

- `src/services/esaApi.js` - API 服务
- `src/composables/useCollaboration.js` - 协作管理
- `src/App.vue` - 应用集成
- `src/components/WhiteboardToolbar.vue` - 状态显示

## 🎉 总结

通过**类 Git 工作流 + 保存前冲突检测**的方案，实现了：

✅ 手动控制保存时机  
✅ 自动检测远程更新  
✅ 冲突透明化处理  
✅ 多种合并策略  
✅ 用户友好的交互  

适合中小团队的协作白板应用！
