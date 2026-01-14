# EdgeKV API 使用指南

## 🔐 凭证和认证流程

### ESA Pages 环境中的 EdgeKV 认证

在 ESA Pages 环境中,EdgeKV 的认证是**自动完成的**,无需手动管理凭证。

#### 认证流程说明

```
1. 创建 EdgeKV 命名空间
   ↓
2. 在 ESA Pages 项目中绑定命名空间
   ↓
3. 配置环境变量 (可选)
   ↓
4. 在代码中直接使用 EdgeKV
   ↓
5. ESA Pages 自动注入凭证
```

### 详细步骤

#### 步骤 1: 创建 EdgeKV 命名空间

在阿里云 ESA 控制台:
1. 进入 **边缘存储** 页面
2. 点击 **创建命名空间**
3. 输入命名空间名称 (如: `whiteboard`)
4. 确认创建

**重要**: 记住命名空间名称,后续需要使用。

---

#### 步骤 2: 在 ESA Pages 项目中绑定命名空间

##### 方式一: 通过控制台绑定

1. 进入 **ESA Pages 控制台**
2. 选择你的项目
3. 进入 **设置** → **环境变量**
4. 添加 EdgeKV 命名空间绑定:
   - 变量名: `ESA_NAMESPACE` (或自定义)
   - 值: `whiteboard` (你的命名空间名称)

##### 方式二: 通过配置文件绑定

在 `.esa-pages.json` 中配置:
```json
{
  "name": "whiteboard-app",
  "env": {
    "ESA_NAMESPACE": "whiteboard"
  },
  "kv_namespaces": [
    {
      "binding": "WHITEBOARD_KV",
      "namespace": "whiteboard"
    }
  ]
}
```

##### 方式三: 通过 wrangler.toml 绑定

```toml
name = "whiteboard-app"

[vars]
ESA_NAMESPACE = "whiteboard"

[[kv_namespaces]]
binding = "WHITEBOARD_KV"
namespace = "whiteboard"
```

---

#### 步骤 3: 在代码中使用 EdgeKV

##### 在 ESA Pages 函数中使用

```javascript
// functions/_middleware.js
export async function onRequest(context) {
  const { request, env } = context;
  
  // 方式 1: 直接使用命名空间名称
  const edgeKV = new EdgeKV({ 
    namespace: "whiteboard"  // 直接指定
  });
  
  // 方式 2: 从环境变量读取
  const edgeKV2 = new EdgeKV({ 
    namespace: env.ESA_NAMESPACE  // 从环境变量读取
  });
  
  // 方式 3: 使用绑定的 KV (如果配置了 kv_namespaces)
  // const data = await env.WHITEBOARD_KV.get("key");
  
  // 使用 EdgeKV API
  const data = await edgeKV.get("key", { type: "text" });
  
  return new Response(data);
}
```

---

### 认证机制详解

#### 1. **无需显式凭证**

ESA Pages 环境中:
- ✅ **不需要** AccessKey
- ✅ **不需要** SecretKey
- ✅ **不需要** Token
- ✅ **不需要** 签名算法

#### 2. **自动权限管理**

```javascript
// ❌ 不需要这样做
const edgeKV = new EdgeKV({
  namespace: "whiteboard",
  accessKey: "...",      // ❌ 不需要
  secretKey: "...",      // ❌ 不需要
  token: "..."           // ❌ 不需要
});

// ✅ 正确做法 - 只需要命名空间名称
const edgeKV = new EdgeKV({ 
  namespace: "whiteboard"  // ✅ 只需要这个
});
```

#### 3. **权限边界**

ESA Pages 函数只能访问:
- ✅ 绑定到当前项目的命名空间
- ✅ 同一阿里云账号下的命名空间
- ❌ 其他账号的命名空间
- ❌ 未绑定的命名空间

---

### 环境变量配置

#### 推荐的环境变量命名

```javascript
// .esa-pages.json
{
  "env": {
    "ESA_NAMESPACE": "whiteboard",           // EdgeKV 命名空间
    "ESA_ENVIRONMENT": "production",          // 环境标识
    "ESA_DEBUG": "false"                      // 调试开关
  }
}
```

#### 在代码中读取环境变量

```javascript
export async function onRequest(context) {
  const { env } = context;
  
  // 读取环境变量
  const namespace = env.ESA_NAMESPACE || "whiteboard";
  const isDebug = env.ESA_DEBUG === "true";
  
  if (isDebug) {
    console.log("Using namespace:", namespace);
  }
  
  const edgeKV = new EdgeKV({ namespace });
  
  // 使用 EdgeKV...
}
```

---

### 安全最佳实践

#### 1. **使用环境变量**

❌ **不推荐**: 硬编码命名空间
```javascript
const edgeKV = new EdgeKV({ namespace: "whiteboard" });
```

✅ **推荐**: 使用环境变量
```javascript
const edgeKV = new EdgeKV({ namespace: env.ESA_NAMESPACE });
```

#### 2. **不同环境使用不同命名空间**

```javascript
// 生产环境
ESA_NAMESPACE=whiteboard-prod

// 测试环境
ESA_NAMESPACE=whiteboard-test

// 开发环境
ESA_NAMESPACE=whiteboard-dev
```

#### 3. **权限最小化原则**

- 只绑定必需的命名空间
- 不同项目使用不同命名空间
- 定期审查绑定的命名空间

---

### 常见问题

#### Q1: EdgeKV is not defined

**问题**: `ReferenceError: EdgeKV is not defined`

**原因**:
- 不在 ESA Pages 边缘函数环境中
- 本地开发环境不支持 EdgeKV

**解决**:
```javascript
// 添加环境检测和降级方案
if (typeof EdgeKV !== 'undefined') {
  // ESA Pages 环境
  const edgeKV = new EdgeKV({ namespace: env.ESA_NAMESPACE });
  // 使用 EdgeKV...
} else {
  // 本地开发环境
  // 使用 localStorage 或其他方案
}
```

#### Q2: 命名空间访问失败

**问题**: `Error: namespace not found` 或 `Access denied`

**原因**:
- 命名空间未创建
- 命名空间未绑定到项目
- 命名空间名称拼写错误

**解决**:
1. 检查命名空间是否存在
2. 确认已绑定到 ESA Pages 项目
3. 检查环境变量配置
4. 查看 ESA Pages 部署日志

#### Q3: 如何在本地开发中测试?

**方案 1**: 使用 Wrangler CLI 模拟
```bash
wrangler pages dev dist --kv WHITEBOARD_KV
```

**方案 2**: 实现降级逻辑
```javascript
class EdgeKVMock {
  constructor() {
    this.storage = new Map();
  }
  
  async get(key, options) {
    const data = this.storage.get(key);
    return data || undefined;
  }
  
  async put(key, value) {
    this.storage.set(key, value);
  }
  
  async delete(key) {
    return this.storage.delete(key);
  }
}

// 使用
const edgeKV = typeof EdgeKV !== 'undefined'
  ? new EdgeKV({ namespace: "whiteboard" })
  : new EdgeKVMock();
```

---

### 项目中的实现

#### functions/_middleware.js

```javascript
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  if (!url.pathname.startsWith('/api/whiteboard')) {
    return context.next();
  }

  try {
    // 从环境变量读取命名空间
    // ESA Pages 会自动注入凭证
    const edgeKV = new EdgeKV({ 
      namespace: env.ESA_NAMESPACE || "whiteboard" 
    });
    
    // 无需任何额外的认证步骤
    const data = await edgeKV.get("key", { type: "text" });
    
    return new Response(data, {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('EdgeKV Error:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
```

#### src/services/esaApi.js

```javascript
class ESAStorageAPI {
  constructor(config) {
    this.namespace = config.namespace || 'whiteboard';
    this.edgeKV = null;
  }

  initEdgeKV() {
    if (typeof EdgeKV !== 'undefined') {
      // ESA Pages 环境 - 自动认证
      this.edgeKV = new EdgeKV({ namespace: this.namespace });
      return true;
    }
    return false;
  }
  
  // 其他方法...
}
```

---

### 总结

✅ **ESA Pages 中使用 EdgeKV 非常简单**:

1. 创建命名空间
2. 绑定到项目
3. 直接使用 `new EdgeKV({ namespace })`
4. **无需管理任何凭证!**

ESA Pages 会自动:
- ✅ 处理认证
- ✅ 注入凭证
- ✅ 管理权限
- ✅ 确保安全

你只需要关注业务逻辑! 🎉

---

## 📋 自定义对话框系统

### 使用说明

项目已经移除了所有原生浏览器对话框(`alert`、`confirm`、`prompt`),使用自定义的 Vue 组件替代。

#### 组件列表

1. **ConfirmDialog.vue** - 确认对话框组件
2. **PromptDialog.vue** - 输入对话框组件
3. **useDialog.js** - 对话框 Composable

#### 在组件中使用

```javascript
import { useDialog } from '@/composables/useDialog.js';

export default {
  setup() {
    const { confirmDialog, promptDialog, showConfirm, showPrompt } = useDialog();
    
    // 1. 显示确认对话框
    const handleDelete = async () => {
      const confirmed = await showConfirm({
        title: '确认删除',
        message: '确定要删除这个项目吗?',
        confirmText: '删除',
        cancelText: '取消'
      });
      
      if (confirmed) {
        // 执行删除操作
      }
    };
    
    // 2. 显示输入对话框
    const handleEdit = async () => {
      const value = await showPrompt({
        title: '编辑内容',
        message: '请输入新内容:',
        defaultValue: '原始内容',
        placeholder: '请输入...'
      });
      
      if (value !== null) {
        // 用户输入了内容
      }
    };
    
    // 3. 显示警告对话框(只有确认按钮)
    const handleWarning = async () => {
      await showConfirm({
        title: '警告',
        message: '操作失败,请重试',
        confirmText: '知道了',
        cancelText: '' // 空字符串表示不显示取消按钮
      });
    };
    
    return {
      confirmDialog,
      promptDialog,
      handleDelete,
      handleEdit,
      handleWarning
    };
  }
};
```

#### 在模板中添加对话框组件

```vue
<template>
  <div>
    <!-- 你的内容 -->
    
    <!-- 对话框组件 -->
    <ConfirmDialog
      v-model:visible="confirmDialog.visible"
      :title="confirmDialog.title"
      :message="confirmDialog.message"
      :confirm-text="confirmDialog.confirmText"
      :cancel-text="confirmDialog.cancelText"
      @confirm="confirmDialog.onConfirm"
      @cancel="confirmDialog.onCancel"
    />

    <PromptDialog
      v-model:visible="promptDialog.visible"
      :title="promptDialog.title"
      :message="promptDialog.message"
      :default-value="promptDialog.defaultValue"
      :placeholder="promptDialog.placeholder"
      :confirm-text="promptDialog.confirmText"
      :cancel-text="promptDialog.cancelText"
      @confirm="promptDialog.onConfirm"
      @cancel="promptDialog.onCancel"
    />
  </div>
</template>
```

#### API 说明

##### showConfirm(options)

显示确认对话框

**参数**:
- `title` (string): 对话框标题,默认 "确认"
- `message` (string): 对话框消息内容
- `confirmText` (string): 确认按钮文本,默认 "确定"
- `cancelText` (string): 取消按钮文本,默认 "取消",设为空字符串可隐藏取消按钮

**返回值**: Promise<boolean>
- `true`: 用户点击确认
- `false`: 用户点击取消

##### showPrompt(options)

显示输入对话框

**参数**:
- `title` (string): 对话框标题,默认 "输入"
- `message` (string): 对话框消息内容
- `defaultValue` (string): 默认输入值,默认 ""
- `placeholder` (string): 输入框占位符,默认 "请输入..."
- `confirmText` (string): 确认按钮文本,默认 "确定"
- `cancelText` (string): 取消按钮文本,默认 "取消"

**返回值**: Promise<string|null>
- `string`: 用户输入的内容
- `null`: 用户取消输入

#### 样式自定义

对话框组件使用 scoped CSS,可以通过以下方式自定义:

1. **修改组件样式**: 直接编辑 `ConfirmDialog.vue` 和 `PromptDialog.vue` 中的 `<style>` 部分
2. **使用 CSS 变量**: 在全局样式中定义变量

```css
:root {
  --dialog-overlay-bg: rgba(0, 0, 0, 0.5);
  --dialog-border-radius: 8px;
  --dialog-confirm-color: #ef4444;
  --dialog-cancel-color: #f3f4f6;
}
```

#### 特性

✅ **美观现代**: 采用现代 UI 设计,圆角、阴影、动画效果
✅ **响应式**: 支持移动端和桌面端
✅ **键盘支持**: 
   - Enter 键确认
   - Esc 键取消
   - 自动聚焦输入框
✅ **Portal**: 使用 `<teleport>` 渲染到 body,避免 z-index 问题
✅ **Promise API**: 异步/等待友好的 API
✅ **灵活配置**: 可自定义标题、消息、按钮文本

#### 迁移指南

**旧代码** (使用原生对话框):
```javascript
// 确认对话框
if (confirm('确定要删除吗?')) {
  deleteItem();
}

// 输入对话框
const name = prompt('请输入名称:', '默认值');
if (name !== null) {
  saveName(name);
}

// 警告对话框
alert('操作失败!');
```

**新代码** (使用自定义对话框):
```javascript
// 确认对话框
const confirmed = await showConfirm({
  message: '确定要删除吗?'
});
if (confirmed) {
  deleteItem();
}

// 输入对话框
const name = await showPrompt({
  message: '请输入名称:',
  defaultValue: '默认值'
});
if (name !== null) {
  saveName(name);
}

// 警告对话框
await showConfirm({
  title: '警告',
  message: '操作失败!',
  confirmText: '知道了',
  cancelText: ''
});
```

---

根据[阿里云 ESA 边缘存储 API 文档](https://help.aliyun.com/zh/edge-security-acceleration/esa/user-guide/edge-storage-api),EdgeKV 提供以下 API:

---

## 🔧 Constructor - 创建实例

创建 EdgeKV 实例对象。

```javascript
const edgeKV = new EdgeKV({ namespace: "ns" });
```

**参数:**
- `namespace`: 存储空间名称 (在控制台创建)

---

## 📖 get() - 读取数据

从存储空间读取数据。

### 定义
```javascript
get(key, { type: "type" })
```

### 参数
- `key`: string 类型,要读取的键名
- `type`: 可选,返回数据类型:
  - `"stream"` (默认): ReadableStream 流式内容
  - `"text"`: 返回字符串
  - `"json"`: 自动解析 JSON 为 Object
  - `"arrayBuffer"`: 返回二进制数据

### 返回值
返回 Promise:
- ✅ key 存在: 返回对应类型的数据
- ⚠️ key 不存在: 返回 `undefined`
- ❌ 异常: reject error

### 示例代码
```javascript
export default {
  async fetch(request) {
    try {
      const edgeKV = new EdgeKV({ namespace: "ns" });
      
      // 读取文本数据
      let value = await edgeKV.get("key", { type: "text" });
      
      if (value === undefined) {
        return new Response("Key not found", { status: 404 });
      }
      
      return new Response(value);
    } catch (e) {
      return new Response("Error: " + e, { status: 500 });
    }
  }
}
```

### 项目中的实现
```javascript
// src/services/esaApi.js
async loadWhiteboard(boardId = 'default') {
  const key = this.getWhiteboardKey(boardId);
  
  // 使用 text 类型读取
  const result = await this.edgeKV.get(key, { type: "text" });
  
  if (result === undefined) {
    // 不存在,返回默认数据
    return this.getDefaultData();
  } else {
    // 解析 JSON
    return JSON.parse(result);
  }
}
```

---

## 📝 put() - 写入/更新数据

写入或更新数据到存储空间。

### 定义
```javascript
put(key, value)
```

### 参数
- `key`: string 类型,不能为空
- `value`: 要存储的数据,最大 1.8 MB,类型可为:
  - `string`
  - `ReadableStream`
  - `ArrayBuffer`
  - `Response`

### 返回值
返回 Promise:
- ✅ 成功: resolve `undefined`
- ❌ 异常: reject error

### 示例代码
```javascript
export default {
  async fetch(request) {
    try {
      const edgeKV = new EdgeKV({ namespace: "ns" });
      
      // 存储字符串
      await edgeKV.put("put_string", "string_value");
      
      // 成功后 put 返回 undefined,无异常即成功
      return new Response("Put success");
      
    } catch (e) {
      return new Response("Error: " + e, { status: 500 });
    }
  }
}
```

### 项目中的实现
```javascript
// src/services/esaApi.js
async saveWhiteboard(data, boardId = 'default') {
  const key = this.getWhiteboardKey(boardId);
  const dataToSave = {
    ...data,
    timestamp: new Date().toISOString()
  };
  
  // 保存 (成功时返回 undefined,无异常即成功)
  await this.edgeKV.put(key, JSON.stringify(dataToSave));
  
  return { success: true };
}
```

---

## 🗑️ delete() - 删除数据

从存储空间删除 Key 及其对应的 Value。

### 定义
```javascript
delete(key)
```

### 参数
- `key`: string 类型,要删除的键名

### 返回值
返回 Promise:
- ✅ 删除成功: resolve `true`
- ⚠️ 删除失败: resolve `false` (key 可能不存在)
- ❌ 异常: reject error

### 示例代码
```javascript
export default {
  async fetch(request) {
    try {
      const edgeKV = new EdgeKV({ namespace: "ns" });
      
      let result = await edgeKV.delete("key");
      
      if (result === true) {
        return new Response("Delete success");
      } else {
        return new Response("Delete failed or key not found", { status: 404 });
      }
      
    } catch (e) {
      return new Response("Error: " + e, { status: 500 });
    }
  }
}
```

### 项目中的实现
```javascript
// src/services/esaApi.js
async deleteWhiteboard(boardId = 'default') {
  const key = this.getWhiteboardKey(boardId);
  
  // delete 成功返回 true,失败返回 false
  const result = await this.edgeKV.delete(key);
  
  if (result === true) {
    return { success: true, message: 'Deleted' };
  } else {
    return { success: false, message: 'Key not found' };
  }
}
```

---

## ⚠️ 重要注意事项

### 1. 返回值判断

❌ **错误示例** (之前的实现):
```javascript
// put() 错误判断
const result = await edgeKV.put(key, value);
if (result === undefined) {  // ❌ put 总是返回 undefined
  // 成功
}

// get() 错误判断
const data = await edgeKV.get(key);
if (data) {  // ❌ 应该判断 === undefined
  // 存在
}
```

✅ **正确示例** (当前实现):
```javascript
// put() 正确用法
await edgeKV.put(key, value);
// 无异常即成功,不需要检查返回值

// get() 正确用法
const data = await edgeKV.get(key, { type: "text" });
if (data === undefined) {  // ✅ 明确判断 undefined
  // key 不存在
} else {
  // key 存在
}

// delete() 正确用法
const result = await edgeKV.delete(key);
if (result === true) {  // ✅ 判断 true
  // 删除成功
} else {  // result === false
  // 删除失败或 key 不存在
}
```

### 2. 数据类型

**存储时**: 
- 字符串可以直接存储
- 对象需要 `JSON.stringify()` 序列化

**读取时**:
- 使用 `{ type: "text" }` 获取字符串
- 使用 `{ type: "json" }` 自动解析 JSON
- 或手动 `JSON.parse()`

### 3. 大小限制

- 单个 Value 最大: **1.8 MB**
- 超过限制会抛出异常

### 4. 异常处理

所有 API 都可能抛出异常,必须使用 try-catch:

```javascript
try {
  await edgeKV.put(key, value);
} catch (error) {
  console.error('Put failed:', error);
  // 处理错误
}
```

---

## 🎯 完整示例

### ESA Pages 中间件实现

```javascript
// functions/_middleware.js
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  
  if (!url.pathname.startsWith('/api/whiteboard')) {
    return context.next();
  }
  
  try {
    const edgeKV = new EdgeKV({ 
      namespace: env.ESA_NAMESPACE || "whiteboard" 
    });
    
    const boardId = url.pathname.split('/').pop() || 'default';
    const key = `whiteboard_${boardId}`;
    
    // GET - 读取数据
    if (request.method === 'GET') {
      const data = await edgeKV.get(key, { type: "text" });
      
      if (data === undefined) {
        // 返回默认数据
        return new Response(JSON.stringify({
          notes: [],
          sections: []
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      return new Response(data, {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // POST - 保存数据
    if (request.method === 'POST') {
      const data = await request.json();
      
      // 保存 (无异常即成功)
      await edgeKV.put(key, JSON.stringify(data));
      
      return new Response(JSON.stringify({ 
        success: true 
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // DELETE - 删除数据
    if (request.method === 'DELETE') {
      const result = await edgeKV.delete(key);
      
      return new Response(JSON.stringify({ 
        success: result === true,
        message: result ? 'Deleted' : 'Not found'
      }), {
        status: result ? 200 : 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response('Method not allowed', { status: 405 });
    
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
```

---

## 📚 参考资料

- [阿里云 ESA 边缘存储 API 文档](https://help.aliyun.com/zh/edge-security-acceleration/esa/user-guide/edge-storage-api)
- [ESA Pages 部署指南](./ESA_PAGES_DEPLOY.md)
- [项目架构文档](./ARCHITECTURE.md)

---

**更新时间**: 2026-01-14  
**API 版本**: ESA EdgeKV v1.0
