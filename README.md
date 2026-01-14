# 白板便签系统

基于 Vue 3 和阿里云 ESA EdgeKV 的白板便签应用,支持便签和区域的创建、编辑、拖拽和自动保存。

## ✨ 特性

- 📝 **便签管理**: 创建、编辑、删除便签
- 📦 **区域管理**: 创建可调整大小的区域,组织便签
- 🎨 **拖拽功能**: 便签和区域支持自由拖拽
- 💾 **自动保存**: 智能防抖保存,定期自动备份
- ☁️ **云端存储**: 集成 ESA EdgeKV 边缘存储
- 🔄 **离线支持**: 本地开发自动降级到 localStorage
- 🎯 **模块化架构**: 清晰的代码结构,易于维护和扩展

## 🚀 快速开始

### 安装依赖
```bash
npm install
```

### 开发环境
```bash
npm run dev
```
访问: http://localhost:5173

### 生产构建
```bash
npm run build
```

### 预览构建结果
```bash
npm run preview
```

## 📁 项目结构

```
src/
├── components/          # Vue 组件
│   ├── WhiteboardToolbar.vue    # 工具栏
│   ├── StickyNote.vue           # 便签
│   └── WhiteboardSection.vue    # 区域
├── composables/         # 组合式函数
│   ├── useWhiteboardData.js     # 数据管理
│   ├── useDrag.js               # 拖拽功能
│   ├── useResize.js             # 调整大小
│   └── useAutoSave.js           # 自动保存
├── services/            # 服务层
│   └── esaApi.js               # ESA API 封装
├── config/              # 配置文件
│   └── index.js                # 应用配置
├── utils/               # 工具函数
│   ├── whiteboard.js           # 白板工具
│   └── storage.js              # 存储工具
└── App.vue             # 主应用
```

详细架构说明请查看 [ARCHITECTURE.md](./ARCHITECTURE.md)

## ⚙️ 配置

### 环境变量

复制 `.env.example` 为 `.env`:
```bash
cp .env.example .env
```

编辑 `.env`:
```env
VITE_ESA_NAMESPACE=whiteboard
```

### 应用配置

在 `src/config/index.js` 中修改配置:
```javascript
// 自动保存配置
AUTO_SAVE_CONFIG = {
  debounceDelay: 3000,          // 防抖延迟 (毫秒)
  intervalDelay: 5 * 60 * 1000  // 定期保存间隔 (毫秒)
}

// 白板默认配置
WHITEBOARD_CONFIG = {
  minSectionSize: {
    width: 100,
    height: 100
  },
  noteSize: {
    width: 120,
    height: 100
  }
}
```

## 🎯 核心功能

### 便签操作
- **创建**: 点击"添加便签"按钮
- **编辑**: 双击便签内容
- **移动**: 拖拽便签
- **删除**: 点击便签上的"删除"按钮

### 区域操作
- **创建**: 点击"添加区域"按钮
- **编辑标题**: 双击区域标题
- **移动**: 拖拽区域头部
- **调整大小**: 拖拽右下角手柄
- **删除**: 点击区域头部的 × 按钮

### 保存功能
- **自动保存**: 操作后 3 秒自动保存
- **定期保存**: 每 5 分钟自动保存
- **手动保存**: 点击"保存到云端"按钮

## 🌐 部署到 ESA Pages

本项目已针对 **ESA Pages** 平台优化,支持一键部署。

### 快速部署
```bash
# 1. 构建项目
npm run build

# 2. 部署到 ESA Pages
npm run deploy
```

详细部署步骤请查看 [ESA_PAGES_DEPLOY.md](./ESA_PAGES_DEPLOY.md)

### 部署前准备
1. 创建 EdgeKV 命名空间: `whiteboard`
2. 配置环境变量: `ESA_NAMESPACE=whiteboard`
3. 确保 `functions/_middleware.js` 已上传

### 访问应用
部署成功后访问: `https://your-project.pages.dev`

## 🛠️ 技术栈

- **Vue 3** - 渐进式 JavaScript 框架
- **Composition API** - Vue 3 组合式 API
- **Vite** - 下一代前端构建工具
- **ESA EdgeKV** - 阿里云边缘存储服务

## 📖 文档

- [ARCHITECTURE.md](./ARCHITECTURE.md) - 详细的项目架构文档
- [ESA_PAGES_DEPLOY.md](./ESA_PAGES_DEPLOY.md) - ESA Pages 部署指南
- [edge-function-example.js](./edge-function-example.js) - ESA 边缘函数示例 (参考)

## 🤝 开发指南

### 添加新功能

1. 创建 composable (可选):
```javascript
// composables/useNewFeature.js
export function useNewFeature() {
  // 实现逻辑
  return { /* 导出 */ };
}
```

2. 创建组件 (可选):
```vue
<!-- components/NewComponent.vue -->
<template>
  <!-- 模板 -->
</template>

<script>
export default {
  name: 'NewComponent',
  props: { /* ... */ }
};
</script>
```

3. 在 App.vue 中集成

### 代码规范

- 使用 ES6+ 语法
- 组件名使用 PascalCase
- 文件名与组件名保持一致
- 添加必要的注释和文档

## 📝 更新日志

### v2.0.0 (2026-01-14)
- ✨ 模块化重构,提高代码可维护性
- 🎨 组件化设计,提取可复用组件
- 🔧 使用 Composables 封装业务逻辑
- 📦 统一配置管理
- 🛠️ 优化项目结构

### v1.0.0
- 🎉 初始版本发布
- ✨ 基础功能实现

## 📄 License

ISC

## 👨‍💻 Author

Your Name

---

**Enjoy coding! 🎉**
