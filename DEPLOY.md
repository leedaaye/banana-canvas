# 部署指南

## 🚀 Vercel 部署

### 方法一：通过 Vercel Dashboard（推荐）

1. **登录 Vercel**
   - 访问 [vercel.com](https://vercel.com)
   - 使用 GitHub 账号登录

2. **导入项目**
   - 点击 "Add New..." → "Project"
   - 选择你的 GitHub 仓库
   - 点击 "Import"

3. **配置项目**
   - **Framework Preset**: Vite（自动检测）
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

   > 注意：已配置使用 npm 而不是 pnpm，以避免 Vercel 环境中的网络问题

4. **环境变量（可选）**
   - 环境变量是可选的，应用支持运行时配置
   - 如需配置，添加：`GEMINI_API_KEY=your_key`

5. **部署**
   - 点击 "Deploy"
   - 等待构建完成（约 1-2 分钟）

### 方法二：通过 Vercel CLI

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署
vercel

# 部署到生产环境
vercel --prod
```

## 📦 其他部署平台

### Netlify

1. **通过 Netlify Dashboard**
   - 登录 [netlify.com](https://netlify.com)
   - 点击 "Add new site" → "Import an existing project"
   - 连接 GitHub 仓库
   - 配置：
     - Build command: `npm run build`
     - Publish directory: `dist`
   - 点击 "Deploy site"

2. **通过拖拽部署**
   - 本地运行 `npm run build`
   - 将 `dist/` 目录拖拽到 Netlify Dashboard

### GitHub Pages

```bash
# 安装 gh-pages
npm install -D gh-pages

# 添加部署脚本到 package.json
# "deploy": "npm run build && gh-pages -d dist"

# 部署
npm run deploy
```

### Cloudflare Pages

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 "Pages" → "Create a project"
3. 连接 GitHub 仓库
4. 配置：
   - Build command: `npm run build`
   - Build output directory: `dist`
5. 点击 "Save and Deploy"

## 🔧 部署问题排查

### 问题 1：pnpm 安装失败

**错误信息**：
```
ERR_PNPM_META_FETCH_FAIL GET https://registry.npmjs.org/...
```

**解决方案**：
- 已将 `vercel.json` 改为使用 `npm install`
- 创建了 `.npmrc` 配置文件优化网络设置

### 问题 2：构建超时

**解决方案**：
- 检查依赖版本是否正确
- 确保 `package.json` 中没有不必要的依赖
- 使用 npm 而不是 pnpm（更稳定）

### 问题 3：路由 404

**解决方案**：
- 已在 `vercel.json` 中配置 SPA 路由重写
- 确保 `outputDirectory` 设置为 `dist`

### 问题 4：环境变量未生效

**解决方案**：
- 应用支持运行时配置，环境变量是可选的
- 在 Vercel Dashboard 的 "Settings" → "Environment Variables" 中添加
- 变量名：`GEMINI_API_KEY`

## ✅ 部署检查清单

部署前确保：

- [ ] 代码已推送到 GitHub
- [ ] `.gitignore` 正确配置（排除 `node_modules`、`.env.local` 等）
- [ ] `vercel.json` 配置正确
- [ ] `.npmrc` 文件已创建
- [ ] 本地构建测试通过（`npm run build`）
- [ ] 环境变量已配置（如需要）

## 🎯 部署后操作

1. **测试应用**
   - 访问部署后的 URL
   - 测试图像生成功能
   - 检查历史记录功能

2. **配置 API Key**
   - 点击右上角设置图标
   - 输入 Gemini API Key
   - 配置代理服务（如需要）

3. **自定义域名（可选）**
   - 在 Vercel Dashboard 中添加自定义域名
   - 配置 DNS 记录

## 📝 更新部署

### 自动部署

Vercel 会自动监听 GitHub 仓库：
- 推送到 `main` 分支 → 自动部署到生产环境
- 推送到其他分支 → 自动创建预览部署

### 手动部署

```bash
# 推送代码
git add .
git commit -m "更新说明"
git push origin main

# Vercel 会自动触发部署
```

## 🔗 有用的链接

- [Vercel 文档](https://vercel.com/docs)
- [Vite 部署指南](https://vitejs.dev/guide/static-deploy.html)
- [Netlify 文档](https://docs.netlify.com/)
- [GitHub Pages 文档](https://docs.github.com/pages)
