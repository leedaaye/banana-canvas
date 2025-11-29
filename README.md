<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# 🍌 Banana Canvas - AI 绘图工坊

一个功能强大、界面精美的 AI 图像生成 Web 应用

基于 Gemini API 的智能图像生成工具，支持文生图、参考图生图，提供完整的历史管理功能



</div>

---

## ✨ 功能特性

### 🎨 AI 图像生成
- **文生图**：通过文本提示词生成高质量图像
- **参考图生图**：上传参考图片（最大 5MB），基于参考图生成新图像
- **双模型支持**：
  - **Nano Banana**（快速模式）：使用 `gemini-2.5-flash-image`，快速生成
  - **Nano Banana Pro**（高质量模式）：使用 `gemini-3-pro-image-preview`，支持 4K 分辨率

### ⚙️ 灵活的生成参数
- **宽高比选择**：Default、1:1、3:4、4:3、9:16、16:9
- **分辨率选择**：1K、2K、4K（仅 Pro 模式支持）
- **提示词输入**：最多 2000 字符，实时字符计数

### 📚 历史画廊管理
- **本地持久化**：使用 IndexedDB 存储，无需后端
- **响应式网格布局**：自适应不同屏幕尺寸
- **批量操作**：
  - 批量选择图片
  - 批量下载（ZIP 打包）
  - 批量删除（带确认提示）
- **单图详情**：
  - 灯箱预览
  - 查看生成参数
  - 复制提示词
  - 下载图片
  - 复用参数重新生成
  - 删除图片

### 🔧 代理服务配置
- **自定义 Base URL**：支持 New API、One API 等代理服务
- **API Key 管理**：安全存储在 localStorage
- **模型映射**：可自定义 Nano 和 Pro 模型的实际 ID
- **双 API 策略**：
  - 优先使用原生 Google API（支持严格宽高比和 4K）
  - 自动降级到 OpenAI 兼容 API（通过提示词工程实现参数控制）

### 🎯 用户体验
- **暗色主题**：专业的深色 UI，香蕉黄主题色
- **流畅动画**：过渡动画和加载状态
- **实时反馈**：字符计数、加载进度、错误提示
- **响应式设计**：完美适配桌面和移动设备

---

## 🚀 快速开始

### 环境要求

- **Node.js**：>= 18.0.0
- **包管理器**：pnpm（推荐）/ npm / yarn

### 安装步骤

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd banana-canvas
   ```

2. **安装依赖**
   ```bash
   pnpm install
   # 或
   npm install
   ```

3. **配置环境变量**

   编辑 [.env.local](.env.local) 文件，设置你的 Gemini API Key：
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

   > **注意**：你也可以在应用运行后，通过右上角的设置按钮配置 API Key 和代理服务。

4. **启动开发服务器**
   ```bash
   pnpm dev
   # 或
   npm run dev
   ```

5. **访问应用**

   打开浏览器访问：[http://localhost:3000](http://localhost:3000)

---

## 📦 构建部署

### 构建生产版本

```bash
pnpm build
# 或
npm run build
```

构建产物将输出到 `dist/` 目录。

### 预览生产版本

```bash
pnpm preview
# 或
npm run preview
```

### 部署

构建完成后，可以将 `dist/` 目录部署到任何静态托管服务：

- **Vercel**：`vercel deploy`
- **Netlify**：拖拽 `dist/` 目录到 Netlify
- **GitHub Pages**：推送到 `gh-pages` 分支
- **其他**：任何支持静态文件的服务器

---

## 🛠️ 技术栈

### 前端框架
- **React** 19.2.0 - UI 框架
- **TypeScript** 5.8.2 - 类型安全
- **Vite** 6.2.0 - 构建工具

### UI 组件
- **Tailwind CSS** - 样式框架（通过 CDN）
- **Lucide React** 0.555.0 - 图标库

### 核心服务
- **Gemini API** - AI 图像生成
- **IndexedDB** - 本地数据存储

---

## 📁 项目结构

```
banana-canvas/
├── index.html                    # HTML 入口
├── index.tsx                     # React 入口
├── App.tsx                       # 主应用组件
├── types.ts                      # TypeScript 类型定义
├── vite.config.ts                # Vite 配置
├── tsconfig.json                 # TypeScript 配置
├── package.json                  # 项目依赖
├── .env.local                    # 环境变量
├── .gitignore                    # Git 忽略规则
├── components/
│   ├── SettingsDialog.tsx        # 设置对话框
│   └── ImageDetailModal.tsx      # 图片详情模态框
└── services/
    ├── geminiService.ts          # Gemini API 服务
    └── storage.ts                # IndexedDB 存储服务
```

---

## 🔑 配置说明

### 环境变量

在 `.env.local` 文件中配置：

```env
GEMINI_API_KEY=your_gemini_api_key
```

### 应用内设置

点击右上角的设置图标，可以配置：

1. **Base URL**：Gemini API 地址或代理服务地址
   - 默认：`https://generativelanguage.googleapis.com/v1beta`
   - 代理示例：`https://api.your-proxy.com/v1`

2. **API Key**：你的 Gemini API Key

3. **模型映射**（可选）：
   - Nano 模型 ID：默认 `gemini-2.5-flash-image`
   - Pro 模型 ID：默认 `gemini-3-pro-image-preview`

---

## 💡 使用技巧

### 提示词编写
- 使用详细、具体的描述
- 包含风格、色彩、构图等细节
- 参考优秀的提示词模板

### 参考图使用
- 支持 JPG、PNG、WebP 格式
- 文件大小不超过 5MB
- 参考图会影响生成结果的风格和构图

### 模型选择
- **Nano Banana**：适合快速预览和测试
- **Nano Banana Pro**：适合高质量输出和 4K 分辨率

### 历史管理
- 所有生成记录自动保存到本地
- 可随时查看、下载、复用历史记录
- 支持批量操作提高效率

---

## 🐛 常见问题

### Q: API Key 如何获取？
A: 访问 [Google AI Studio](https://aistudio.google.com/app/apikey) 获取免费的 Gemini API Key。

### Q: 为什么生成失败？
A: 请检查：
- API Key 是否正确
- 网络连接是否正常
- Base URL 是否配置正确
- 提示词是否符合内容政策

### Q: 如何使用代理服务？
A: 在设置中配置代理服务的 Base URL 和对应的 API Key。

### Q: 历史记录存储在哪里？
A: 使用浏览器的 IndexedDB 本地存储，数据不会上传到服务器。

### Q: 如何清除历史记录？
A: 在历史画廊中选择图片后，点击删除按钮。或清除浏览器数据。

---

## 📄 开源协议

本项目基于 MIT 协议开源。

---

## 🙏 致谢

- [Google Gemini](https://ai.google.dev/) - 提供强大的 AI 图像生成能力
- [React](https://react.dev/) - 优秀的 UI 框架
- [Vite](https://vitejs.dev/) - 快速的构建工具
- [Tailwind CSS](https://tailwindcss.com/) - 实用的样式框架
- [Lucide](https://lucide.dev/) - 精美的图标库

---

## 📮 反馈与贡献

欢迎提交 Issue 和 Pull Request！

如有问题或建议，请通过以下方式联系：
- 提交 [GitHub Issue](../../issues)
- 访问 [AI Studio 应用页面](https://ai.studio/apps/drive/1FUwi1w4-NzdefIWsUscjULs0Tk1-lXSE)

---

<div align="center">

**享受 AI 创作的乐趣！** 🎨✨

Made with ❤️ by Banana Canvas Team

</div>
