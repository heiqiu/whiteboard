# ESA Pages 部署指南

## 📦 项目说明

本白板应用已针对 **阿里云 ESA Pages** 平台进行优化配置，可以直接部署到 ESA Pages 并使用 EdgeKV 边缘存储。

## 🏗️ 架构设计

### ESA Pages 架构
```
用户请求
    ↓
ESA Pages (全球边缘节点)
    ↓
├── 静态资源 (dist/) → CDN 加速
└── API 路由 (/api/whiteboard/*) → 中间件函数
                                        ↓
                                    EdgeKV 存储
```

### 关键文件

```
whiteboard-app/
├── functions/
│   └── _middleware.js          # ESA Pages 中间件 (API 处理)
├── dist/                       # 构建输出 (静态资源)
├── .esa-pages.json            # ESA Pages 配置
├── wrangler.toml              # Wrangler 配置 (可选)
└── src/                       # 源代码
```

## 🚀 部署步骤

### 方式一: 使用 ESA Pages CLI

#### 1. 安装 Wrangler CLI
```bash
npm install -g wrangler
```

#### 2. 登录阿里云账号
```bash
wrangler login
```

#### 3. 创建 EdgeKV 命名空间
在阿里云 ESA 控制台:
1. 进入 **边缘存储** 页面
2. 创建命名空间: `whiteboard`
3. 记录命名空间 ID

#### 4. 构建项目
```bash
npm run build
```

#### 5. 部署到 ESA Pages
```bash
npm run deploy
```

或者手动部署:
```bash
wrangler pages deploy dist --project-name=whiteboard-app
```

---

### 方式二: 使用 ESA 控制台

#### 1. 构建项目
```bash
npm run build
```

#### 2. 上传到 ESA Pages
1. 登录 [阿里云 ESA 控制台](https://esa.console.aliyun.com/)
2. 进入 **Pages** 页面
3. 点击 **创建项目**
4. 项目设置:
   - 项目名称: `whiteboard-app`
   - 构建命令: `npm run build`
   - 构建输出目录: `dist`
   - Node 版本: `18`

#### 3. 上传 functions 目录
将 `functions/_middleware.js` 上传到项目的 functions 目录

#### 4. 配置环境变量
在项目设置中添加环境变量:
- `ESA_NAMESPACE` = `whiteboard`

#### 5. 绑定 EdgeKV
在项目设置中绑定 EdgeKV 命名空间 `whiteboard`

---

### 方式三: Git 集成自动部署

#### 1. 连接 Git 仓库
在 ESA Pages 控制台连接你的 Git 仓库 (GitHub/GitLab/Gitee)

#### 2. 配置构建设置
```yaml
构建命令: npm run build
构建输出目录: dist
根目录: /
Node 版本: 18
环境变量:
  - ESA_NAMESPACE=whiteboard
```

#### 3. 推送代码
```bash
git add .
git commit -m "Deploy to ESA Pages"
git push origin main
```

#### 4. 自动部署
ESA Pages 会自动检测代码变更并触发构建部署

---

## ⚙️ 配置说明

### 1. .esa-pages.json
ESA Pages 项目配置文件:
```json
{
  "name": "whiteboard-app",
  "type": "vue",
  "framework": "vite",
  "build": {
    "command": "npm run build",
    "output": "dist",
    "install": "npm install"
  },
  "runtime": {
    "node_version": "18"
  },
  "routes": [
    {
      "path": "/api/whiteboard/*",
      "function": "functions/_middleware.js"
    }
  ],
  "env": {
    "ESA_NAMESPACE": "whiteboard"
  }
}
```

### 2. wrangler.toml (可选)
Wrangler CLI 配置文件:
```toml
name = "whiteboard-app"
compatibility_date = "2024-01-01"

pages_build_output_dir = "dist"

[vars]
ESA_NAMESPACE = "whiteboard"

[build]
command = "npm run build"
cwd = "."
watch_dir = "src"
```

### 3. functions/_middleware.js
ESA Pages 中间件,处理 API 请求:
- 路由匹配: `/api/whiteboard/*`
- EdgeKV 集成
- CORS 支持
- 错误处理

---

## 🌐 访问应用

部署成功后,你将获得一个 ESA Pages 域名:
```
https://whiteboard-app.pages.dev
```

或者绑定自定义域名:
```
https://whiteboard.yourdomain.com
```

### API 端点
```
GET    /api/whiteboard/default    - 读取白板数据
POST   /api/whiteboard/default    - 保存白板数据
DELETE /api/whiteboard/default    - 删除白板数据
```

---

## 🔧 本地开发

### 开发环境
```bash
npm run dev
```
本地开发时,EdgeKV 不可用,应用会自动降级到 localStorage

### 模拟 ESA Pages 环境
```bash
wrangler pages dev dist
```
使用 Wrangler 在本地模拟 ESA Pages 环境

---

## 📊 性能优化

### 1. 静态资源优化
- ✅ Vite 构建优化
- ✅ 代码分割
- ✅ Tree-shaking
- ✅ 压缩和混淆

### 2. 边缘加速
- ✅ 全球 CDN 分发
- ✅ 智能路由
- ✅ HTTP/3 支持
- ✅ 边缘缓存

### 3. EdgeKV 优化
- ✅ 低延迟读写
- ✅ 全球数据同步
- ✅ 自动容错
- ✅ 最终一致性

---

## 🐛 故障排查

### 1. 部署失败

**问题**: 构建失败
```bash
Error: Build failed
```

**解决**:
1. 检查 Node 版本 (需要 18+)
2. 检查依赖安装: `npm install`
3. 本地测试构建: `npm run build`

---

### 2. EdgeKV 不可用

**问题**: EdgeKV is not defined
```
ReferenceError: EdgeKV is not defined
```

**解决**:
1. 确认已创建 EdgeKV 命名空间
2. 检查环境变量 `ESA_NAMESPACE`
3. 确认中间件正确上传到 functions 目录

---

### 3. API 请求失败

**问题**: 404 Not Found
```
GET /api/whiteboard/default 404
```

**解决**:
1. 检查路由配置
2. 确认 `functions/_middleware.js` 已部署
3. 查看 ESA Pages 日志

---

### 4. CORS 错误

**问题**: CORS policy blocking
```
Access to fetch has been blocked by CORS policy
```

**解决**:
1. 检查中间件的 CORS 头配置
2. 确保 OPTIONS 请求正确处理
3. 自定义域名需要配置 CORS

---

## 📈 监控和日志

### 查看部署日志
在 ESA Pages 控制台:
1. 进入项目详情
2. 点击 **部署历史**
3. 查看构建日志

### 查看运行日志
在 ESA Pages 控制台:
1. 进入项目详情
2. 点击 **日志**
3. 实时查看请求日志和错误信息

### 性能监控
在 ESA Pages 控制台查看:
- 请求数量
- 响应时间
- 错误率
- 带宽使用

---

## 💰 成本估算

### ESA Pages 计费
- **免费额度**: 每月 10 万次请求
- **超额费用**: 按请求次数计费

### EdgeKV 计费
- **存储费用**: 0.0139 元/GB/小时
- **Get 费用**: 0.7 元/百万次
- **Put 费用**: 6.5 元/百万次

### 估算 (1000 用户/天)
```
每日请求: 5000 次
每月请求: 150,000 次
EdgeKV Get: 3000 次/天 = 90,000 次/月
EdgeKV Put: 500 次/天 = 15,000 次/月

月成本: 约 2-3 元
```

---

## 🔐 安全建议

### 1. 环境变量
敏感信息使用环境变量,不要硬编码:
```javascript
const namespace = env.ESA_NAMESPACE;
```

### 2. 访问控制
添加身份验证 (可选):
```javascript
// functions/_middleware.js
const token = request.headers.get('Authorization');
if (!isValidToken(token)) {
  return new Response('Unauthorized', { status: 401 });
}
```

### 3. 数据验证
验证输入数据:
```javascript
function validateWhiteboardData(data) {
  if (!data.notes || !Array.isArray(data.notes)) {
    throw new Error('Invalid data structure');
  }
}
```

---

## 📚 相关资源

- [ESA Pages 官方文档](https://help.aliyun.com/document_detail/...)
- [EdgeKV API 参考](https://help.aliyun.com/zh/edge-security-acceleration/esa/user-guide/edge-storage-1/)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)

---

## 🎉 快速部署检查清单

- [ ] 安装依赖: `npm install`
- [ ] 本地测试: `npm run dev`
- [ ] 构建项目: `npm run build`
- [ ] 创建 EdgeKV 命名空间: `whiteboard`
- [ ] 配置环境变量: `ESA_NAMESPACE=whiteboard`
- [ ] 上传 functions 目录
- [ ] 部署到 ESA Pages: `npm run deploy`
- [ ] 测试 API: `GET /api/whiteboard/default`
- [ ] 验证数据保存功能

---

**部署成功后,享受全球边缘加速的白板应用! 🚀**
